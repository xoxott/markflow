/** Server-Sent Events / long-lived stream connection types */
declare namespace Stream {
  /** Stream connection status */
  type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

  /** Stream connection configuration */
  interface ConnectionConfig {
    /** Stream endpoint URL */
    url: string;
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Enable auto reconnect */
    autoReconnect?: boolean;
    /** Max reconnect attempts */
    maxReconnectAttempts?: number;
    /** Reconnect delay in milliseconds (exponential backoff base) */
    reconnectDelay?: number;
    /** Max reconnect delay in milliseconds */
    maxReconnectDelay?: number;
    /** Extra headers merged after service auth headers */
    headers?: Record<string, string>;
    /** Query parameters */
    params?: Record<string, string>;
    /** With credentials */
    withCredentials?: boolean;
  }

  /** Parsed stream message from backend */
  interface StreamMessage {
    /** Message type */
    type: 'connected' | 'data' | 'heartbeat' | 'error';
    /** Timestamp */
    timestamp: string;
    /** Message data (for type='data') */
    data?: any;
    /** Error message (for type='error') */
    error?: string;
  }

  /** Event listener callback */
  type EventListener<T = any> = (data: T, event: MessageEvent) => void;

  /** Connection status change callback */
  type StatusChangeListener = (status: ConnectionStatus, error?: Error) => void;

  /** Stream connection instance */
  interface Connection {
    /** Connection ID */
    id: string;
    /** Connection status */
    status: ConnectionStatus;
    /** Connection config */
    config: ConnectionConfig;
    /** Event listeners */
    listeners: Map<string, Set<EventListener>>;
    /** Status change listeners */
    statusListeners: Set<StatusChangeListener>;
    /** AbortController for fetch request */
    abortController?: AbortController;
    /** Reconnect attempts count */
    reconnectAttempts: number;
    /** Reconnect timer */
    reconnectTimer?: number;
    /** Reference count */
    refCount: number;
  }
}
