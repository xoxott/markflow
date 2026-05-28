import { NButton, NDropdown, NSpace, NTag } from 'naive-ui';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';
import { AGENT_SOURCE_OPTIONS, AGENT_STATUS_OPTIONS } from './constants';

type Agent = Api.AgentManagement.AgentTemplateListItem;

export function createAgentSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.agentManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    },
    {
      type: 'select',
      field: 'source',
      label: $t('page.agentManagement.source'),
      placeholder: '全部',
      width: '120px',
      options: AGENT_SOURCE_OPTIONS.map(o => ({ label: o.label, value: o.value }))
    },
    {
      type: 'select',
      field: 'status',
      label: $t('page.agentManagement.status'),
      placeholder: '全部',
      width: '120px',
      options: AGENT_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }))
    }
  ];
}

const STATUS_TYPE: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'warning',
  published: 'success',
  disabled: 'error'
};

const SOURCE_TYPE: Record<string, 'info' | 'default' | 'success'> = {
  builtin: 'info',
  custom: 'default',
  plugin: 'success'
};

export interface AgentTableColumnHandlers {
  onEdit: (row: Agent) => void;
  onCopy: (row: Agent) => void;
  onPublish: (row: Agent) => void;
  onDisable: (row: Agent) => void;
  onExport: (row: Agent, format: 'md' | 'json') => void;
  onDelete: (row: Agent) => void;
}

export function createAgentTableColumns(h: AgentTableColumnHandlers): TableColumnConfig<Agent>[] {
  return [
    { title: $t('page.agentManagement.name'), key: 'name', width: 160 },
    { title: $t('page.agentManagement.agentType'), key: 'agentType', width: 160 },
    {
      title: $t('page.agentManagement.source'),
      key: 'source',
      width: 90,
      render: (row: Agent) => (
        <NTag size="small" type={SOURCE_TYPE[row.source] ?? 'default'} bordered={false}>
          {AGENT_SOURCE_OPTIONS.find(o => o.value === row.source)?.label ?? row.source}
        </NTag>
      )
    },
    {
      title: $t('page.agentManagement.model'),
      key: 'modelLabel',
      width: 140,
      render: (row: Agent) => row.modelLabel ?? 'inherit'
    },
    {
      title: $t('page.agentManagement.tools'),
      key: 'toolCount',
      width: 80,
      render: (row: Agent) => (row.tools ? row.toolCount : '全部')
    },
    {
      title: $t('page.agentManagement.status'),
      key: 'status',
      width: 100,
      render: (row: Agent) => (
        <NTag size="small" type={STATUS_TYPE[row.status] ?? 'default'} bordered={false}>
          {AGENT_STATUS_OPTIONS.find(o => o.value === row.status)?.label ?? row.status}
        </NTag>
      )
    },
    { title: $t('page.agentManagement.version'), key: 'version', width: 70 },
    {
      title: $t('page.agentManagement.updatedAt'),
      key: 'updatedAt',
      width: 170,
      render: (row: Agent) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleString('zh-CN') : '-'
    },
    {
      title: $t('common.operate'),
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (row: Agent) => (
        <NSpace size="small">
          <NButton size="small" type="primary" onClick={() => h.onEdit(row)}>
            {$t('common.edit')}
          </NButton>
          <NButton size="small" onClick={() => h.onCopy(row)}>
            {$t('page.agentManagement.copy')}
          </NButton>
          {row.source !== 'builtin' && row.status === 'draft' && (
            <NButton size="small" type="success" onClick={() => h.onPublish(row)}>
              {$t('page.agentManagement.publish')}
            </NButton>
          )}
          {row.source !== 'builtin' && row.status === 'published' && (
            <NButton size="small" type="warning" onClick={() => h.onDisable(row)}>
              {$t('page.agentManagement.disable')}
            </NButton>
          )}
          <NDropdown
            options={[
              { label: '导出 JSON', key: 'json' },
              { label: '导出 Markdown', key: 'md' }
            ]}
            onSelect={(key: string) => h.onExport(row, key as 'md' | 'json')}
          >
            <NButton size="small">{$t('page.agentManagement.export')}</NButton>
          </NDropdown>
          {row.source !== 'builtin' && (
            <NButton size="small" type="error" onClick={() => h.onDelete(row)}>
              {$t('common.delete')}
            </NButton>
          )}
        </NSpace>
      )
    }
  ];
}

export const AGENT_LIST_SCROLL_X = 1500;
