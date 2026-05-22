import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { streamClient } from '@/service/request';
import { getAuthorization } from '@/service/request/auth';

export interface StreamConnectionDef {
  id: string;
  getConfig: () => Stream.ConnectionConfig;
}

export interface UseStreamOptions {
  connections: StreamConnectionDef[];
  autoConnect?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  /** Skip connect when returns true (e.g. static demo) */
  shouldSkipConnect?: () => boolean;
  /** Called when no auth token is available */
  onMissingAuth?: () => void;
}

export interface UseStreamReturn {
  status: Ref<Stream.ConnectionStatus>;
  isConnected: ComputedRef<boolean>;
  isConnecting: ComputedRef<boolean>;
  isReconnecting: ComputedRef<boolean>;
  error: Ref<Error | null>;
  connect: () => void;
  disconnect: () => void;
  subscribe: <T = unknown>(connectionId: string, listener: Stream.EventListener<T>) => () => void;
  onStatusChange: (connectionId: string, listener: Stream.StatusChangeListener) => () => void;
  getConnectionStatus: (connectionId: string) => Stream.ConnectionStatus | null;
}

function aggregateStatus(statuses: Stream.ConnectionStatus[]): Stream.ConnectionStatus {
  if (statuses.length === 0) {
    return 'disconnected';
  }
  if (statuses.includes('error')) {
    return 'error';
  }
  if (statuses.some(s => s === 'connecting' || s === 'reconnecting')) {
    return statuses.includes('reconnecting') ? 'reconnecting' : 'connecting';
  }
  if (statuses.every(s => s === 'connected')) {
    return 'connected';
  }
  return 'disconnected';
}

export function useStream(options: UseStreamOptions): UseStreamReturn {
  const {
    connections,
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    shouldSkipConnect,
    onMissingAuth
  } = options;

  const status = ref<Stream.ConnectionStatus>('disconnected');
  const error = ref<Error | null>(null);
  const unsubscribeFunctions: Array<() => void> = [];

  const isConnected = computed(() => status.value === 'connected');
  const isConnecting = computed(() => status.value === 'connecting');
  const isReconnecting = computed(() => status.value === 'reconnecting');

  const updateOverallStatus = () => {
    const statuses = connections
      .map(def => streamClient.getStatus(def.id))
      .filter(Boolean) as Stream.ConnectionStatus[];
    status.value = aggregateStatus(statuses);
  };

  const connect = () => {
    if (shouldSkipConnect?.()) {
      status.value = 'disconnected';
      return;
    }

    if (!getAuthorization()) {
      error.value = new Error('No authentication token available');
      status.value = 'error';
      onMissingAuth?.();
      return;
    }

    connections.forEach(def => {
      const config = def.getConfig();
      config.autoReconnect = autoReconnect;
      config.maxReconnectAttempts = maxReconnectAttempts;

      streamClient.connect(def.id, config);

      const unsubscribeStatus = streamClient.onStatusChange(def.id, (_newStatus, err) => {
        updateOverallStatus();
        if (err) {
          error.value = err;
        }
      });

      unsubscribeFunctions.push(unsubscribeStatus);
    });

    updateOverallStatus();
  };

  const disconnect = () => {
    unsubscribeFunctions.forEach(fn => fn());
    unsubscribeFunctions.length = 0;

    connections.forEach(def => {
      streamClient.disconnect(def.id, false);
    });

    status.value = 'disconnected';
    error.value = null;
  };

  const subscribe = <T = unknown>(
    connectionId: string,
    listener: Stream.EventListener<T>
  ): (() => void) => {
    if (!streamClient.hasConnection(connectionId)) {
      return () => {};
    }

    const unsubscribe = streamClient.subscribe(
      connectionId,
      'data',
      listener as Stream.EventListener
    );
    unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  };

  const onStatusChange = (
    connectionId: string,
    listener: Stream.StatusChangeListener
  ): (() => void) => {
    const unsubscribe = streamClient.onStatusChange(connectionId, listener);
    unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  };

  const getConnectionStatus = (connectionId: string) => streamClient.getStatus(connectionId);

  if (autoConnect) {
    connect();
  } else {
    connections.forEach(def => {
      const existing = streamClient.getConnection(def.id);
      if (existing) {
        existing.refCount += 1;
      }
    });
  }

  watch(
    () => getAuthorization(),
    newAuth => {
      if (!newAuth && status.value === 'connected') {
        disconnect();
      }
    }
  );

  onBeforeUnmount(() => {
    disconnect();
  });

  return {
    status,
    isConnected,
    isConnecting,
    isReconnecting,
    error,
    connect,
    disconnect,
    subscribe,
    onStatusChange,
    getConnectionStatus
  };
}
