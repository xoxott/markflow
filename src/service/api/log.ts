import { request } from '../request';

/**
 * Get log list
 *
 * @param params Query parameters
 */
export function fetchLogList(params: Api.LogManagement.LogListParams) {
  return request<Api.LogManagement.LogListResponse>({
    url: '/api/admin/logs',
    method: 'get',
    params
  });
}

/**
 * Get log detail
 *
 * @param id Log ID
 */
export function fetchLogDetail(id: number) {
  return request<Api.LogManagement.LogDetailResponse>({
    url: `/api/admin/logs/${id}`,
    method: 'get'
  });
}

/**
 * Delete log
 *
 * @param id Log ID
 */
export function fetchDeleteLog(id: number) {
  return request<Api.LogManagement.DeleteLogResponse>({
    url: `/api/admin/logs/${id}`,
    method: 'delete'
  });
}

/**
 * Batch delete logs
 *
 * @param data Log IDs
 */
export function fetchBatchDeleteLogs(data: Api.LogManagement.BatchDeleteLogsRequest) {
  return request<Api.LogManagement.BatchDeleteLogsResponse>({
    url: '/api/admin/logs/batch',
    method: 'delete',
    data
  });
}

/**
 * Delete logs older than the specified number of days (super_admin only)
 *
 * @param days Number of days to keep
 */
export function fetchDeleteOldLogs(days: number) {
  return request<Api.LogManagement.DeleteOldLogsResponse>({
    url: '/api/admin/logs/old',
    method: 'delete',
    params: { days }
  });
}
