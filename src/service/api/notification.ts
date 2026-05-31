import { request } from '../request';

const API_PREFIX = '/api/admin/notifications';

/** 分页列表 */
export function fetchNotificationList(params: Api.NotificationManagement.NotificationListParams) {
  return request<Api.NotificationManagement.NotificationListResponse>({
    url: API_PREFIX,
    method: 'get',
    params
  });
}

/** 详情 */
export function fetchNotificationDetail(id: number) {
  return request<Api.NotificationManagement.NotificationDetailResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'get'
  });
}

/** 创建 */
export function fetchCreateNotification(
  data: Api.NotificationManagement.CreateNotificationRequest
) {
  return request<Api.NotificationManagement.CreateNotificationResponse>({
    url: API_PREFIX,
    method: 'post',
    data
  });
}

/** 更新 */
export function fetchUpdateNotification(
  id: number,
  data: Api.NotificationManagement.UpdateNotificationRequest
) {
  return request<Api.NotificationManagement.UpdateNotificationResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'patch',
    data
  });
}

/** 删除 */
export function fetchDeleteNotification(id: number) {
  return request<Api.NotificationManagement.DeleteNotificationResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'delete'
  });
}

/** 批量删除 */
export function fetchBatchDeleteNotifications(
  data: Api.NotificationManagement.BatchDeleteNotificationsRequest
) {
  return request<Api.NotificationManagement.BatchDeleteNotificationsResponse>({
    url: `${API_PREFIX}/batch`,
    method: 'delete',
    data
  });
}

/** 发布 */
export function fetchPublishNotification(id: number) {
  return request<Api.NotificationManagement.PublishNotificationResponse>({
    url: `${API_PREFIX}/${id}/publish`,
    method: 'post'
  });
}

/** 取消发布并回到草稿 */
export function fetchRevertNotificationToDraft(id: number) {
  return request<Api.NotificationManagement.RevertNotificationToDraftResponse>({
    url: `${API_PREFIX}/${id}/revert-to-draft`,
    method: 'post'
  });
}

/** 归档 */
export function fetchArchiveNotification(id: number) {
  return request<Api.NotificationManagement.ArchiveNotificationResponse>({
    url: `${API_PREFIX}/${id}/unpublish`,
    method: 'post'
  });
}
