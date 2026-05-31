import { request } from '../request';

const API_PREFIX = '/api/admin/changelogs';

/** 分页列表 */
export function fetchVersionLogList(params: Api.VersionLogManagement.VersionLogListParams) {
  return request<Api.VersionLogManagement.VersionLogListResponse>({
    url: API_PREFIX,
    method: 'get',
    params
  });
}

/** 详情 */
export function fetchVersionLogDetail(id: number) {
  return request<Api.VersionLogManagement.VersionLogDetailResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'get'
  });
}

/** 创建 */
export function fetchCreateVersionLog(data: Api.VersionLogManagement.CreateVersionLogRequest) {
  return request<Api.VersionLogManagement.CreateVersionLogResponse>({
    url: API_PREFIX,
    method: 'post',
    data
  });
}

/** 更新 */
export function fetchUpdateVersionLog(
  id: number,
  data: Api.VersionLogManagement.UpdateVersionLogRequest
) {
  return request<Api.VersionLogManagement.UpdateVersionLogResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'patch',
    data
  });
}

/** 删除 */
export function fetchDeleteVersionLog(id: number) {
  return request<Api.VersionLogManagement.DeleteVersionLogResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'delete'
  });
}

/** 批量删除 */
export function fetchBatchDeleteVersionLogs(
  data: Api.VersionLogManagement.BatchDeleteVersionLogsRequest
) {
  return request<Api.VersionLogManagement.BatchDeleteVersionLogsResponse>({
    url: `${API_PREFIX}/batch`,
    method: 'delete',
    data
  });
}
