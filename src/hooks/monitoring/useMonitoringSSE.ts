import type { Ref } from 'vue';
import {
  MONITORING_STREAM_CONNECTION_IDS,
  type MonitoringEventListener,
  type MonitoringEventType,
  createMonitoringStreamConfig
} from '@/service/api/monitoring-stream';
import { useStream } from '@/hooks/common/use-stream';
import { isStaticDemo } from '@/utils/env/static-demo';
import { throttle } from '@/utils/debounce';

export type { MonitoringEventType, MonitoringEventListener };

/** Monitoring SSE Hook Options */
export interface UseMonitoringSSEOptions {
  autoConnect?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

/** Monitoring SSE Hook Return Type */
export interface UseMonitoringSSEReturn {
  status: Ref<Stream.ConnectionStatus>;
  isConnected: Ref<boolean>;
  isConnecting: Ref<boolean>;
  isReconnecting: Ref<boolean>;
  error: Ref<Error | null>;
  connect: () => void;
  disconnect: () => void;
  onHealth: (listener: MonitoringEventListener<'health'>) => () => void;
  onLiveness: (listener: MonitoringEventListener<'liveness'>) => () => void;
  onReadiness: (listener: MonitoringEventListener<'readiness'>) => () => void;
  onMetrics: (listener: MonitoringEventListener<'metrics'>) => () => void;
  onSystem: (listener: MonitoringEventListener<'system'>) => () => void;
  onPerformance: (listener: MonitoringEventListener<'performance'>) => () => void;
  onEnvironment: (listener: MonitoringEventListener<'environment'>) => () => void;
  onAll: (listener: (eventType: MonitoringEventType, data: unknown) => void) => () => void;
}

const MONITORING_EVENT_TYPES = [
  'health',
  'liveness',
  'readiness',
  'metrics',
  'system',
  'performance'
] as const satisfies readonly Exclude<MonitoringEventType, 'environment'>[];

const connectionDefs = MONITORING_EVENT_TYPES.map(eventType => ({
  id: MONITORING_STREAM_CONNECTION_IDS[eventType],
  getConfig: () => createMonitoringStreamConfig(eventType)
}));

export function useMonitoringSSE(options: UseMonitoringSSEOptions = {}): UseMonitoringSSEReturn {
  const { autoConnect = true, autoReconnect = true, maxReconnectAttempts = 5 } = options;

  const stream = useStream({
    connections: connectionDefs,
    autoConnect,
    autoReconnect,
    maxReconnectAttempts,
    shouldSkipConnect: isStaticDemo
  });

  const subscribeEvent = <T extends Exclude<MonitoringEventType, 'environment'>>(
    eventType: T,
    listener: MonitoringEventListener<T>
  ): (() => void) => {
    const connectionId = MONITORING_STREAM_CONNECTION_IDS[eventType];

    const throttledListener = throttle(
      (actualData: Api.Monitoring.StreamEventData[T], event: MessageEvent) => {
        listener(actualData, event);
      },
      100
    );

    return stream.subscribe(connectionId, (data: unknown) => {
      if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        if (record.eventType && record.eventType !== eventType) {
          return;
        }
        const actualData = (
          record.data !== undefined ? record.data : data
        ) as Api.Monitoring.StreamEventData[T];
        throttledListener(
          actualData,
          new MessageEvent('data', { data: JSON.stringify(actualData) })
        );
      } else {
        throttledListener(
          data as Api.Monitoring.StreamEventData[T],
          new MessageEvent('data', { data: JSON.stringify(data) })
        );
      }
    });
  };

  const onHealth = (listener: MonitoringEventListener<'health'>) =>
    subscribeEvent('health', listener);
  const onLiveness = (listener: MonitoringEventListener<'liveness'>) =>
    subscribeEvent('liveness', listener);
  const onReadiness = (listener: MonitoringEventListener<'readiness'>) =>
    subscribeEvent('readiness', listener);
  const onMetrics = (listener: MonitoringEventListener<'metrics'>) =>
    subscribeEvent('metrics', listener);
  const onSystem = (listener: MonitoringEventListener<'system'>) =>
    subscribeEvent('system', listener);
  const onPerformance = (listener: MonitoringEventListener<'performance'>) =>
    subscribeEvent('performance', listener);

  const onEnvironment = (_listener: MonitoringEventListener<'environment'>) => () => {};

  const onAll = (listener: (eventType: MonitoringEventType, data: unknown) => void) => {
    const unsubscribes = MONITORING_EVENT_TYPES.map(eventType =>
      subscribeEvent(eventType, data => {
        listener(eventType, data);
      })
    );
    return () => {
      unsubscribes.forEach(fn => fn());
    };
  };

  return {
    status: stream.status,
    isConnected: stream.isConnected,
    isConnecting: stream.isConnecting,
    isReconnecting: stream.isReconnecting,
    error: stream.error,
    connect: stream.connect,
    disconnect: stream.disconnect,
    onHealth,
    onLiveness,
    onReadiness,
    onMetrics,
    onSystem,
    onPerformance,
    onEnvironment,
    onAll
  };
}
