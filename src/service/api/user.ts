import { getServiceBaseURL } from '@/utils/service';
import { downloadBlob, parseContentDispositionFilename } from '@/utils/download';
import { buildServiceHeaders } from '../request/auth';
import { request } from '../request';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

/**
 * Get user list
 *
 * @param params Query parameters
 */
export function fetchUserList(params: Api.UserManagement.UserListParams) {
  return request<Api.UserManagement.UserListResponse>({
    url: '/api/admin/users',
    method: 'get',
    params
  });
}

/** Get user statistics */
export function fetchUserStats() {
  return request<Api.UserManagement.UserStats>({
    url: '/api/admin/users/stats',
    method: 'get'
  });
}

/** Get online users */
export function fetchOnlineUsers() {
  return request<Api.UserManagement.OnlineUsersResponse>({
    url: '/api/admin/users/online',
    method: 'get'
  });
}

/**
 * Get user detail
 *
 * @param id User ID
 */
export function fetchUserDetail(id: number) {
  return request<Api.UserManagement.UserDetailResponse>({
    url: `/api/admin/users/${id}`,
    method: 'get'
  });
}

/**
 * Create user
 *
 * @param data User data
 */
export function fetchCreateUser(data: Api.UserManagement.CreateUserRequest) {
  return request<Api.UserManagement.CreateUserResponse>({
    url: '/api/admin/users',
    method: 'post',
    data
  });
}

/**
 * Update user
 *
 * @param id User ID
 * @param data User data
 */
export function fetchUpdateUser(id: number, data: Api.UserManagement.UpdateUserRequest) {
  return request<Api.UserManagement.UpdateUserResponse>({
    url: `/api/admin/users/${id}`,
    method: 'patch',
    data
  });
}

/**
 * Delete user
 *
 * @param id User ID
 */
export function fetchDeleteUser(id: number) {
  return request<Api.UserManagement.DeleteUserResponse>({
    url: `/api/admin/users/${id}`,
    method: 'delete'
  });
}

/**
 * Update user status (activate or deactivate)
 *
 * @param id User ID
 * @param data Target status and optional reason
 */
export function fetchUpdateUserStatus(
  id: number,
  data: Api.UserManagement.UpdateUserStatusRequest
) {
  return request<Api.UserManagement.UpdateUserResponse>({
    url: `/api/admin/users/${id}/status`,
    method: 'patch',
    data
  });
}

/**
 * Assign roles to user (full replace)
 *
 * @param id User ID
 * @param data Role IDs
 */
export function fetchAssignUserRoles(id: number, data: Api.UserManagement.AssignUserRolesRequest) {
  return request<Api.UserManagement.UpdateUserResponse>({
    url: `/api/admin/users/${id}/roles`,
    method: 'put',
    data
  });
}

/**
 * Blacklist user
 *
 * @param id User ID
 */
export function fetchBlacklistUser(id: number) {
  return request<Api.UserManagement.UpdateUserResponse>({
    url: `/api/admin/users/${id}/blacklist`,
    method: 'post'
  });
}

/**
 * Remove user from blacklist
 *
 * @param id User ID
 */
export function fetchUnblacklistUser(id: number) {
  return request<Api.UserManagement.UpdateUserResponse>({
    url: `/api/admin/users/${id}/unblacklist`,
    method: 'post'
  });
}

/**
 * Force user offline
 *
 * @param id User ID
 */
export function fetchKickUser(id: number) {
  return request<Api.UserManagement.KickUserResponse>({
    url: `/api/admin/users/${id}/kick`,
    method: 'post'
  });
}

/**
 * Batch delete users
 *
 * @param data User IDs
 */
export function fetchBatchDeleteUsers(data: Api.UserManagement.BatchDeleteUsersRequest) {
  return request<Api.UserManagement.BatchDeleteUsersResponse>({
    url: '/api/admin/users/batch/delete',
    method: 'post',
    data
  });
}

/**
 * Batch update user status (enable/disable)
 *
 * @param data User IDs and target status
 */
export function fetchBatchUpdateUserStatus(data: Api.UserManagement.BatchUpdateStatusRequest) {
  return request<Api.UserManagement.BatchUpdateStatusResponse>({
    url: '/api/admin/users/batch/status',
    method: 'post',
    data
  });
}

/**
 * Batch blacklist users
 *
 * @param data User IDs and reason
 */
export function fetchBatchBlacklistUsers(data: Api.UserManagement.BatchBlacklistRequest) {
  return request<null>({
    url: '/api/admin/users/batch/blacklist',
    method: 'post',
    data
  });
}

/** Export users as CSV or Excel (uses current filter params) */
export async function fetchExportUsers(params: Api.UserManagement.ExportUsersParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`${baseURL}/api/admin/users/export?${query.toString()}`, {
    method: 'GET',
    headers: buildServiceHeaders()
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  const blob = await response.blob();
  const defaultExt = params.format === 'xlsx' ? 'xlsx' : 'csv';
  const filename =
    parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
    `users.${defaultExt}`;

  downloadBlob(blob, filename);
}

/** 用户/角色表单等场景使用的管理员角色下拉列表（非分页） */
export function fetchAdminRoleOptions() {
  return request<Api.UserManagement.RoleListResponse>({
    url: '/api/admin/roles',
    method: 'get'
  });
}
