import { request } from '../request';
import { mockMenuApi } from './menu-mock';

const useMenuMock = () => import.meta.env.VITE_AUTH_ROUTE_MODE === 'dynamic';

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
