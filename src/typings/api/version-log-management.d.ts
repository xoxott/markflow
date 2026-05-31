/** Version Log Management API types (ai-server admin/changelogs) */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace VersionLogManagement {
    /** ai-server ChangeType */
    type ChangeType = 'feature' | 'fix' | 'improvement' | 'breaking' | 'security' | 'deprecated';

    interface ChangeItem {
      type: ChangeType;
      description: string;
      pr?: string;
      issue?: string;
    }

    /** Changelog entity (ai-server ChangelogOutput) */
    interface VersionLog {
      id: number;
      version: string;
      title: string;
      description: string | null;
      changes: ChangeItem[];
      releaseDate: string;
      releasedBy: number | null;
      isPrerelease: boolean;
      breakingChanges: string[] | null;
      deprecations: string[] | null;
      metadata: Record<string, unknown> | null;
      createdAt: string;
      updatedAt: string;
      hasBreakingChanges: boolean;
      hasDeprecations: boolean;
    }

    /** List query (ai-server ChangelogFilterDto + PaginationDto) */
    interface VersionLogListParams extends Common.PaginationParams {
      search?: string;
      version?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }

    /** Create body (ai-server CreateChangelogDto) */
    interface CreateVersionLogRequest {
      version: string;
      title: string;
      description?: string;
      changes: ChangeItem[];
      releaseDate: string;
      metadata?: Record<string, unknown>;
    }

    /** Update body (ai-server UpdateChangelogDto — version 不可变更) */
    type UpdateVersionLogRequest = Partial<Omit<CreateVersionLogRequest, 'version'>>;

    interface BatchDeleteVersionLogsRequest {
      ids: number[];
    }

    interface BatchDeleteVersionLogFailure {
      id: number;
      reason: string;
    }

    interface BatchDeleteVersionLogsResponse {
      deletedCount: number;
      failedIds: number[];
      failures: BatchDeleteVersionLogFailure[];
    }

    type VersionLogListResponse = ListData<VersionLog>;
    type VersionLogDetailResponse = VersionLog;
    type CreateVersionLogResponse = VersionLog;
    type UpdateVersionLogResponse = VersionLog;
    type DeleteVersionLogResponse = null;
  }
}
