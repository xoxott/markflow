import { request } from '../request';

/**
 * Get role list
 *
 * @param params Query parameters
 */
export function fetchRoleList(params: Api.RoleManagement.RoleListParams) {
  const { isActive, ...rest } = params;
  return request<Api.RoleManagement.RoleListResponse>({
    url: '/api/admin/roles',
    method: 'get',
    params: {
      ...rest,
      ...(isActive === 0 || isActive === 1 ? { isActive: isActive === 1 } : {})
    }
  });
}

/**
 * Get role detail
 *
 * @param id Role ID
 */
export function fetchRoleDetail(id: number) {
  return request<Api.RoleManagement.RoleDetailResponse>({
    url: `/api/admin/roles/${id}`,
    method: 'get'
  });
}

/**
 * Create role
 *
 * @param data Role data
 */
export function fetchCreateRole(data: Api.RoleManagement.CreateRoleRequest) {
  return request<Api.RoleManagement.CreateRoleResponse>({
    url: '/api/admin/roles',
    method: 'post',
    data
  });
}

/**
 * Update role
 *
 * @param id Role ID
 * @param data Role data
 */
export function fetchUpdateRole(id: number, data: Api.RoleManagement.UpdateRoleRequest) {
  return request<Api.RoleManagement.UpdateRoleResponse>({
    url: `/api/admin/roles/${id}`,
    method: 'patch',
    data
  });
}

/**
 * Delete role
 *
 * @param id Role ID
 */
export function fetchDeleteRole(id: number) {
  return request<null>({
    url: `/api/admin/roles/${id}`,
    method: 'delete'
  });
}
