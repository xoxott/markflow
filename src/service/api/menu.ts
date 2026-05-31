import { request } from '../request';

/** Get menu tree */
export function fetchMenuTree() {
  return request<Api.MenuManagement.MenuTreeResponse>({
    url: '/api/admin/menus/tree',
    method: 'get'
  });
}

/** Get menu detail */
export function fetchMenuDetail(id: string) {
  return request<Api.MenuManagement.MenuDetailResponse>({
    url: `/api/admin/menus/${id}`,
    method: 'get'
  });
}

/** Create menu */
export function fetchCreateMenu(data: Api.MenuManagement.CreateMenuRequest) {
  return request<Api.MenuManagement.CreateMenuResponse>({
    url: '/api/admin/menus',
    method: 'post',
    data
  });
}

/** Update menu */
export function fetchUpdateMenu(id: string, data: Api.MenuManagement.UpdateMenuRequest) {
  return request<Api.MenuManagement.UpdateMenuResponse>({
    url: `/api/admin/menus/${id}`,
    method: 'put',
    data
  });
}

/** Delete menu */
export function fetchDeleteMenu(id: string) {
  return request<null>({
    url: `/api/admin/menus/${id}`,
    method: 'delete'
  });
}

/** Toggle menu status */
export function fetchToggleMenuStatus(id: string, isActive: boolean) {
  return request<Api.MenuManagement.UpdateMenuResponse>({
    url: `/api/admin/menus/${id}/status`,
    method: 'patch',
    data: { isActive } satisfies Api.MenuManagement.ToggleMenuStatusRequest
  });
}

/** Move menu node (reorder / reparent) */
export function fetchMoveMenu(id: string, data: Api.MenuManagement.MoveMenuRequest) {
  return request<Api.MenuManagement.UpdateMenuResponse>({
    url: `/api/admin/menus/${id}/move`,
    method: 'patch',
    data
  });
}

/** Sync menus from frontend route registry */
export function fetchSyncRoutes(data?: Api.MenuManagement.SyncRoutesRequest) {
  return request<Api.MenuManagement.SyncRoutesResponse>({
    url: '/api/admin/menus/sync-routes',
    method: 'post',
    data
  });
}

/** Get current user's filtered routes and sidebar menus */
export function fetchUserRoutes() {
  return request<Api.Route.UserRoute>({
    url: '/api/admin/menus/user-routes',
    method: 'get'
  });
}

/** Get bindable route registry */
export function fetchRouteRegistry() {
  return request<Api.MenuManagement.RouteRegistryResponse>({
    url: '/api/admin/routes/registry',
    method: 'get'
  });
}
