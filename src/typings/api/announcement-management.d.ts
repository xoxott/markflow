/** Announcement Management API types (ai-server admin/announcements) */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace AnnouncementManagement {
    /** ai-server AnnouncementType */
    type AnnouncementType = 'system' | 'maintenance' | 'feature' | 'warning' | 'info';

    /** ai-server AnnouncementStatus */
    type AnnouncementStatus = 'draft' | 'published' | 'archived';

    /** Announcement entity (ai-server AnnouncementEntity) */
    interface Announcement {
      id: number;
      title: string;
      content: string;
      type: AnnouncementType;
      status: AnnouncementStatus;
      priority: number;
      publishedAt: string | null;
      expiresAt: string | null;
      createdBy: number | null;
      sticky: boolean;
      targetAudience: string[] | null;
      viewCount: number;
      createdAt: string;
      updatedAt: string;
    }

    /** List query (ai-server FilterAnnouncementsDto + PaginationDto) */
    interface AnnouncementListParams extends Common.PaginationParams {
      search?: string;
      type?: AnnouncementType;
      status?: AnnouncementStatus;
      /** Query boolean sticky filter */
      sticky?: Common.QueryBoolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }

    /** Create body (ai-server CreateAnnouncementDto) */
    interface CreateAnnouncementRequest {
      title: string;
      content: string;
      type: AnnouncementType;
      priority?: number;
      expiresAt?: string;
      sticky?: boolean;
      targetAudience?: string[];
    }

    /** Update body (ai-server UpdateAnnouncementDto) */
    type UpdateAnnouncementRequest = Partial<CreateAnnouncementRequest>;

    interface BatchDeleteAnnouncementsRequest {
      ids: number[];
    }

    interface BatchDeleteAnnouncementFailure {
      id: number;
      reason: string;
    }

    interface BatchDeleteAnnouncementsResponse {
      deletedCount: number;
      failedIds: number[];
      failures: BatchDeleteAnnouncementFailure[];
    }

    type AnnouncementListResponse = ListData<Announcement>;
    type AnnouncementDetailResponse = Announcement;
    type CreateAnnouncementResponse = Announcement;
    type UpdateAnnouncementResponse = Announcement;
    type PublishAnnouncementResponse = Announcement;
    type RevertAnnouncementToDraftResponse = Announcement;
    type ArchiveAnnouncementResponse = Announcement;
  }
}
