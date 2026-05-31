/** Log Management API types (ai-server admin/logs) */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace LogManagement {
    /** ai-server log type */
    type LogType = 'access' | 'audit';

    /** Access log entity (ai-server AccessLogOutput) */
    interface Log {
      id: number;
      logType: LogType;
      username?: string | null;
      userId: number | null;
      method: string;
      path: string;
      statusCode: number;
      ip: string;
      responseTime: number;
      error: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: string;
      isSuccessful: boolean;
      hasError: boolean;
    }

    /** List query (ai-server LogQueryDto + PaginationDto) */
    interface LogListParams extends Common.PaginationParams {
      logType?: LogType;
      search?: string;
      userId?: number;
      ip?: string;
      statusCode?: number;
      method?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }

    interface BatchDeleteLogsRequest {
      ids: number[];
    }

    interface BatchDeleteLogFailure {
      id: number;
      reason: string;
    }

    interface BatchDeleteLogsResponse {
      deletedCount: number;
      failedIds: number[];
      failures: BatchDeleteLogFailure[];
    }

    type DeleteOldLogsResponse = number;

    type LogListResponse = ListData<Log>;
    type LogDetailResponse = Log;
    type DeleteLogResponse = null;
  }
}
