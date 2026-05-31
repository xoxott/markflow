import type { RouteKey } from '@elegant-router/types';

/** 保持顶层展示的一级菜单 */
export const TOP_LEVEL_MENU_KEYS: Array<{ key: RouteKey; order: number }> = [
  { key: 'home', order: 1 },
  { key: 'ai-workflow', order: 2 },
  { key: 'file-manager', order: 3 },
  { key: 'monitoring', order: 4 }
];

export interface MenuSubGroupDefinition {
  type: 'subgroup';
  key: string;
  i18nKey: App.I18n.I18nKey;
  icon: string;
  children: RouteKey[];
}

export type MenuGroupChild = RouteKey | MenuSubGroupDefinition;

export interface MenuGroupDefinition {
  key: string;
  i18nKey: App.I18n.I18nKey;
  icon: string;
  order: number;
  children: MenuGroupChild[];
}

/** 菜单分组：收纳平铺模块，不改变实际路由路径 */
export const MENU_GROUP_DEFINITIONS: MenuGroupDefinition[] = [
  {
    key: 'ai-management',
    i18nKey: 'menuGroup.aiManagement',
    icon: 'mdi:robot-outline',
    order: 3,
    children: [
      'agent-management',
      'model-profile-management',
      'agent-team-management',
      'agent-runtime'
    ]
  },
  {
    key: 'system-management',
    i18nKey: 'menuGroup.systemManagement',
    icon: 'mdi:cog-outline',
    order: 4,
    children: [
      'user-management',
      'role-management',
      'permission-management',
      'resource-management',
      'announcement-management',
      'notification-management',
      'alert-management',
      'menu-management',
      {
        type: 'subgroup',
        key: 'log-management-group',
        i18nKey: 'menuGroup.logManagement',
        icon: 'mdi:file-document-multiple-outline',
        children: ['log-management', 'version-log-management']
      }
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
