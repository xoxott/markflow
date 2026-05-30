import { request } from '../request';

/** 角色远程下拉选项 GET /admin/roles/options */
export function fetchAdminRoleOptions(params?: Api.AdminReference.RoleOptionsQuery) {
  return request<Api.AdminReference.AdminOptionListDataMap['roles']>({
    url: '/api/admin/roles/options',
    method: 'get',
    params
  });
}

/** 用户远程下拉选项 GET /admin/users/options */
export function fetchAdminUserOptions(params?: Api.AdminReference.UserOptionsQuery) {
  return request<Api.AdminReference.AdminOptionListDataMap['users']>({
    url: '/api/admin/users/options',
    method: 'get',
    params
  });
}

/** 权限远程下拉选项 GET /admin/permissions/options */
export function fetchAdminPermissionOptions(params?: Api.AdminReference.PermissionOptionsQuery) {
  return request<Api.AdminReference.AdminOptionListDataMap['permissions']>({
    url: '/api/admin/permissions/options',
    method: 'get',
    params
  });
}
