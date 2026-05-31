import { request } from '../request';

const API_PREFIX = '/api/admin/alerts';

/** 分页列表 */
export function fetchAlertList(params: Api.AlertManagement.AlertListParams) {
  return request<Api.AlertManagement.AlertListResponse>({
    url: API_PREFIX,
    method: 'get',
    params
  });
}

/** 详情 */
export function fetchAlertDetail(id: number) {
  return request<Api.AlertManagement.AlertDetailResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'get'
  });
}

/** 创建 */
export function fetchCreateAlert(data: Api.AlertManagement.CreateAlertRequest) {
  return request<Api.AlertManagement.CreateAlertResponse>({
    url: API_PREFIX,
    method: 'post',
    data
  });
}

/** 更新 */
export function fetchUpdateAlert(id: number, data: Api.AlertManagement.UpdateAlertRequest) {
  return request<Api.AlertManagement.UpdateAlertResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'patch',
    data
  });
}

/** 删除 */
export function fetchDeleteAlert(id: number) {
  return request<Api.AlertManagement.DeleteAlertResponse>({
    url: `${API_PREFIX}/${id}`,
    method: 'delete'
  });
}

/** 批量删除 */
export function fetchBatchDeleteAlerts(data: Api.AlertManagement.BatchDeleteAlertsRequest) {
  return request<Api.AlertManagement.BatchDeleteAlertsResponse>({
    url: `${API_PREFIX}/batch`,
    method: 'delete',
    data
  });
}

/** 确认告警 */
export function fetchAcknowledgeAlert(id: number) {
  return request<Api.AlertManagement.AcknowledgeAlertResponse>({
    url: `${API_PREFIX}/${id}/acknowledge`,
    method: 'post'
  });
}

/** 解决告警 */
export function fetchResolveAlert(id: number) {
  return request<Api.AlertManagement.ResolveAlertResponse>({
    url: `${API_PREFIX}/${id}/resolve`,
    method: 'post'
  });
}
