import { NTag } from 'naive-ui';
import { createQueryBooleanSelectOptions } from '@/constants/queryBoolean';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type Resource = Api.ResourceManagement.Resource;

export function createResourceSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.resourceManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '220px'
    },
    {
      type: 'select',
      field: 'isActive',
      label: $t('page.resourceManagement.status'),
      placeholder: $t('page.resourceManagement.statusPlaceholder'),
      width: '120px',
      options: createQueryBooleanSelectOptions(
        $t('page.resourceManagement.active'),
        $t('page.resourceManagement.inactive')
      )
    }
  ];
}

export interface ResourceTableColumnHandlers {
  onEdit: (row: Resource) => void;
  onDelete: (row: Resource) => void;
}

export function createResourceTableColumns(
  h: ResourceTableColumnHandlers
): TableColumnConfig<Resource>[] {
  return [
    { title: $t('page.resourceManagement.code'), key: 'code', width: 160 },
    { title: $t('page.resourceManagement.name'), key: 'name', width: 180 },
    {
      title: $t('page.resourceManagement.description'),
      key: 'description',
      width: 220,
      render: (row: Resource) => row.description || '-'
    },
    {
      title: $t('page.resourceManagement.status'),
      key: 'isActive',
      width: 100,
      render: (row: Resource) => (
        <NTag type={row.isActive ? 'success' : 'default'} size="small">
          {row.isActive
            ? $t('page.resourceManagement.active')
            : $t('page.resourceManagement.inactive')}
        </NTag>
      )
    },
    {
      title: $t('page.resourceManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    createActionColumn({
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
    })
  ];
}

export const RESOURCE_LIST_SCROLL_X = 980;
