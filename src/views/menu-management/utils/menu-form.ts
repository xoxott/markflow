import type { RouteKey } from '@elegant-router/types';
import type { MenuFormData } from '../components/dialog';
import type { MenuTreeNode } from '../types';

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
    roleCodes: []
  };
}

export function menuNodeToFormData(
  node?: MenuTreeNode | null,
  parentId: string | null = null
): MenuFormData {
  if (!node) return createDefaultFormData(parentId);

  return {
    type: node.type,
    name: node.name,
    i18nKey: node.i18nKey ?? '',
    routeKey: node.routeKey ?? '',
    icon: node.icon ?? '',
    parentId: node.parentId ?? parentId,
    order: node.order,
    isActive: node.isActive,
    hideInMenu: node.hideInMenu ?? false,
    activeMenu: node.activeMenu ?? '',
    roleCodes: node.roleCodes ? [...node.roleCodes] : []
  };
}

function toOptionalRouteKey(value: string): RouteKey | undefined {
  return value ? (value as RouteKey) : undefined;
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
    roleCodes: data.roleCodes
  };
}

export function formDataToUpdateRequest(data: MenuFormData): Api.MenuManagement.UpdateMenuRequest {
  return formDataToCreateRequest(data);
}
