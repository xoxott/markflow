import type { VNode } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { ElegantConstRoute, RouteKey, RouteMap } from '@elegant-router/types';
import { $t } from '@/locales';
import {
  MENU_GROUP_DEFINITIONS,
  type MenuGroupChild,
  TOP_LEVEL_MENU_KEYS
} from '@/router/menu/menu-groups';

/** Icon renderer injected from Pinia store (composables stay in store setup). */
export type SvgIconRenderer = (props: {
  icon?: string;
  localIcon?: string;
  fontSize?: number;
}) => (() => VNode) | undefined;

type MenuWithOrder = App.Global.Menu & { order?: number };

function menuFromRoute(
  route: RouteLocationNormalizedLoaded | ElegantConstRoute,
  renderIcon: SvgIconRenderer
): App.Global.Menu {
  const { name, path } = route;
  const {
    title,
    i18nKey,
    icon = import.meta.env.VITE_MENU_ICON,
    localIcon,
    iconFontSize
  } = route.meta ?? {};

  return {
    key: name as string,
    label: i18nKey ? $t(i18nKey) : title!,
    i18nKey,
    routeKey: name as RouteKey,
    routePath: path as RouteMap[RouteKey],
    icon: renderIcon({ icon, localIcon, fontSize: iconFontSize || 20 })
  };
}

function flatMenusFromAuthRoutes(
  routes: ElegantConstRoute[],
  renderIcon: SvgIconRenderer
): App.Global.Menu[] {
  const menus: App.Global.Menu[] = [];

  routes.forEach(route => {
    if (route.meta?.hideInMenu) return;

    const menu = menuFromRoute(route, renderIcon);

    if (route.children?.some(child => !child.meta?.hideInMenu)) {
      menu.children = flatMenusFromAuthRoutes(route.children, renderIcon);
    }

    menus.push(menu);
  });

  return menus;
}

function resolveMenuGroupChild(
  child: MenuGroupChild,
  menuMap: Map<string, App.Global.Menu>,
  groupedKeys: Set<string>,
  renderIcon: SvgIconRenderer
): App.Global.Menu | null {
  if (typeof child === 'string') {
    const menu = menuMap.get(child);
    if (menu) groupedKeys.add(child);
    return menu ?? null;
  }

  const subChildren = child.children
    .map(key => menuMap.get(key))
    .filter((menu): menu is App.Global.Menu => Boolean(menu));

  if (!subChildren.length) return null;

  subChildren.forEach(subMenu => groupedKeys.add(subMenu.key));

  const firstChild = subChildren[0];

  return {
    key: child.key,
    label: $t(child.i18nKey),
    i18nKey: child.i18nKey,
    routeKey: firstChild.routeKey,
    routePath: firstChild.routePath,
    icon: renderIcon({ icon: child.icon, fontSize: 20 }),
    children: subChildren
  };
}

/** Static mode: apply frontend menu group definitions to flat route menus. */
export function buildStaticGlobalMenus(
  routes: ElegantConstRoute[],
  renderIcon: SvgIconRenderer
): App.Global.Menu[] {
  const flatMenus = flatMenusFromAuthRoutes(routes, renderIcon);
  const menuMap = new Map(flatMenus.map(menu => [menu.key, menu]));
  const groupedKeys = new Set<string>();
  const groupedMenus: MenuWithOrder[] = [];

  TOP_LEVEL_MENU_KEYS.forEach(({ key, order }) => {
    const menu = menuMap.get(key);
    if (!menu) return;
    groupedMenus.push({ ...menu, order });
    groupedKeys.add(key);
  });

  MENU_GROUP_DEFINITIONS.forEach(group => {
    const children = group.children
      .map(child => resolveMenuGroupChild(child, menuMap, groupedKeys, renderIcon))
      .filter((menu): menu is App.Global.Menu => Boolean(menu));

    if (!children.length) return;

    const firstChild = children[0];

    groupedMenus.push({
      key: group.key,
      label: $t(group.i18nKey),
      i18nKey: group.i18nKey,
      routeKey: firstChild.routeKey,
      routePath: firstChild.routePath,
      icon: renderIcon({ icon: group.icon, fontSize: 20 }),
      children,
      order: group.order
    });
  });

  flatMenus.forEach(menu => {
    if (!groupedKeys.has(menu.key)) {
      groupedMenus.push(menu);
    }
  });

  groupedMenus.sort((next, prev) => {
    const nextOrder =
      next.order ?? TOP_LEVEL_MENU_KEYS.find(item => item.key === next.key)?.order ?? 99;
    const prevOrder =
      prev.order ?? TOP_LEVEL_MENU_KEYS.find(item => item.key === prev.key)?.order ?? 99;
    return nextOrder - prevOrder;
  });

  return groupedMenus.map(({ order: _, ...menu }) => menu);
}

/** Dynamic mode: render sidebar tree from backend serialized menus. */
export function buildDynamicGlobalMenus(
  nodes: Api.MenuManagement.SerializedMenuNode[],
  renderIcon: SvgIconRenderer
): App.Global.Menu[] {
  const convert = (items: Api.MenuManagement.SerializedMenuNode[]): App.Global.Menu[] =>
    items.map(item => {
      const menu: App.Global.Menu = {
        key: item.key,
        label: item.i18nKey ? $t(item.i18nKey) : item.label,
        i18nKey: item.i18nKey ?? null,
        routeKey: item.routeKey,
        routePath: item.routePath,
        icon: item.icon ? renderIcon({ icon: item.icon, fontSize: 20 }) : undefined
      };

      if (item.children?.length) {
        menu.children = convert(item.children);
      }

      return menu;
    });

  return convert(nodes);
}

export function updateLocaleOfGlobalMenus(menus: App.Global.Menu[]): App.Global.Menu[] {
  return menus.map(menu => {
    const newMenu: App.Global.Menu = {
      ...menu,
      label: menu.i18nKey ? $t(menu.i18nKey) : menu.label
    };

    if (menu.children?.length) {
      newMenu.children = updateLocaleOfGlobalMenus(menu.children);
    }

    return newMenu;
  });
}

export function transformMenuToSearchMenus(menus: App.Global.Menu[]): App.Global.Menu[] {
  const result: App.Global.Menu[] = [];

  menus.forEach(menu => {
    if (!menu.children?.length) {
      result.push(menu);
      return;
    }
    result.push(...transformMenuToSearchMenus(menu.children));
  });

  return result;
}

export function getSelectedMenuKeyPathByKey(
  selectedKey: string,
  menus: App.Global.Menu[]
): string[] {
  for (const menu of menus) {
    const path = findMenuPath(selectedKey, menu);
    if (path?.length) return path;
  }
  return [];
}

function findMenuPath(targetKey: string, menu: App.Global.Menu): string[] | null {
  const path: string[] = [];

  function dfs(item: App.Global.Menu): boolean {
    path.push(item.key);
    if (item.key === targetKey) return true;

    if (item.children) {
      for (const child of item.children) {
        if (dfs(child)) return true;
      }
    }

    path.pop();
    return false;
  }

  return dfs(menu) ? path : null;
}

function transformMenuToBreadcrumb(menu: App.Global.Menu): App.Global.Breadcrumb {
  const { children, ...rest } = menu;
  const breadcrumb: App.Global.Breadcrumb = { ...rest };

  if (children?.length) {
    breadcrumb.options = children.map(transformMenuToBreadcrumb);
  }

  return breadcrumb;
}

export function getBreadcrumbsByRoute(
  route: RouteLocationNormalizedLoaded,
  menus: App.Global.Menu[],
  renderIcon: SvgIconRenderer
): App.Global.Breadcrumb[] {
  const key = route.name as string;
  const activeKey = route.meta?.activeMenu;

  for (const menu of menus) {
    if (menu.key === key) {
      return [transformMenuToBreadcrumb(menu)];
    }

    if (menu.key === activeKey) {
      const parentKey = key.split('_').slice(0, -1).join('_');
      const breadcrumbMenu = menuFromRoute(route, renderIcon);

      if (parentKey !== activeKey) {
        return [transformMenuToBreadcrumb(breadcrumbMenu)];
      }

      return [transformMenuToBreadcrumb(menu), transformMenuToBreadcrumb(breadcrumbMenu)];
    }

    if (menu.children?.length) {
      const nested = getBreadcrumbsByRoute(route, menu.children, renderIcon);
      if (nested.length) {
        return [transformMenuToBreadcrumb(menu), ...nested];
      }
    }
  }

  return [];
}
