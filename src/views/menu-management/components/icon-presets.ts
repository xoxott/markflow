export interface IconPresetGroup {
  key: string;
  label: string;
  icons: string[];
}

/** 项目路由与菜单分组中实际使用的图标 */
export const PROJECT_ROUTE_ICONS = [
  'mdi:home-outline',
  'mdi:workflow',
  'mdi:book-open-page-variant',
  'mdi:monitor-dashboard',
  'mdi:chat',
  'mdi:markdown',
  'mdi:menu',
  'mdi:upload-multiple',
  'mdi:account-group',
  'mdi:account-key',
  'mdi:shield-key',
  'mdi:folder-key',
  'mdi:bullhorn',
  'mdi:bell',
  'mdi:alert',
  'mdi:file-document-outline',
  'mdi:file-document-multiple-outline',
  'mdi:history',
  'mdi:robot-outline',
  'mdi:brain',
  'mdi:account-group-outline',
  'mdi:chart-timeline-variant',
  'mdi:cog-outline',
  'mdi:toolbox-outline'
] as const;

/** 菜单管理常用 Iconify 图标预设（mdi 系列） */
export const ICON_PRESET_GROUPS: IconPresetGroup[] = [
  {
    key: 'common',
    label: '常用',
    icons: [
      'mdi:home-outline',
      'mdi:menu',
      'mdi:view-dashboard-outline',
      'mdi:monitor-dashboard',
      'mdi:cog-outline',
      'mdi:dots-grid',
      'mdi:star-outline',
      'mdi:bookmark-outline'
    ]
  },
  {
    key: 'navigation',
    label: '导航',
    icons: [
      'mdi:workflow',
      'mdi:book-open-page-variant',
      'mdi:folder-outline',
      'mdi:file-tree-outline',
      'mdi:map-outline',
      'mdi:compass-outline',
      'mdi:apps',
      'mdi:view-grid-outline'
    ]
  },
  {
    key: 'system',
    label: '系统管理',
    icons: [
      'mdi:account-group',
      'mdi:account-key',
      'mdi:shield-key',
      'mdi:shield-account-outline',
      'mdi:bullhorn',
      'mdi:bell',
      'mdi:bell-outline',
      'mdi:alert',
      'mdi:alert-circle-outline',
      'mdi:file-document-outline',
      'mdi:file-document-multiple-outline',
      'mdi:history',
      'mdi:clipboard-text-outline'
    ]
  },
  {
    key: 'dev',
    label: '开发工具',
    icons: [
      'mdi:toolbox-outline',
      'mdi:chat',
      'mdi:cellphone',
      'mdi:upload-multiple',
      'mdi:wrench-outline',
      'mdi:code-braces',
      'mdi:puzzle-outline',
      'mdi:markdown',
      'mdi:api',
      'mdi:console'
    ]
  },
  {
    key: 'media',
    label: '文件与媒体',
    icons: [
      'mdi:file-outline',
      'mdi:file-image-outline',
      'mdi:file-pdf-box',
      'mdi:file-code-outline',
      'mdi:folder-multiple-outline',
      'mdi:cloud-outline',
      'mdi:database-outline',
      'mdi:archive-outline'
    ]
  },
  {
    key: 'action',
    label: '操作',
    icons: [
      'mdi:plus',
      'mdi:pencil-outline',
      'mdi:delete-outline',
      'mdi:refresh',
      'mdi:export',
      'mdi:import',
      'mdi:filter-outline',
      'mdi:magnify',
      'mdi:check-circle-outline',
      'mdi:close-circle-outline'
    ]
  }
];

export const ALL_PRESET_ICONS = [
  ...new Set([...PROJECT_ROUTE_ICONS, ...ICON_PRESET_GROUPS.flatMap(group => group.icons)])
];

const IN_USE_GROUP_KEY = 'in-use';

export function isIconifyName(value: string): boolean {
  return /^[\w-]+:[\w-]+$/.test(value.trim());
}

export function buildIconPresetGroups(usedIcons: string[] = []): IconPresetGroup[] {
  const used = [...new Set(usedIcons.map(icon => icon.trim()).filter(Boolean))].sort();
  if (!used.length) return ICON_PRESET_GROUPS;

  return [
    {
      key: IN_USE_GROUP_KEY,
      label: '已使用',
      icons: used
    },
    ...ICON_PRESET_GROUPS
  ];
}

export function filterPresetIcons(
  keyword: string,
  groups: IconPresetGroup[] = ICON_PRESET_GROUPS
): IconPresetGroup[] {
  const query = keyword.trim().toLowerCase();
  if (!query) return groups;

  return groups
    .map(group => ({
      ...group,
      icons: group.icons.filter(icon => icon.toLowerCase().includes(query))
    }))
    .filter(group => group.icons.length > 0);
}

export function resolveSearchIcons(keyword: string, groups: IconPresetGroup[]): string[] {
  const matched = filterPresetIcons(keyword, groups).flatMap(group => group.icons);
  const normalized = keyword.trim();
  if (isIconifyName(normalized) && !matched.includes(normalized)) {
    return [normalized, ...matched];
  }
  return matched;
}
