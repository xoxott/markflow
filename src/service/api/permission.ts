import { request } from '../request';

/**
 * Get permission list
 *
 * @param params Query parameters
 */
export function fetchPermissionList(params: Api.PermissionManagement.PermissionListParams) {
  return request<Api.PermissionManagement.PermissionListResponse>({
    url: '/api/admin/permissions',
    method: 'get',
    params
  });
}

/**
 * Get permission detail
 *
 * @param id Permission ID
 */
export function fetchPermissionDetail(id: number) {
  return request<Api.PermissionManagement.PermissionDetailResponse>({
    url: `/api/admin/permissions/${id}`,
    method: 'get'
  });
}

/**
 * Create permission
 *
 * @param data Permission data
 */
export function fetchCreatePermission(data: Api.PermissionManagement.CreatePermissionRequest) {
  return request<Api.PermissionManagement.CreatePermissionResponse>({
    url: '/api/admin/permissions',
    method: 'post',
    data
  });
}

/**
 * Update permission
 *
 * @param id Permission ID
 * @param data Permission data
 */
export function fetchUpdatePermission(
  id: number,
  data: Api.PermissionManagement.UpdatePermissionRequest
) {
  return request<Api.PermissionManagement.UpdatePermissionResponse>({
    url: `/api/admin/permissions/${id}`,
    method: 'put',
    data
  });
}

/**
 * Delete permission
 *
 * @param id Permission ID
 */
export function fetchDeletePermission(id: number) {
  return request<Api.PermissionManagement.DeletePermissionResponse>({
    url: `/api/admin/permissions/${id}`,
    method: 'delete'
  });
}

/**
 * Batch delete permissions
 *
 * @param data Permission IDs
 */
export function fetchBatchDeletePermissions(
  data: Api.PermissionManagement.BatchDeletePermissionsRequest
) {
  return request<Api.PermissionManagement.BatchDeletePermissionsResponse>({
    url: '/api/admin/permissions/batch',
    method: 'delete',
    data
  });
}

/**
 * Toggle permission status (enable/disable)
 *
 * @param id Permission ID
 * @param isActive Status
 */
export function fetchTogglePermissionStatus(id: number, isActive: boolean) {
  return request<Api.PermissionManagement.TogglePermissionStatusResponse>({
    url: `/api/admin/permissions/${id}/status`,
    method: 'patch',
    data: { isActive }
  });
}

/** @deprecated 使用 `@/service/api/role` 的 `fetchAssignRolePermissions` */
export { fetchAssignRolePermissions as fetchAssignPermissionsToRole } from './role';
