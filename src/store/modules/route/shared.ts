import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router';
import type {
  ElegantConstRoute,
  LastLevelRouteKey,
  RouteKey,
  RouteMap
} from '@elegant-router/types';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import {
  MENU_GROUP_DEFINITIONS,
  type MenuGroupChild,
  TOP_LEVEL_MENU_KEYS
} from '@/router/menu/menu-groups';

/**
 * Filter auth routes by roles
 *
 * @param routes Auth routes
 * @param roles Roles
 */
export function filterAuthRoutesByRoles(routes: ElegantConstRoute[], roles: string[]) {
  return routes.flatMap(route => filterAuthRouteByRoles(route, roles));
}

/**
 * Filter auth route by roles
 *
 * @param route Auth route
 * @param roles Roles
 */
function filterAuthRouteByRoles(route: ElegantConstRoute, roles: string[]): ElegantConstRoute[] {
  const routeRoles = (route.meta && route.meta.roles) || [];

  // if the route's "roles" is empty, then it is allowed to access
  const isEmptyRoles = !routeRoles.length;

  // if the user's role is included in the route's "roles", then it is allowed to access
  const hasPermission = routeRoles.some(role => roles.includes(role));

  const filterRoute = { ...route };

  if (filterRoute.children?.length) {
    filterRoute.children = filterRoute.children.flatMap(item =>
      filterAuthRouteByRoles(item, roles)
    );
  }

  // Exclude the route if it has no children after filtering
  if (filterRoute.children?.length === 0) {
    return [];
  }

  return hasPermission || isEmptyRoles ? [filterRoute] : [];
}

/**
 * sort route by order
 *
 * @param route route
 */
function sortRouteByOrder(route: ElegantConstRoute) {
  if (route.children?.length) {
    route.children.sort(
      (next, prev) => (Number(next.meta?.order) || 0) - (Number(prev.meta?.order) || 0)
    );
    route.children.forEach(sortRouteByOrder);
  }

  return route;
}

/**
 * sort routes by order
 *
 * @param routes routes
 */
export function sortRoutesByOrder(routes: ElegantConstRoute[]) {
  routes.sort((next, prev) => (Number(next.meta?.order) || 0) - (Number(prev.meta?.order) || 0));
  routes.forEach(sortRouteByOrder);

  return routes;
}

/**
 * Get global menus by auth routes
 *
 * @param routes Auth routes
 */
export function getGlobalMenusByAuthRoutes(routes: ElegantConstRoute[]) {
  const menus: App.Global.Menu[] = [];

  routes.forEach(route => {
    if (!route.meta?.hideInMenu) {
      const menu = getGlobalMenuByBaseRoute(route);

      if (route.children?.some(child => !child.meta?.hideInMenu)) {
        menu.children = getGlobalMenusByAuthRoutes(route.children);
      }

      menus.push(menu);
    }
  });

  return menus;
}

/**
 * Group flat menus into categorized parent menus
 *
 * @param flatMenus Menus generated from flat auth routes
 */
function resolveMenuGroupChild(
  child: MenuGroupChild,
  menuMap: Map<string, App.Global.Menu>,
  groupedKeys: Set<string>,
  SvgIconVNode: ReturnType<typeof useSvgIcon>['SvgIconVNode']
): App.Global.Menu | null {
  if (typeof child === 'string') {
    const menu = menuMap.get(child);

    if (menu) {
      groupedKeys.add(child);
    }

    return menu ?? null;
  }

  const subChildren = child.children
    .map(key => menuMap.get(key))
    .filter((menu): menu is App.Global.Menu => Boolean(menu));

  if (subChildren.length === 0) {
    return null;
  }

  subChildren.forEach(subMenu => groupedKeys.add(subMenu.key));

  const firstChild = subChildren[0];

  return {
    key: child.key,
    label: $t(child.i18nKey),
    i18nKey: child.i18nKey,
    routeKey: firstChild.routeKey,
    routePath: firstChild.routePath,
    icon: SvgIconVNode({ icon: child.icon, fontSize: 20 }),
    children: subChildren
  };
}

export function groupGlobalMenus(flatMenus: App.Global.Menu[]) {
  const menuMap = new Map(flatMenus.map(menu => [menu.key, menu]));
  const groupedKeys = new Set<string>();
  const groupedMenus: App.Global.Menu[] = [];
  const { SvgIconVNode } = useSvgIcon();

  TOP_LEVEL_MENU_KEYS.forEach(({ key, order }) => {
    const menu = menuMap.get(key);

    if (menu) {
      groupedMenus.push({ ...menu, order } as App.Global.Menu & { order: number });
      groupedKeys.add(key);
    }
  });

  MENU_GROUP_DEFINITIONS.forEach(group => {
    const children = group.children
      .map(child => resolveMenuGroupChild(child, menuMap, groupedKeys, SvgIconVNode))
      .filter((menu): menu is App.Global.Menu => Boolean(menu));

    if (children.length === 0) {
      return;
    }

    const firstChild = children[0];

    groupedMenus.push({
      key: group.key,
      label: $t(group.i18nKey),
      i18nKey: group.i18nKey,
      routeKey: firstChild.routeKey,
      routePath: firstChild.routePath,
      icon: SvgIconVNode({ icon: group.icon, fontSize: 20 }),
      children,
      order: group.order
    } as App.Global.Menu & { order: number });
  });

  flatMenus.forEach(menu => {
    if (!groupedKeys.has(menu.key)) {
      groupedMenus.push(menu);
    }
  });

  groupedMenus.sort((next, prev) => {
    const nextOrder =
      (next as App.Global.Menu & { order?: number }).order ??
      TOP_LEVEL_MENU_KEYS.find(item => item.key === next.key)?.order ??
      99;
    const prevOrder =
      (prev as App.Global.Menu & { order?: number }).order ??
      TOP_LEVEL_MENU_KEYS.find(item => item.key === prev.key)?.order ??
      99;

    return nextOrder - prevOrder;
  });

  return groupedMenus.map(menu => {
    const { order: _, ...rest } = menu as App.Global.Menu & { order?: number };

    return rest;
  });
}

/** Build global menus from serialized menu tree (dynamic mode) */
export function buildGlobalMenusFromSerializedMenuTree(
  nodes: Api.MenuManagement.SerializedMenuNode[]
): App.Global.Menu[] {
  const { SvgIconVNode } = useSvgIcon();

  const convert = (items: Api.MenuManagement.SerializedMenuNode[]): App.Global.Menu[] =>
    items.map(item => {
      const menu: App.Global.Menu = {
        key: item.key,
        label: item.i18nKey ? $t(item.i18nKey) : item.label,
        i18nKey: item.i18nKey ?? null,
        routeKey: item.routeKey,
        routePath: item.routePath,
        icon: item.icon ? SvgIconVNode({ icon: item.icon, fontSize: 20 }) : undefined
      };

      if (item.children?.length) {
        menu.children = convert(item.children);
      }

      return menu;
    });

  return convert(nodes);
}

/**
 * Update locale of global menus
 *
 * @param menus
 */
export function updateLocaleOfGlobalMenus(menus: App.Global.Menu[]) {
  const result: App.Global.Menu[] = [];

  menus.forEach(menu => {
    const { i18nKey, label, children } = menu;

    const newLabel = i18nKey ? $t(i18nKey) : label;

    const newMenu: App.Global.Menu = {
      ...menu,
      label: newLabel
    };

    if (children?.length) {
      newMenu.children = updateLocaleOfGlobalMenus(children);
    }

    result.push(newMenu);
  });

  return result;
}

/**
 * Get global menu by route
 *
 * @param route
 */
function getGlobalMenuByBaseRoute(route: RouteLocationNormalizedLoaded | ElegantConstRoute) {
  const { SvgIconVNode } = useSvgIcon();

  const { name, path } = route;
  const {
    title,
    i18nKey,
    icon = import.meta.env.VITE_MENU_ICON,
    localIcon,
    iconFontSize
  } = route.meta ?? {};

  const label = i18nKey ? $t(i18nKey) : title!;

  const menu: App.Global.Menu = {
    key: name as string,
    label,
    i18nKey,
    routeKey: name as RouteKey,
    routePath: path as RouteMap[RouteKey],
    icon: SvgIconVNode({ icon, localIcon, fontSize: iconFontSize || 20 })
  };

  return menu;
}

/**
 * Get cache route names
 *
 * @param routes Vue routes (two levels)
 */
export function getCacheRouteNames(routes: RouteRecordRaw[]) {
  const cacheNames: LastLevelRouteKey[] = [];

  routes.forEach(route => {
    // only get last two level route, which has component
    route.children?.forEach(child => {
      if (child.component && child.meta?.keepAlive) {
        cacheNames.push(child.name as LastLevelRouteKey);
      }
    });
  });

  return cacheNames;
}

/**
 * Is route exist by route name
 *
 * @param routeName
 * @param routes
 */
export function isRouteExistByRouteName(routeName: RouteKey, routes: ElegantConstRoute[]) {
  return routes.some(route => recursiveGetIsRouteExistByRouteName(route, routeName));
}

/**
 * Recursive get is route exist by route name
 *
 * @param route
 * @param routeName
 */
function recursiveGetIsRouteExistByRouteName(route: ElegantConstRoute, routeName: RouteKey) {
  let isExist = route.name === routeName;

  if (isExist) {
    return true;
  }

  if (route.children && route.children.length) {
    isExist = route.children.some(item => recursiveGetIsRouteExistByRouteName(item, routeName));
  }

  return isExist;
}

/**
 * Get selected menu key path
 *
 * @param selectedKey
 * @param menus
 */
export function getSelectedMenuKeyPathByKey(selectedKey: string, menus: App.Global.Menu[]) {
  const keyPath: string[] = [];

  menus.some(menu => {
    const path = findMenuPath(selectedKey, menu);

    const find = Boolean(path?.length);

    if (find) {
      keyPath.push(...path!);
    }

    return find;
  });

  return keyPath;
}

/**
 * Find menu path
 *
 * @param targetKey Target menu key
 * @param menu Menu
 */
function findMenuPath(targetKey: string, menu: App.Global.Menu): string[] | null {
  const path: string[] = [];

  function dfs(item: App.Global.Menu): boolean {
    path.push(item.key);

    if (item.key === targetKey) {
      return true;
    }

    if (item.children) {
      for (const child of item.children) {
        if (dfs(child)) {
          return true;
        }
      }
    }

    path.pop();

    return false;
  }

  if (dfs(menu)) {
    return path;
  }

  return null;
}

/**
 * Transform menu to breadcrumb
 *
 * @param menu
 */
function transformMenuToBreadcrumb(menu: App.Global.Menu) {
  const { children, ...rest } = menu;

  const breadcrumb: App.Global.Breadcrumb = {
    ...rest
  };

  if (children?.length) {
    breadcrumb.options = children.map(transformMenuToBreadcrumb);
  }

  return breadcrumb;
}

/**
 * Get breadcrumbs by route
 *
 * @param route
 * @param menus
 */
export function getBreadcrumbsByRoute(
  route: RouteLocationNormalizedLoaded,
  menus: App.Global.Menu[]
): App.Global.Breadcrumb[] {
  const key = route.name as string;
  const activeKey = route.meta?.activeMenu;

  for (const menu of menus) {
    if (menu.key === key) {
      return [transformMenuToBreadcrumb(menu)];
    }

    if (menu.key === activeKey) {
      const ROUTE_DEGREE_SPLITTER = '_';

      const parentKey = key.split(ROUTE_DEGREE_SPLITTER).slice(0, -1).join(ROUTE_DEGREE_SPLITTER);

      const breadcrumbMenu = getGlobalMenuByBaseRoute(route);
      if (parentKey !== activeKey) {
        return [transformMenuToBreadcrumb(breadcrumbMenu)];
      }

      return [transformMenuToBreadcrumb(menu), transformMenuToBreadcrumb(breadcrumbMenu)];
    }

    if (menu.children?.length) {
      const result = getBreadcrumbsByRoute(route, menu.children);
      if (result.length > 0) {
        return [transformMenuToBreadcrumb(menu), ...result];
      }
    }
  }

  return [];
}

/**
 * Transform menu to searchMenus
 *
 * @param menus - menus
 * @param treeMap
 */
export function transformMenuToSearchMenus(
  menus: App.Global.Menu[],
  treeMap: App.Global.Menu[] = []
) {
  if (menus && menus.length === 0) return [];
  return menus.reduce((acc, cur) => {
    if (!cur.children) {
      acc.push(cur);
    }
    if (cur.children && cur.children.length > 0) {
      transformMenuToSearchMenus(cur.children, treeMap);
    }
    return acc;
  }, treeMap);
}
