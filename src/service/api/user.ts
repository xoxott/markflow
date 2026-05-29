import { request } from '../request';

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

/** 用户/角色表单等场景使用的管理员角色下拉列表（非分页） */
export function fetchAdminRoleOptions() {
  return request<Api.UserManagement.RoleListResponse>({
    url: '/api/admin/roles',
    method: 'get'
  });
}
