/** Notification Management API types (ai-server admin/notifications) */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace NotificationManagement {
    /** ai-server NotificationType */
    type NotificationType = 'system' | 'user' | 'workflow' | 'alert' | 'announcement';

    /** ai-server NotificationPriority */
    type NotificationPriority = 0 | 1 | 2 | 3;

    /** ai-server NotificationBroadcastStatus */
    type NotificationStatus = 'draft' | 'published' | 'archived';

    /** Notification broadcast entity */
    interface Notification {
      id: number;
      title: string;
      content: string;
      type: NotificationType;
      priority: NotificationPriority;
      status: NotificationStatus;
      publishedAt: string | null;
      expiresAt: string | null;
      targetUserIds: number[] | null;
      targetRoleIds: number[] | null;
      targetUsers?: Api.AdminOptionTarget[] | null;
      targetRoles?: Api.AdminOptionTarget[] | null;
      readCount: number;
      totalCount: number;
      createdAt: string;
      updatedAt: string;
    }

    interface NotificationListParams extends Common.PaginationParams {
      search?: string;
      status?: NotificationStatus;
      type?: NotificationType;
      targetUserId?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }

    interface CreateNotificationRequest {
      title: string;
      content: string;
      type?: NotificationType;
      priority?: NotificationPriority;
      expiresAt?: string;
      targetUserIds?: number[];
      targetRoleIds?: number[];
    }

    type UpdateNotificationRequest = Partial<CreateNotificationRequest>;

    interface BatchDeleteNotificationsRequest {
      ids: number[];
    }

    interface BatchDeleteNotificationFailure {
      id: number;
      reason: string;
    }

    interface BatchDeleteNotificationsResponse {
      deletedCount: number;
      failedIds: number[];
      failures: BatchDeleteNotificationFailure[];
    }

    type NotificationListResponse = ListData<Notification>;
    type NotificationDetailResponse = Notification;
    type CreateNotificationResponse = Notification;
    type UpdateNotificationResponse = Notification;
    type DeleteNotificationResponse = null;
    type PublishNotificationResponse = Notification;
    type RevertNotificationToDraftResponse = Notification;
    type ArchiveNotificationResponse = Notification;
  }
}
