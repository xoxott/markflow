import { getServiceBaseURL } from '@/utils/service';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export type MonitoringEventType = Api.Monitoring.StreamEventType;
export type MonitoringEventData = Api.Monitoring.StreamEventData;

/** Monitoring stream connection IDs */
export const MONITORING_STREAM_CONNECTION_IDS: Record<
  Exclude<MonitoringEventType, 'environment'>,
  string
> = {
  health: 'monitoring-health',
  liveness: 'monitoring-liveness',
  readiness: 'monitoring-readiness',
  metrics: 'monitoring-metrics',
  system: 'monitoring-system',
  performance: 'monitoring-performance'
} as const;

const STREAM_PATHS: Record<MonitoringEventType, string> = {
  health: '/api/admin/health/stream',
  liveness: '/api/admin/health/liveness/stream',
  readiness: '/api/admin/health/readiness/stream',
  metrics: '/api/admin/monitoring/metrics/summary/stream',
  system: '/api/admin/system/info/stream',
  performance: '/api/admin/system/performance/stream',
  environment: '/api/admin/system/environment/stream'
};

export function getMonitoringStreamPath(eventType: MonitoringEventType): string {
  return STREAM_PATHS[eventType];
}

export function getMonitoringStreamUrl(eventType: MonitoringEventType): string {
  return `${baseURL}${getMonitoringStreamPath(eventType)}`;
}

/** Stream connection config for a monitoring event type (auth headers applied by StreamClient) */
export function createMonitoringStreamConfig(
  eventType: MonitoringEventType
): Stream.ConnectionConfig {
  return {
    url: getMonitoringStreamUrl(eventType),
    timeout: 30000,
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    withCredentials: false
  };
}

export type MonitoringEventListener<T extends MonitoringEventType = MonitoringEventType> = (
  data: MonitoringEventData[T],
  event: MessageEvent
) => void;
