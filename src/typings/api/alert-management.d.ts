/** Alert Management API types (ai-server admin/alerts) */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace AlertManagement {
    /** ai-server AlertType */
    type AlertType = 'system' | 'performance' | 'security' | 'database' | 'custom';

    /** ai-server AlertLevel */
    type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

    /** ai-server AlertStatus */
    type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

    /** Alert entity (ai-server AlertOutput) */
    interface Alert {
      id: number;
      type: AlertType;
      level: AlertLevel;
      status: AlertStatus;
      title: string;
      message: string;
      source: string | null;
      metadata: Record<string, unknown> | null;
      acknowledgedAt: string | null;
      acknowledgedBy: number | null;
      resolvedAt: string | null;
      resolvedBy: number | null;
      notified: boolean;
      notificationChannels: string[] | null;
      createdAt: string;
      updatedAt: string;
      isCritical: boolean;
      isPending: boolean;
      isResolved: boolean;
    }

    /** List query (ai-server FilterAlertsDto + PaginationDto) */
    interface AlertListParams extends Common.PaginationParams {
      search?: string;
      type?: AlertType;
      level?: AlertLevel;
      status?: AlertStatus;
      source?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }

    /** Create body (ai-server CreateAlertDto) */
    interface CreateAlertRequest {
      type: AlertType;
      level: AlertLevel;
      title: string;
      message: string;
      source?: string;
      metadata?: Record<string, unknown>;
    }

    /** Update body (ai-server UpdateAlertDto) */
    type UpdateAlertRequest = Partial<CreateAlertRequest>;

    interface BatchDeleteAlertsRequest {
      ids: number[];
    }

    interface BatchDeleteAlertFailure {
      id: number;
      reason: string;
    }

    interface BatchDeleteAlertsResponse {
      deletedCount: number;
      failedIds: number[];
      failures: BatchDeleteAlertFailure[];
    }

    type AlertListResponse = ListData<Alert>;
    type AlertDetailResponse = Alert;
    type CreateAlertResponse = Alert;
    type UpdateAlertResponse = Alert;
    type DeleteAlertResponse = null;
    type AcknowledgeAlertResponse = Alert;
    type ResolveAlertResponse = Alert;
  }
}
