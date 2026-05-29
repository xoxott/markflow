import { NSpace, NTag } from 'naive-ui';
import { createQueryBooleanSelectOptions } from '@/constants/queryBoolean';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type Role = Api.RoleManagement.Role;

/** 搜索区：字段、控件类型、宽度等为静态配置；文案走 i18n */
export function createRoleSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.roleManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    },
    {
      type: 'select',
      field: 'isActive',
      label: $t('page.roleManagement.status'),
      placeholder: $t('page.roleManagement.statusPlaceholder'),
      width: '120px',
      options: createQueryBooleanSelectOptions(
        $t('page.roleManagement.active'),
        $t('page.roleManagement.inactive')
      )
    },
    {
      type: 'select',
      field: 'isSystem',
      label: $t('page.roleManagement.isSystem'),
      placeholder: $t('page.roleManagement.isSystemPlaceholder'),
      width: '120px',
      options: createQueryBooleanSelectOptions(
        $t('page.roleManagement.systemRole'),
        $t('page.roleManagement.customRole')
      )
    }
  ];
}

export interface RoleTableColumnHandlers {
  onEdit: (row: Role) => void;
  onDelete: (row: Role) => void;
  onAssignPermissions: (row: Role) => void;
}

function renderPermissionsCell(row: Role) {
  const permissions = row.permissions ?? [];
  if (permissions.length === 0) {
    return '-';
  }
  const visible = permissions.slice(0, 2);
  const rest = permissions.length - visible.length;
  return (
    <NSpace size="small" wrap={false}>
      {visible.map(p => (
        <NTag key={p.id} size="small">
          {p.name}
        </NTag>
      ))}
      {rest > 0 ? (
        <NTag size="small" type="info">
          +{rest}
        </NTag>
      ) : null}
    </NSpace>
  );
}

/** 表格列：key / 宽度 / 固定列等为静态配置；操作列注入页面内事件 */
export function createRoleTableColumns(h: RoleTableColumnHandlers): TableColumnConfig<Role>[] {
  return [
    {
      title: $t('page.roleManagement.name'),
      key: 'name',
      width: 150
    },
    {
      title: $t('page.roleManagement.code'),
      key: 'code',
      width: 150
    },
    {
      title: $t('page.roleManagement.level'),
      key: 'level',
      width: 90
    },
    {
      title: $t('page.roleManagement.parentRole'),
      key: 'parentRole',
      width: 140,
      render: (row: Role) => row.parentRole?.name ?? '-'
    },
    {
      title: $t('page.roleManagement.permissions'),
      key: 'permissions',
      width: 220,
      render: (row: Role) => renderPermissionsCell(row)
    },
    {
      title: $t('page.roleManagement.isSystem'),
      key: 'isSystem',
      width: 100,
      render: (row: Role) => (
        <NTag type={row.isSystem ? 'info' : 'default'} size="small">
          {row.isSystem
            ? $t('page.roleManagement.systemRole')
            : $t('page.roleManagement.customRole')}
        </NTag>
      )
    },
    {
      title: $t('page.roleManagement.description'),
      key: 'description',
      width: 180,
      render: (row: Role) => row.description || '-'
    },
    {
      title: $t('page.roleManagement.status'),
      key: 'isActive',
      width: 100,
      render: (row: Role) => (
        <NTag type={row.isActive ? 'success' : 'default'} size="small">
          {row.isActive ? $t('page.roleManagement.active') : $t('page.roleManagement.inactive')}
        </NTag>
      )
    },
    {
      title: $t('page.roleManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    {
      title: $t('page.roleManagement.updatedAt'),
      key: 'updatedAt',
      width: 180,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    createActionColumn({
      mode: 'inline',
      maxShow: 3,
      buttons: [
        {
          label: $t('page.roleManagement.assignPermissions'),
          type: 'info',
          icon: 'carbon:key',
          onClick: h.onAssignPermissions
        },
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
          disabled: (row: Role) => row.isSystem,
          onClick: h.onDelete
        }
      ]
    })
  ];
}

export const ROLE_LIST_SCROLL_X = 2040;
