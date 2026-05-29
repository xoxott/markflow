import { NTag, NText } from 'naive-ui';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type Workflow = Api.Workflow.Workflow;

export const WORKFLOW_LIST_SCROLL_X = 1362;

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
        <div class="min-w-0 flex flex-col gap-2px">
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
    createActionColumn({
      mode: 'menu',
      buttons: [
        { key: 'edit', label: '编辑', icon: 'carbon:edit', onClick: h.onEdit },
        { key: 'copy', label: '复制', icon: 'carbon:copy', onClick: h.onCopy },
        { key: 'execute', label: '执行', icon: 'carbon:play-filled-alt', onClick: h.onExecute },
        { key: 'version', label: '版本', icon: 'carbon:version', onClick: h.onVersion },
        {
          key: 'publish',
          label: '发布',
          icon: 'carbon:upload',
          show: (row: Workflow) => row.status === 'draft',
          onClick: h.onPublish
        },
        {
          key: 'archive',
          label: '归档',
          icon: 'carbon:archive',
          show: (row: Workflow) => row.status === 'published',
          onClick: h.onArchive
        },
        {
          key: 'delete',
          label: $t('common.delete'),
          icon: 'carbon:trash-can',
          divider: true,
          onClick: h.onDelete
        }
      ]
    })
  ];
}
