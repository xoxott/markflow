import { parseStreamMessage } from './parseStreamMessage';
import { streamLogger } from './logger';
import type { ParseStreamMessageFn, StreamAuthOptions } from './types';

const defaultConfig: Partial<Stream.ConnectionConfig> = {
  timeout: 30000,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  withCredentials: false
};

/* eslint-disable no-param-reassign */
export class StreamClient {
  private connections = new Map<string, Stream.Connection>();

  private authOptions: StreamAuthOptions = {
    getHeaders: () => ({})
  };

  private parseMessage: ParseStreamMessageFn = parseStreamMessage;

  configureAuth(options: StreamAuthOptions): void {
    this.authOptions = options;
  }

  setParseMessage(fn: ParseStreamMessageFn): void {
    this.parseMessage = fn;
  }

  private startConnection(connection: Stream.Connection): void {
    this.openConnection(connection).catch(() => {
      // Errors are handled inside openConnection
    });
  }

  connect(connectionId: string, config: Stream.ConnectionConfig): Stream.Connection {
    if (this.connections.has(connectionId)) {
      const existing = this.connections.get(connectionId)!;
      existing.refCount += 1;
      if (existing.status === 'disconnected' || existing.status === 'error') {
        this.startConnection(existing);
      }
      return existing;
    }

    const mergedConfig: Stream.ConnectionConfig = {
      ...defaultConfig,
      ...config
    };

    const connection: Stream.Connection = {
      id: connectionId,
      status: 'connecting',
      config: mergedConfig,
      listeners: new Map(),
      statusListeners: new Set(),
      reconnectAttempts: 0,
      refCount: 1
    };

    this.startConnection(connection);
    this.connections.set(connectionId, connection);

    return connection;
  }

  private buildRequestHeaders(connection: Stream.Connection): Headers {
    const headers = new Headers();
    headers.set('Accept', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');

    const serviceHeaders = this.authOptions.getHeaders();
    Object.entries(serviceHeaders).forEach(([key, value]) => {
      if (value) {
        headers.set(key, value);
      }
    });

    if (connection.config.headers) {
      Object.entries(connection.config.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, value);
        }
      });
    }

    return headers;
  }

  private async handleUnauthorized(connection: Stream.Connection): Promise<boolean> {
    connection.status = 'error';
    this.notifyStatusChange(connection, 'error', new Error('Unauthorized: Token expired'));
    connection.abortController = undefined;

    const onUnauthorized = this.authOptions.onUnauthorized;
    if (!onUnauthorized) {
      return false;
    }

    streamLogger.debug(`Connection "${connection.id}" refreshing auth after 401`);
    const refreshed = await onUnauthorized();
    if (refreshed) {
      connection.reconnectAttempts = 0;
      if (connection.reconnectTimer) {
        clearTimeout(connection.reconnectTimer);
        connection.reconnectTimer = undefined;
      }
      this.startConnection(connection);
    }
    return refreshed;
  }

  private async openConnection(connection: Stream.Connection): Promise<void> {
    try {
      if (connection.abortController) {
        connection.abortController.abort();
      }

      connection.status = 'connecting';
      this.notifyStatusChange(connection, 'connecting');

      const abortController = new AbortController();
      connection.abortController = abortController;

      const response = await fetch(connection.config.url, {
        method: 'GET',
        headers: this.buildRequestHeaders(connection),
        credentials: connection.config.withCredentials ? 'include' : 'same-origin',
        signal: abortController.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.handleUnauthorized(connection);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      connection.status = 'connected';
      connection.reconnectAttempts = 0;
      this.notifyStatusChange(connection, 'connected');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentData = '';
        for (const line of lines) {
          if (line.trim() === '') {
            if (currentData) {
              const message = this.parseMessage(currentData, connection.id);
              if (message) {
                this.dispatchMessage(connection, message);
              }
              currentData = '';
            }
            continue;
          }

          if (line.startsWith('data: ')) {
            currentData = line.substring(6).trim();
          }
        }

        if (currentData && buffer === '') {
          const message = this.parseMessage(currentData, connection.id);
          if (message) {
            this.dispatchMessage(connection, message);
          }
        }
      }

      if (connection.status === 'connected' && connection.config.autoReconnect) {
        this.scheduleReconnect(connection);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      this.handleError(connection, error);
    }
  }

  private dispatchMessage(connection: Stream.Connection, message: Stream.StreamMessage): void {
    switch (message.type) {
      case 'connected':
        connection.status = 'connected';
        connection.reconnectAttempts = 0;
        this.notifyStatusChange(connection, 'connected');
        break;

      case 'data':
        if (message.data) {
          const listeners = connection.listeners.get('data') || new Set();
          listeners.forEach(listener => {
            try {
              listener(
                message.data,
                new MessageEvent('data', { data: JSON.stringify(message.data) })
              );
            } catch {
              // ignore listener errors
            }
          });
        }
        break;

      case 'heartbeat':
        break;

      case 'error': {
        const err = new Error(message.error || 'Unknown error');
        this.handleError(connection, err);
        break;
      }

      default:
        break;
    }
  }

  private handleError(connection: Stream.Connection, error: unknown): void {
    connection.status = 'error';
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    this.notifyStatusChange(connection, 'error', errorObj);

    if (connection.abortController) {
      connection.abortController.abort();
      connection.abortController = undefined;
    }

    const isUnauthorized =
      errorObj.message.includes('401') || errorObj.message.includes('Unauthorized');

    if (connection.config.autoReconnect && !isUnauthorized) {
      this.scheduleReconnect(connection);
    }
  }

  private scheduleReconnect(connection: Stream.Connection): void {
    if (connection.reconnectAttempts >= (connection.config.maxReconnectAttempts || 5)) {
      connection.status = 'error';
      this.notifyStatusChange(connection, 'error', new Error('Max reconnect attempts reached'));
      return;
    }

    connection.reconnectAttempts += 1;
    connection.status = 'reconnecting';
    this.notifyStatusChange(connection, 'reconnecting');

    const baseDelay = connection.config.reconnectDelay || 1000;
    const maxDelay = connection.config.maxReconnectDelay || 30000;
    const delay = Math.min(baseDelay * 2 ** (connection.reconnectAttempts - 1), maxDelay);

    connection.reconnectTimer = window.setTimeout(() => {
      this.startConnection(connection);
    }, delay);
  }

  subscribe<T = unknown>(
    connectionId: string,
    eventType: string | 'message',
    listener: Stream.EventListener<T>
  ): () => void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return () => {};
    }

    if (!connection.listeners.has(eventType)) {
      connection.listeners.set(eventType, new Set<Stream.EventListener>());
    }

    connection.listeners.get(eventType)!.add(listener as Stream.EventListener);

    return () => {
      const listeners = connection.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener as Stream.EventListener);
        if (listeners.size === 0) {
          connection.listeners.delete(eventType);
        }
      }
    };
  }

  onStatusChange(connectionId: string, listener: Stream.StatusChangeListener): () => void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return () => {};
    }

    connection.statusListeners.add(listener);

    return () => {
      connection.statusListeners.delete(listener);
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private notifyStatusChange(
    connection: Stream.Connection,
    status: Stream.ConnectionStatus,
    error?: Error
  ): void {
    connection.statusListeners.forEach(listener => {
      try {
        listener(status, error);
      } catch {
        // ignore listener errors
      }
    });
  }

  disconnect(connectionId: string, force = false): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    connection.refCount -= 1;

    if (connection.refCount > 0 && !force) {
      return;
    }

    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
      connection.reconnectTimer = undefined;
    }

    if (connection.abortController) {
      connection.abortController.abort();
      connection.abortController = undefined;
    }

    connection.listeners.clear();
    connection.statusListeners.clear();

    connection.status = 'disconnected';
    this.notifyStatusChange(connection, 'disconnected');

    this.connections.delete(connectionId);
  }

  getStatus(connectionId: string): Stream.ConnectionStatus | null {
    return this.connections.get(connectionId)?.status || null;
  }

  getConnection(connectionId: string): Stream.Connection | null {
    return this.connections.get(connectionId) || null;
  }

  hasConnection(connectionId: string): boolean {
    return this.connections.has(connectionId);
  }

  disconnectAll(): void {
    const connectionIds = Array.from(this.connections.keys());
    for (const id of connectionIds) {
      this.disconnect(id, true);
    }
  }

  /** Reconnect connections in error/disconnected state (e.g. after token refresh fallback) */
  reconnectAll(): void {
    for (const connection of this.connections.values()) {
      if (connection.status === 'error' || connection.status === 'disconnected') {
        if (connection.reconnectTimer) {
          clearTimeout(connection.reconnectTimer);
          connection.reconnectTimer = undefined;
        }
        connection.reconnectAttempts = 0;
        this.startConnection(connection);
      }
    }
  }
}
