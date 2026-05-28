import { NButton, NSpace, NTag } from 'naive-ui';
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
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (row: Team) => (
        <NSpace size="small">
          <NButton size="small" onClick={() => h.onDetail(row)}>
            详情
          </NButton>
          <NButton
            size="small"
            type="primary"
            disabled={row.status === 'running'}
            onClick={() => h.onStart(row)}
          >
            启动编排
          </NButton>
          <NButton
            size="small"
            type="warning"
            disabled={row.status !== 'running'}
            onClick={() => h.onStop(row)}
          >
            停止
          </NButton>
          <NButton size="small" onClick={() => h.onEdit(row)}>
            编辑
          </NButton>
          <NButton size="small" type="error" onClick={() => h.onDelete(row)}>
            删除
          </NButton>
        </NSpace>
      )
    }
  ];
}

export const AGENT_TEAM_LIST_SCROLL_X = 1100;
