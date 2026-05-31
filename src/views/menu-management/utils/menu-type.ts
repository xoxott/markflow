import type { MenuType } from '../constants';

/** Menu types that must bind at least one permission code. */
export function menuTypeRequiresPermissionCodes(type: MenuType): boolean {
  return type === 'route' || type === 'external';
}

/** Menu types that bind a route registry entry. */
export function menuTypeRequiresRouteRegistry(type: MenuType): boolean {
  return type === 'route';
}

/** Menu types that expose hideInMenu / activeMenu fields. */
export function menuTypeShowsRouteFields(type: MenuType): boolean {
  return type === 'route';
}

/** External menus store the outbound URL in routeKey. */
export function menuTypeUsesExternalUrl(type: MenuType): boolean {
  return type === 'external';
}

/** activeMenu only applies to hidden sub-pages that should highlight a parent menu item. */
export function menuTypeShowsActiveMenu(node: {
  type: MenuType;
  hideInMenu?: boolean;
  activeMenu?: string | null;
}): boolean {
  if (!menuTypeShowsRouteFields(node.type)) return false;
  return Boolean(node.hideInMenu || node.activeMenu?.trim());
}
