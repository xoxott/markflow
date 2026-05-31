import { request } from '../request';

const API_PREFIX = '/api/admin/announcements';

/** 分页列表 */
export function fetchAnnouncementList(params: Api.AnnouncementManagement.AnnouncementListParams) {
  return request<Api.AnnouncementManagement.AnnouncementListResponse>({
    url: API_PREFIX,
    method: 'get',
    params
  });
}

/** 详情 */
export function fetchAnnouncementDetail(id: number) {
  return request<Api.AnnouncementManagement.AnnouncementDetailResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'get'
  });
}

/** 创建 */
export function fetchCreateAnnouncement(
  data: Api.AnnouncementManagement.CreateAnnouncementRequest
) {
  return request<Api.AnnouncementManagement.CreateAnnouncementResponse>({
    url: API_PREFIX,
    method: 'post',
    data
  });
}

/** 更新 */
export function fetchUpdateAnnouncement(
  id: number,
  data: Api.AnnouncementManagement.UpdateAnnouncementRequest
) {
  return request<Api.AnnouncementManagement.UpdateAnnouncementResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'patch',
    data
  });
}

/** 删除 */
export function fetchDeleteAnnouncement(id: number) {
  return request<null>({
    url: `${API_PREFIX}/${id}`,
    method: 'delete'
  });
}

/** 发布 */
export function fetchPublishAnnouncement(id: number) {
  return request<Api.AnnouncementManagement.PublishAnnouncementResponse>({
    url: `${API_PREFIX}/${id}/publish`,
    method: 'post'
  });
}

/** 取消发布并回到草稿 */
export function fetchRevertAnnouncementToDraft(id: number) {
  return request<Api.AnnouncementManagement.RevertAnnouncementToDraftResponse>({
    url: `${API_PREFIX}/${id}/revert-to-draft`,
    method: 'post'
  });
}

/** 归档（原 unpublish，status → archived） */
export function fetchArchiveAnnouncement(id: number) {
  return request<Api.AnnouncementManagement.ArchiveAnnouncementResponse>({
    url: `${API_PREFIX}/${id}/unpublish`,
    method: 'post'
  });
}
