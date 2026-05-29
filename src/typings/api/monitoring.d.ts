/** Monitoring API types */

declare namespace Api {
  /**
   * namespace Monitoring
   *
   * backend api module: "monitoring"
   */
  namespace Monitoring {
    /** Monitoring SSE stream event types */
    /** SSE stream event types (environment uses GET /api/admin/system/environment) */
    type StreamEventType =
      | 'health'
      | 'liveness'
      | 'readiness'
      | 'metrics'
      | 'system'
      | 'performance';

    /** Monitoring SSE event payloads by stream type */
    interface StreamEventData {
      health: Api.Health.HealthCheckResponse;
      liveness: Api.Health.LivenessResponse;
      readiness: Api.Health.ReadinessResponse;
      metrics: MetricsSummary;
      system: Api.System.SystemInfo;
      performance: Api.System.PerformanceMetrics;
    }

    /** Metrics summary */
    interface MetricsSummary {
      /** Memory usage */
      memory?: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      /** CPU usage */
      cpu?: {
        user: number;
        system: number;
      };
      /** Process uptime in seconds */
      uptime?: number;
      /** Timestamp */
      timestamp?: string;
      [key: string]: any;
    }
  }
}
