import type { MenuFormData } from '../components/dialog';

export function createDefaultFormData(parentId: string | null = null): MenuFormData {
  return {
    type: 'route',
    name: '',
    i18nKey: '',
    routeKey: '',
    icon: '',
    parentId,
    order: 1,
    isActive: true,
    hideInMenu: false,
    activeMenu: '',
    permissionCodes: []
  };
}

export function menuNodeToFormData(node: Api.MenuManagement.MenuTreeNode | null): MenuFormData {
  if (!node) {
    return createDefaultFormData();
  }

  return {
    type: node.type,
    name: node.name,
    i18nKey: node.i18nKey ?? '',
    routeKey: node.routeKey ?? '',
    icon: node.icon ?? '',
    parentId: node.parentId,
    order: node.order,
    isActive: node.isActive,
    hideInMenu: node.hideInMenu ?? false,
    activeMenu: node.activeMenu ?? '',
    permissionCodes: node.permissionCodes ? [...node.permissionCodes] : []
  };
}

function toOptionalRouteKey(value: string): import('@elegant-router/types').RouteKey | undefined {
  return value ? (value as import('@elegant-router/types').RouteKey) : undefined;
}

export function formDataToCreateRequest(data: MenuFormData): Api.MenuManagement.CreateMenuRequest {
  return {
    type: data.type,
    name: data.name,
    i18nKey: (data.i18nKey || null) as App.I18n.I18nKey | null,
    routeKey: data.type === 'route' ? toOptionalRouteKey(data.routeKey) : undefined,
    icon: data.icon || undefined,
    parentId: data.parentId,
    order: data.order,
    isActive: data.isActive,
    hideInMenu: data.hideInMenu,
    activeMenu: data.type === 'route' ? toOptionalRouteKey(data.activeMenu) : undefined,
    permissionCodes: data.type === 'route' ? data.permissionCodes : []
  };
}

export function formDataToUpdateRequest(data: MenuFormData): Api.MenuManagement.UpdateMenuRequest {
  return formDataToCreateRequest(data);
}
