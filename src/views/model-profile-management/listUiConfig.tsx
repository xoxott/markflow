import { NSwitch, NTag } from 'naive-ui';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type Profile = Api.AgentManagement.ModelProfile;

export function createModelProfileSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.modelProfileManagement.searchPlaceholder'),
      width: '200px'
    },
    {
      type: 'select',
      field: 'provider',
      label: $t('page.modelProfileManagement.provider'),
      placeholder: '全部',
      width: '120px',
      options: [
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'OpenAI', value: 'openai' }
      ]
    }
  ];
}

export interface ModelProfileTableHandlers {
  onEdit: (row: Profile) => void;
  onCredential: (row: Profile) => void;
  onTest: (row: Profile) => void;
  onDelete: (row: Profile) => void;
  onToggleEnabled: (row: Profile, enabled: boolean) => void;
}

export function createModelProfileTableColumns(
  h: ModelProfileTableHandlers
): TableColumnConfig<Profile>[] {
  return [
    { title: $t('page.modelProfileManagement.name'), key: 'name', width: 160 },
    {
      title: $t('page.modelProfileManagement.provider'),
      key: 'provider',
      width: 100,
      render: (row: Profile) => (
        <NTag size="small" bordered={false}>
          {row.provider}
        </NTag>
      )
    },
    { title: $t('page.modelProfileManagement.modelId'), key: 'modelId', width: 200 },
    {
      title: $t('page.modelProfileManagement.credential'),
      key: 'hasCredential',
      width: 100,
      render: (row: Profile) => (
        <NTag size="small" type={row.hasCredential ? 'success' : 'warning'} bordered={false}>
          {row.hasCredential ? '已配置' : '未配置'}
        </NTag>
      )
    },
    {
      title: $t('page.modelProfileManagement.default'),
      key: 'isDefault',
      width: 80,
      render: (row: Profile) => (row.isDefault ? '是' : '-')
    },
    {
      title: $t('page.modelProfileManagement.enabled'),
      key: 'enabled',
      width: 90,
      render: (row: Profile) => (
        <NSwitch value={row.enabled} onUpdateValue={(v: boolean) => h.onToggleEnabled(row, v)} />
      )
    },
    createActionColumn({
      mode: 'inline',
      maxShow: 2,
      buttons: [
        {
          label: $t('common.edit'),
          type: 'primary',
          icon: 'carbon:edit',
          onClick: h.onEdit
        },
        {
          label: $t('page.modelProfileManagement.credential'),
          icon: 'carbon:password',
          onClick: h.onCredential
        },
        {
          label: $t('page.modelProfileManagement.testConnection'),
          icon: 'carbon:connection-signal',
          onClick: h.onTest
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

export const MODEL_PROFILE_LIST_SCROLL_X = 992;
