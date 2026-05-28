export interface IconPresetGroup {
  key: string;
  label: string;
  icons: string[];
}

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

export const ALL_PRESET_ICONS = ICON_PRESET_GROUPS.flatMap(group => group.icons);

export function filterPresetIcons(keyword: string): IconPresetGroup[] {
  const query = keyword.trim().toLowerCase();
  if (!query) return ICON_PRESET_GROUPS;

  return ICON_PRESET_GROUPS.map(group => ({
    ...group,
    icons: group.icons.filter(icon => icon.toLowerCase().includes(query))
  })).filter(group => group.icons.length > 0);
}
