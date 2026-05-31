import type { RouteRecordRaw } from 'vue-router';
import type { ElegantConstRoute, LastLevelRouteKey, RouteKey } from '@elegant-router/types';
import { hasPermissionAccess } from '@/utils/rbac/permission-access';

/** Filter auth routes by permission codes (static mode). */
export function filterAuthRoutesByPermissions(
  routes: ElegantConstRoute[],
  permissionCodes: string[]
): ElegantConstRoute[] {
  return routes.flatMap(route => filterAuthRouteByPermissions(route, permissionCodes));
}

function filterAuthRouteByPermissions(
  route: ElegantConstRoute,
  permissionCodes: string[]
): ElegantConstRoute[] {
  if (route.meta?.constant) {
    return [
      {
        ...route,
        children: route.children?.length ? filterChildren(route, permissionCodes) : route.children
      }
    ];
  }

  if (route.children?.length) {
    const children = filterChildren(route, permissionCodes);
    return children.length ? [{ ...route, children }] : [];
  }

  const routePermissionCodes = route.meta?.permissionCodes ?? [];
  if (!routePermissionCodes.length) return [];

  return hasPermissionAccess(permissionCodes, routePermissionCodes) ? [{ ...route }] : [];
}

function filterChildren(route: ElegantConstRoute, permissionCodes: string[]): ElegantConstRoute[] {
  return (route.children ?? []).flatMap(child =>
    filterAuthRouteByPermissions(child, permissionCodes)
  );
}

/** Sort routes by meta.order without mutating the input. */
export function sortRoutesByOrder(routes: ElegantConstRoute[]): ElegantConstRoute[] {
  return [...routes]
    .sort((next, prev) => (Number(next.meta?.order) || 0) - (Number(prev.meta?.order) || 0))
    .map(route => ({
      ...route,
      children: route.children?.length ? sortRoutesByOrder(route.children) : route.children
    }));
}

export function getCacheRouteNames(routes: RouteRecordRaw[]): LastLevelRouteKey[] {
  const cacheNames: LastLevelRouteKey[] = [];

  routes.forEach(route => {
    route.children?.forEach(child => {
      if (child.component && child.meta?.keepAlive) {
        cacheNames.push(child.name as LastLevelRouteKey);
      }
    });
  });

  return cacheNames;
}

export function isRouteExistByRouteName(routeName: RouteKey, routes: ElegantConstRoute[]): boolean {
  return routes.some(route => routeContainsName(route, routeName));
}

function routeContainsName(route: ElegantConstRoute, routeName: RouteKey): boolean {
  if (route.name === routeName) return true;
  return route.children?.some(child => routeContainsName(child, routeName)) ?? false;
}
