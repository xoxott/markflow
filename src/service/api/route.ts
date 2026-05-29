import { request } from '../request';
import { mockMenuApi } from './menu-mock';

/** 动态路由 Mock（ai-server 暂无菜单路由 API 时使用） */
const useMenuMock = () => import.meta.env.VITE_USE_MENU_MOCK === 'Y';

/** get constant routes */
export function fetchGetConstantRoutes() {
  if (useMenuMock()) {
    return mockMenuApi.fetchGetConstantRoutes();
  }
  return request<Api.Route.MenuRoute[]>({ url: '/route/getConstantRoutes' });
}

/** get user routes */
export function fetchGetUserRoutes(roleCodes: string[] = []) {
  if (useMenuMock()) {
    return mockMenuApi.fetchGetUserRoutes(roleCodes);
  }
  return request<Api.Route.UserRoute>({ url: '/route/getUserRoutes' });
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({ url: '/route/isRouteExist', params: { routeName } });
}
