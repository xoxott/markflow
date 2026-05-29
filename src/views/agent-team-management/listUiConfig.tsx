import { NTag } from 'naive-ui';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';

type Team = Api.AgentManagement.AgentTeam;

export function createAgentTeamSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: '搜索',
      placeholder: '团队名称',
      width: '200px'
    },
    {
      type: 'select',
      field: 'status',
      label: '状态',
      placeholder: '全部',
      width: '120px',
      options: [
        { label: '空闲', value: 'idle' },
        { label: '运行中', value: 'running' },
        { label: '已停止', value: 'stopped' }
      ]
    }
  ];
}

export interface AgentTeamTableHandlers {
  onDetail: (row: Team) => void;
  onStart: (row: Team) => void;
  onStop: (row: Team) => void;
  onEdit: (row: Team) => void;
  onDelete: (row: Team) => void;
}

const STATUS_MAP: Record<string, { label: string; type: 'default' | 'success' | 'warning' }> = {
  idle: { label: '空闲', type: 'default' },
  running: { label: '运行中', type: 'success' },
  stopped: { label: '已停止', type: 'warning' }
};

export function createAgentTeamTableColumns(h: AgentTeamTableHandlers): TableColumnConfig<Team>[] {
  return [
    { title: '团队名称', key: 'name', width: 180 },
    { title: '协调 Agent', key: 'coordinatorAgentType', width: 160 },
    {
      title: '成员数',
      key: 'workerTemplateIds',
      width: 80,
      render: (row: Team) => row.workerTemplateIds.length
    },
    {
      title: '阶段策略',
      key: 'phaseStrategy',
      width: 100,
      render: (row: Team) => row.phaseStrategy ?? 'default'
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (row: Team) => {
        const s = STATUS_MAP[row.status] ?? { label: row.status, type: 'default' as const };
        return (
          <NTag size="small" type={s.type} bordered={false}>
            {s.label}
          </NTag>
        );
      }
    },
    createActionColumn({
      mode: 'menu',
      buttons: [
        { key: 'detail', label: '详情', icon: 'carbon:view', onClick: h.onDetail },
        {
          key: 'start',
          label: '启动编排',
          icon: 'carbon:play',
          disabled: (row: Team) => row.status === 'running',
          onClick: h.onStart
        },
        {
          key: 'stop',
          label: '停止',
          icon: 'carbon:stop',
          disabled: (row: Team) => row.status !== 'running',
          onClick: h.onStop
        },
        { key: 'edit', label: '编辑', icon: 'carbon:edit', onClick: h.onEdit },
        {
          key: 'delete',
          label: '删除',
          icon: 'carbon:trash-can',
          divider: true,
          onClick: h.onDelete
        }
      ]
    })
  ];
}

export const AGENT_TEAM_LIST_SCROLL_X = 852;
