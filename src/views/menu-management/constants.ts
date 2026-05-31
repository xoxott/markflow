import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import type { MenuTreeNode } from './types';

export type MenuType = Api.MenuManagement.MenuType;

export interface MenuTypeMeta {
  label: () => string;
  tagType: 'info' | 'default' | 'success';
  icon: string;
}

export const MENU_TYPE_META: Record<MenuType, MenuTypeMeta> = {
  group: {
    label: () => $t('page.menuManagement.typeGroup'),
    tagType: 'info',
    icon: 'mdi:folder-outline'
  },
  route: {
    label: () => $t('page.menuManagement.typeRoute'),
    tagType: 'default',
    icon: 'mdi:file-document-outline'
  },
  external: {
    label: () => $t('page.menuManagement.typeExternal'),
    tagType: 'success',
    icon: 'mdi:open-in-new'
  }
};

export function getMenuTypeOptions(): SelectOption[] {
  return (['group', 'route', 'external'] as const).map(type => ({
    label: MENU_TYPE_META[type].label(),
    value: type
  }));
}

export interface MenuTreeStats {
  total: number;
  groups: number;
  routes: number;
  inactive: number;
}

export interface ParentGroupOption {
  label: string;
  value: string;
}

export type MenuTreeWalker = (node: MenuTreeNode, depth: number) => void;
