import { NSwitch } from 'naive-ui';
import { createQueryBooleanSelectOptions } from '@/constants/queryBoolean';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type Permission = Api.PermissionManagement.Permission;

const SORT_BY_OPTIONS = [
  { label: '创建时间', value: 'createdAt' },
  { label: '更新时间', value: 'updatedAt' },
  { label: '名称', value: 'name' },
  { label: '代码', value: 'code' },
  { label: '资源', value: 'resource' },
  { label: '操作', value: 'action' }
];

export function createPermissionSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.permissionManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    },
    {
      type: 'select',
      field: 'resource',
      label: $t('page.permissionManagement.resource'),
      placeholder: $t('page.permissionManagement.resourcePlaceholder'),
      width: '120px',
      options: [
        { label: '用户', value: 'user' },
        { label: '角色', value: 'role' },
        { label: '权限', value: 'permission' },
        { label: '系统', value: 'system' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      type: 'select',
      field: 'action',
      label: $t('page.permissionManagement.action'),
      placeholder: $t('page.permissionManagement.actionPlaceholder'),
      width: '120px',
      options: [
        { label: '读取', value: 'read' },
        { label: '写入', value: 'write' },
        { label: '删除', value: 'delete' },
        { label: '创建', value: 'create' },
        { label: '管理', value: 'manage' }
      ]
    },
    {
      type: 'select',
      field: 'sortBy',
      label: $t('page.permissionManagement.sortByLabel'),
      placeholder: $t('page.permissionManagement.sortByLabel'),
      width: '120px',
      options: SORT_BY_OPTIONS
    },
    {
      type: 'select',
      field: 'sortOrder',
      label: $t('page.permissionManagement.sortOrderLabel'),
      placeholder: $t('page.permissionManagement.sortOrderLabel'),
      width: '120px',
      options: [
        { label: '升序', value: 'asc' },
        { label: '降序', value: 'desc' }
      ]
    },
    {
      type: 'select',
      field: 'isActive',
      label: $t('page.permissionManagement.status'),
      placeholder: $t('page.permissionManagement.statusPlaceholder'),
      width: '120px',
      options: createQueryBooleanSelectOptions(
        $t('page.permissionManagement.active'),
        $t('page.permissionManagement.inactive')
      )
    }
  ];
}

export interface PermissionTableColumnHandlers {
  onEdit: (row: Permission) => void;
  onDelete: (row: Permission) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
}

export function createPermissionTableColumns(
  h: PermissionTableColumnHandlers
): TableColumnConfig<Permission>[] {
  return [
    {
      title: $t('page.permissionManagement.name'),
      key: 'name',
      width: 150
    },
    {
      title: $t('page.permissionManagement.code'),
      key: 'code',
      width: 150
    },
    {
      title: $t('page.permissionManagement.resource'),
      key: 'resource',
      width: 120
    },
    {
      title: $t('page.permissionManagement.action'),
      key: 'action',
      width: 120
    },
    {
      title: $t('page.permissionManagement.description'),
      key: 'description',
      width: 200,
      render: (row: Permission) => row.description || '-'
    },
    {
      title: $t('page.permissionManagement.status'),
      key: 'isActive',
      width: 100,
      render: (row: Permission) => (
        <NSwitch
          value={row.isActive}
          onUpdateValue={value => h.onToggleStatus(row.id, value)}
          loading={false}
        />
      )
    },
    {
      title: $t('page.permissionManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    {
      title: $t('page.permissionManagement.updatedAt'),
      key: 'updatedAt',
      width: 180,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    createActionColumn(
      {
        mode: 'inline',
        buttons: [
          {
            label: $t('common.edit'),
            type: 'primary',
            icon: 'carbon:edit',
            onClick: h.onEdit
          },
          {
            label: $t('common.delete'),
            type: 'error',
            icon: 'carbon:trash-can',
            onClick: h.onDelete
          }
        ]
      },
      { key: 'operate' }
    )
  ];
}

export const PERMISSION_LIST_SCROLL_X = 1760;
