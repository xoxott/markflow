import { NButton, NSpace, NTag, NText } from 'naive-ui';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type Workflow = Api.Workflow.Workflow;

export const WORKFLOW_LIST_SCROLL_X = 1650;

export function createWorkflowSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: '搜索工作流名称或描述',
      icon: 'i-carbon-search',
      width: '240px'
    },
    {
      type: 'select',
      field: 'status',
      label: '状态',
      placeholder: '选择状态',
      width: '140px',
      options: [
        { label: '全部', value: undefined },
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已归档', value: 'archived' }
      ]
    }
  ];
}

const statusTypeMap = {
  draft: 'default',
  published: 'success',
  archived: 'warning'
} as const;

const statusLabelMap: Record<Api.Workflow.WorkflowStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档'
};

export interface WorkflowTableColumnHandlers {
  onEdit: (row: Workflow) => void;
  onCopy: (row: Workflow) => void;
  onExecute: (row: Workflow) => void;
  onVersion: (row: Workflow) => void;
  onPublish: (row: Workflow) => void;
  onArchive: (row: Workflow) => void;
  onDelete: (row: Workflow) => void;
}

export function createWorkflowTableColumns(
  h: WorkflowTableColumnHandlers
): TableColumnConfig<Workflow>[] {
  return [
    {
      title: '名称',
      key: 'name',
      width: 220,
      fixed: 'left',
      ellipsis: { tooltip: true },
      render: (row: Workflow) => (
        <div class="flex flex-col gap-2px min-w-0">
          <NText strong class="truncate">
            {row.name}
          </NText>
          <NText depth={3} class="truncate text-12px">
            {row.description || '-'}
          </NText>
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 110,
      render: (row: Workflow) => (
        <NTag type={statusTypeMap[row.status]} size="small" round>
          {statusLabelMap[row.status]}
        </NTag>
      )
    },
    {
      title: '版本',
      key: 'version',
      width: 90,
      render: (row: Workflow) => <NText depth={2}>{`v${row.version}`}</NText>
    },
    {
      title: '节点数',
      key: 'nodeCount',
      width: 100
    },
    {
      title: '执行次数',
      key: 'executionCount',
      width: 100
    },
    {
      title: '最后执行时间',
      key: 'lastExecutedAt',
      width: 180,
      render: (row: Workflow) => {
        if (!row.lastExecutedAt) return <NText depth={3}>-</NText>;
        return new Date(row.lastExecutedAt).toLocaleString('zh-CN');
      }
    },
    {
      title: '创建时间',
      key: 'createdAt',
      width: 180,
      render: (row: Workflow) => new Date(row.createdAt).toLocaleString('zh-CN')
    },
    {
      title: $t('common.operate'),
      key: 'action',
      width: 360,
      fixed: 'right',
      render: (row: Workflow) => (
        <NSpace size="small">
          <NButton size="small" type="primary" secondary onClick={() => h.onEdit(row)}>
            <div class="flex items-center gap-4px">
              <div class="i-carbon-edit text-14px" />
              <span>编辑</span>
            </div>
          </NButton>
          <NButton size="small" secondary onClick={() => h.onCopy(row)}>
            <div class="flex items-center gap-4px">
              <div class="i-carbon-copy text-14px" />
              <span>复制</span>
            </div>
          </NButton>
          <NButton size="small" type="info" secondary onClick={() => h.onExecute(row)}>
            <div class="flex items-center gap-4px">
              <div class="i-carbon-play-filled-alt text-14px" />
              <span>执行</span>
            </div>
          </NButton>
          <NButton size="small" secondary onClick={() => h.onVersion(row)}>
            <div class="flex items-center gap-4px">
              <div class="i-carbon-version text-14px" />
              <span>版本</span>
            </div>
          </NButton>

          {row.status === 'draft' && (
            <NButton size="small" type="success" secondary onClick={() => h.onPublish(row)}>
              <div class="flex items-center gap-4px">
                <div class="i-carbon-upload text-14px" />
                <span>发布</span>
              </div>
            </NButton>
          )}

          {row.status === 'published' && (
            <NButton size="small" type="warning" secondary onClick={() => h.onArchive(row)}>
              <div class="flex items-center gap-4px">
                <div class="i-carbon-archive text-14px" />
                <span>归档</span>
              </div>
            </NButton>
          )}

          <NButton size="small" type="error" secondary onClick={() => h.onDelete(row)}>
            <div class="flex items-center gap-4px">
              <div class="i-carbon-trash-can text-14px" />
              <span>{$t('common.delete')}</span>
            </div>
          </NButton>
        </NSpace>
      )
    }
  ];
}

