import type { ElegantConstRoute, LastLevelRouteKey, RouteKey } from '@elegant-router/types';
import { generatedRoutes } from '@/router/elegant/routes';

type MenuTreeNode = Api.MenuManagement.MenuTreeNode;
type SerializedMenuNode = Api.MenuManagement.SerializedMenuNode;

const routeRegistry = new Map<string, ElegantConstRoute>(
  generatedRoutes.map(route => [route.name, route as ElegantConstRoute])
);

function hasRoleAccess(roleCodes: string[], menuRoles: string[]): boolean {
  if (!menuRoles.length) return true;
  if (!roleCodes.length) return false;
  return menuRoles.some(code => roleCodes.includes(code));
}

/** 按角色过滤菜单树；空子节点的 group 会被 prune */
export function filterMenuTreeByRoles(nodes: MenuTreeNode[], roleCodes: string[]): MenuTreeNode[] {
  const result: MenuTreeNode[] = [];

  nodes.forEach(node => {
    if (!node.isActive) return;
    if (!hasRoleAccess(roleCodes, node.roleCodes)) return;

    const children = node.children?.length
      ? filterMenuTreeByRoles(node.children, roleCodes)
      : undefined;

    if (node.type === 'group' && (!children || children.length === 0)) {
      return;
    }

    result.push({
      ...node,
      children: children?.length ? children : undefined
    });
  });

  return result.sort((a, b) => a.order - b.order);
}

function mergeRouteFromMenu(menu: MenuTreeNode): ElegantConstRoute | null {
  if (menu.type !== 'route' || !menu.routeKey) return null;

  const base = routeRegistry.get(menu.routeKey);
  if (!base) return null;

  return {
    ...base,
    meta: {
      ...base.meta,
      title: menu.name,
      i18nKey: menu.i18nKey ?? base.meta?.i18nKey,
      icon: menu.icon ?? base.meta?.icon,
      order: menu.order,
      hideInMenu: menu.hideInMenu ?? base.meta?.hideInMenu,
      activeMenu: menu.activeMenu ?? base.meta?.activeMenu
    }
  } as ElegantConstRoute;
}

function collectRouteMenus(nodes: MenuTreeNode[], bucket: MenuTreeNode[]) {
  nodes.forEach(node => {
    if (node.type === 'route') {
      bucket.push(node);
    }
    if (node.children?.length) {
      collectRouteMenus(node.children, bucket);
    }
  });
}

/** 从菜单树生成 auth 路由（扁平） */
export function menuTreeToAuthRoutes(nodes: MenuTreeNode[]): Api.Route.MenuRoute[] {
  const routeMenus: MenuTreeNode[] = [];
  collectRouteMenus(nodes, routeMenus);

  const routes: Api.Route.MenuRoute[] = [];

  routeMenus.forEach(menu => {
    const merged = mergeRouteFromMenu(menu);
    if (merged) {
      routes.push({ ...merged, id: menu.id });
    }
  });

  // 始终注册 hideInMenu 的详情页（若 registry 中存在且未被菜单显式禁用）
  generatedRoutes.forEach(route => {
    if (route.meta?.constant) return;
    if (!route.meta?.hideInMenu) return;
    const exists = routes.some(item => item.name === route.name);
    if (exists) return;
    routes.push({ ...(route as ElegantConstRoute), id: `registry-${route.name}` });
  });

  return routes.sort((a, b) => (Number(a.meta?.order) || 0) - (Number(b.meta?.order) || 0));
}

function resolveMenuRouteKey(menu: MenuTreeNode): RouteKey | undefined {
  if (menu.routeKey) return menu.routeKey;
  if (menu.type === 'group' && menu.children?.length) {
    for (const child of menu.children) {
      const key = resolveMenuRouteKey(child);
      if (key) return key;
    }
  }
  return undefined;
}

function resolveMenuRoutePath(menu: MenuTreeNode): string {
  const routeKey = resolveMenuRouteKey(menu);
  if (!routeKey) return '/';
  const base = routeRegistry.get(routeKey);
  return base?.path ?? '/';
}

/** 生成可序列化侧边栏树 */
export function menuTreeToSerializedSidebarMenus(nodes: MenuTreeNode[]): SerializedMenuNode[] {
  return nodes
    .map(node => {
      const routeKey = resolveMenuRouteKey(node);
      if (!routeKey) return null;

      const serialized: SerializedMenuNode = {
        key: node.type === 'route' && node.routeKey ? node.routeKey : node.id,
        label: node.name,
        i18nKey: node.i18nKey ?? null,
        routeKey,
        routePath: resolveMenuRoutePath(node) as SerializedMenuNode['routePath'],
        icon: node.icon
      };

      if (node.children?.length) {
        const children = menuTreeToSerializedSidebarMenus(node.children);
        if (children.length) {
          serialized.children = children;
        }
      }

      return { serialized, order: node.order };
    })
    .filter((item): item is { serialized: SerializedMenuNode; order: number } => Boolean(item))
    .sort((a, b) => a.order - b.order)
    .map(item => item.serialized);
}

export function getDefaultHomeRoute(): LastLevelRouteKey {
  return (import.meta.env.VITE_ROUTE_HOME || 'home') as LastLevelRouteKey;
}

export function getRouteRegistryItems(): Api.MenuManagement.RouteRegistryItem[] {
  return generatedRoutes
    .filter(route => !route.meta?.constant)
    .map(route => ({
      routeKey: route.name as RouteKey,
      path: route.path,
      title: String(route.meta?.title ?? route.name),
      i18nKey: route.meta?.i18nKey ?? null,
      icon: route.meta?.icon,
      hideInMenu: route.meta?.hideInMenu ?? undefined,
      constant: route.meta?.constant ?? undefined
    }));
}

export function isValidRouteKey(routeKey: string): routeKey is RouteKey {
  return routeRegistry.has(routeKey);
}
