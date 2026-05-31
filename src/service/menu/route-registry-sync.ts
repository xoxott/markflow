import type { RouteKey } from '@elegant-router/types';
import { resolveDefaultPermissionCodes } from '@/constants/rbac/route-permissions';
import { $t } from '@/locales';
import { generatedRoutes } from '@/router/elegant/routes';

function resolveRouteRegistryTitle(route: (typeof generatedRoutes)[number]): string {
  const i18nKey = route.meta?.i18nKey;
  if (i18nKey) {
    return String($t(i18nKey));
  }
  return String(route.meta?.title ?? route.name);
}

const authRouteNames = new Set<string>(
  generatedRoutes.filter(route => !route.meta?.constant).map(route => route.name)
);

/** Payload for POST /api/admin/menus/sync-routes. */
export function buildSyncRegistryPayload(): Array<
  Api.MenuManagement.RouteRegistryItem & { component?: string }
> {
  return generatedRoutes
    .filter(route => !route.meta?.constant)
    .map(route => ({
      routeKey: route.name as RouteKey,
      path: route.path,
      component: route.component,
      title: resolveRouteRegistryTitle(route),
      i18nKey: route.meta?.i18nKey ?? null,
      icon: route.meta?.icon,
      hideInMenu: route.meta?.hideInMenu ?? undefined,
      constant: route.meta?.constant ?? undefined,
      defaultPermissionCodes: resolveDefaultPermissionCodes(route.name as string)
    }));
}

export function isAuthRouteKey(routeKey: string): routeKey is RouteKey {
  return authRouteNames.has(routeKey);
}
