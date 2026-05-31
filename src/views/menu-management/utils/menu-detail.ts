import { $t } from '@/locales';
import type { MenuTreeNode } from '../types';
import {
  menuTypeRequiresPermissionCodes,
  menuTypeRequiresRouteRegistry,
  menuTypeShowsActiveMenu,
  menuTypeShowsRouteFields,
  menuTypeUsesExternalUrl
} from './menu-type';
import { resolveActiveMenuLabel } from './active-menu';

export type MenuDetailItemVariant = 'text' | 'icon' | 'permissionCodes';

export interface MenuDetailItem {
  key: string;
  label: string;
  value: string;
  variant?: MenuDetailItemVariant;
}

function formatBoolean(value: boolean | undefined): string {
  return value ? $t('page.menuManagement.yes') : $t('page.menuManagement.no');
}

function formatOptional(value: string | null | undefined): string {
  return value?.trim() ? value : '-';
}

export function buildMenuDetailItems(
  node: MenuTreeNode,
  registryItem?: Api.MenuManagement.RouteRegistryItem,
  menuTree?: MenuTreeNode[]
): MenuDetailItem[] {
  const items: MenuDetailItem[] = [
    {
      key: 'icon',
      label: $t('page.menuManagement.icon'),
      value: formatOptional(node.icon),
      variant: node.icon ? 'icon' : 'text'
    },
    {
      key: 'i18nKey',
      label: $t('page.menuManagement.i18nKey'),
      value: formatOptional(node.i18nKey ?? undefined)
    },
    {
      key: 'order',
      label: $t('page.menuManagement.order'),
      value: String(node.order)
    }
  ];

  if (menuTypeRequiresRouteRegistry(node.type)) {
    items.push(
      {
        key: 'routeKey',
        label: $t('page.menuManagement.routeKey'),
        value: formatOptional(node.routeKey)
      },
      {
        key: 'path',
        label: $t('page.menuManagement.path'),
        value: formatOptional(registryItem?.path)
      }
    );
  }

  if (menuTypeUsesExternalUrl(node.type)) {
    items.push({
      key: 'externalUrl',
      label: $t('page.menuManagement.externalUrl'),
      value: formatOptional(node.routeKey)
    });
  }

  if (menuTypeShowsRouteFields(node.type)) {
    items.push({
      key: 'hideInMenu',
      label: $t('page.menuManagement.hideInMenu'),
      value: formatBoolean(node.hideInMenu)
    });
  }

  if (menuTypeShowsActiveMenu(node)) {
    items.push({
      key: 'activeMenu',
      label: $t('page.menuManagement.activeMenu'),
      value: menuTree?.length
        ? resolveActiveMenuLabel(menuTree, node.activeMenu)
        : formatOptional(node.activeMenu)
    });
  }

  if (menuTypeRequiresPermissionCodes(node.type)) {
    items.push({
      key: 'permissionCodes',
      label: $t('page.menuManagement.permissionCodes'),
      value: node.permissionCodes.length ? node.permissionCodes.join(', ') : '-',
      variant: node.permissionCodes.length ? 'permissionCodes' : 'text'
    });
  }

  items.push({
    key: 'updatedAt',
    label: $t('page.menuManagement.updatedAt'),
    value: node.updatedAt
  });

  return items;
}
