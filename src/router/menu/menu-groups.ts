import type { RouteKey } from '@elegant-router/types';

/** 保持顶层展示的一级菜单 */
export const TOP_LEVEL_MENU_KEYS: Array<{ key: RouteKey; order: number }> = [
  { key: 'home', order: 1 },
  { key: 'ai-workflow', order: 2 },
  { key: 'file-manager', order: 3 },
  { key: 'monitoring', order: 4 }
];

export interface MenuGroupDefinition {
  key: string;
  i18nKey: App.I18n.I18nKey;
  icon: string;
  order: number;
  children: RouteKey[];
}

/** 菜单分组：收纳平铺模块，不改变实际路由路径 */
export const MENU_GROUP_DEFINITIONS: MenuGroupDefinition[] = [
  {
    key: 'system-management',
    i18nKey: 'menuGroup.systemManagement',
    icon: 'mdi:cog-outline',
    order: 4,
    children: [
      'user-management',
      'role-management',
      'permission-management',
      'announcement-management',
      'notification-management',
      'alert-management',
      'log-management',
      'version-log-management'
    ]
  },
  {
    key: 'dev-tools',
    i18nKey: 'menuGroup.devTools',
    icon: 'mdi:toolbox-outline',
    order: 5,
    children: ['component', 'mobile', 'upload', 'utils', 'chat', 'markdownedit']
  }
];
