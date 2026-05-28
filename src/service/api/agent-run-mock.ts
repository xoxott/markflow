/** Mock Agent Team / Session / Run API */

import { v4 as uuidv4 } from 'uuid';
import { emitRunEvent } from '@/service/agent/agentRegistryBridge';
import { agentDataStore } from './agent-data-store';
import { mockAgentApi } from './agent-mock';

type AgentTeam = Api.AgentManagement.AgentTeam;
type AgentTeamDetail = Api.AgentManagement.AgentTeamDetail;
type AgentRun = Api.AgentManagement.AgentRun;
type AgentSession = Api.AgentManagement.AgentSession;
type AgentRunEvent = Api.AgentManagement.AgentRunEvent;

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const createMockResponse = <T>(data: T) => ({
  data,
  error: null,
  response: {} as any
});

const now = () => new Date().toISOString();

const ORCHESTRATION_PHASES = ['research', 'synthesis', 'implementation', 'verification'];

let teamStore: AgentTeam[] = [];
let sessionStore: AgentSession[] = [];
let runStore: AgentRun[] = [];
const eventStore: Map<string, AgentRunEvent[]> = new Map();
const teamWorkers: Map<string, Api.AgentManagement.AgentTeamWorker[]> = new Map();
let seeded = false;

function paginate<T>(items: T[], page = 1, limit = 10) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    lists: items.slice(start, end),
    meta: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
      hasPrevPage: page > 1,
      hasNextPage: end < items.length
    }
  };
}

function ensureSeeded() {
  if (seeded) return;
  mockAgentApi.ensureSeeded();

  const sessionId = 'session-demo-1';
  sessionStore = [
    {
      sessionId,
      title: '代码审查会话',
      tag: 'review',
      status: 'active',
      turnCount: 3,
      modelProfileId: 'model-1',
      accumulatedCostUsd: 0.042,
      lastActiveAt: now(),
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      sessionId: 'session-demo-2',
      title: '工作流调试',
      status: 'completed',
      turnCount: 8,
      modelProfileId: 'model-2',
      accumulatedCostUsd: 0.128,
      lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  runStore = [
    {
      runId: 'run-demo-1',
      agentType: 'explore',
      templateId: 'builtin-explore',
      parentSessionId: sessionId,
      task: '搜索项目中 agent 相关代码',
      status: 'completed',
      startedAt: new Date(Date.now() - 3000000).toISOString(),
      endedAt: new Date(Date.now() - 2900000).toISOString(),
      durationMs: 100000,
      tokensUsed: { input: 1200, output: 450 },
      costUsd: 0.012,
      outputSummary: '找到 12 个相关文件'
    },
    {
      runId: 'run-demo-2',
      agentType: 'verification',
      templateId: 'builtin-verification',
      parentSessionId: sessionId,
      task: '运行 lint 检查',
      status: 'running',
      startedAt: new Date(Date.now() - 60000).toISOString(),
      tokensUsed: { input: 800, output: 120 }
    }
  ];

  eventStore.set('run-demo-1', [
    {
      runId: 'run-demo-1',
      seq: 1,
      type: 'turn_start',
      payload: { turn: 1 },
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      runId: 'run-demo-1',
      seq: 2,
      type: 'tool_use_start',
      payload: { tool: 'grep', input: 'SubagentDefinition' },
      timestamp: new Date(Date.now() - 2950000).toISOString()
    },
    {
      runId: 'run-demo-1',
      seq: 3,
      type: 'tool_result',
      payload: { success: true },
      timestamp: new Date(Date.now() - 2900000).toISOString()
    },
    {
      runId: 'run-demo-1',
      seq: 4,
      type: 'loop_end',
      payload: { success: true },
      timestamp: new Date(Date.now() - 2900000).toISOString()
    }
  ]);

  teamStore = [
    {
      id: 'team-demo-1',
      name: '全栈开发团队',
      coordinatorAgentType: 'general-purpose',
      workerTemplateIds: ['builtin-explore', 'builtin-plan', 'builtin-verification'],
      phaseStrategy: 'default',
      status: 'idle',
      description: '四阶段编排：研究 → 综合 → 实现 → 验证',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: now()
    }
  ];

  teamWorkers.set('team-demo-1', [
    {
      workerId: 'worker-1',
      teamId: 'team-demo-1',
      agentType: 'explore',
      templateId: 'builtin-explore',
      name: 'Explorer',
      status: 'idle',
      lastActiveAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      workerId: 'worker-2',
      teamId: 'team-demo-1',
      agentType: 'plan',
      templateId: 'builtin-plan',
      name: 'Planner',
      status: 'idle'
    }
  ]);

  seeded = true;
}

function buildTeamDetail(team: AgentTeam): AgentTeamDetail {
  return {
    ...team,
    workers: teamWorkers.get(team.id) ?? []
  };
}

function appendRunEvent(runId: string, type: string, payload: Record<string, unknown>) {
  const events = eventStore.get(runId) ?? [];
  const event: AgentRunEvent = {
    runId,
    seq: events.length + 1,
    type,
    payload,
    timestamp: now()
  };
  events.push(event);
  eventStore.set(runId, events);
  emitRunEvent(event);
  return event;
}

export const mockAgentRunApi = {
  ensureSeeded,

  async fetchAgentTeamList(params: Api.AgentManagement.AgentTeamListParams) {
    await delay(250);
    ensureSeeded();

    let filtered = [...teamStore];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(q));
    }
    if (params.status) filtered = filtered.filter(t => t.status === params.status);

    return createMockResponse(paginate(filtered, params.page || 1, params.limit || 10));
  },

  async fetchAgentTeamDetail(id: string) {
    await delay(200);
    ensureSeeded();
    const team = teamStore.find(t => t.id === id);
    if (!team) throw new Error('团队不存在');
    return createMockResponse(buildTeamDetail(team));
  },

  async fetchCreateAgentTeam(data: Api.AgentManagement.CreateAgentTeamRequest) {
    await delay(300);
    ensureSeeded();

    const team: AgentTeam = {
      id: uuidv4(),
      name: data.name,
      coordinatorAgentType: data.coordinatorAgentType,
      workerTemplateIds: data.workerTemplateIds,
      phaseStrategy: data.phaseStrategy ?? 'default',
      status: 'idle',
      description: data.description,
      createdAt: now(),
      updatedAt: now()
    };

    teamStore.push(team);
    teamWorkers.set(
      team.id,
      data.workerTemplateIds.map((templateId, i) => {
        const template = agentDataStore.agents.find(a => a.id === templateId);
        return {
          workerId: uuidv4(),
          teamId: team.id,
          agentType: template?.agentType ?? `worker-${i}`,
          templateId,
          name: template?.name ?? `Worker ${i + 1}`,
          status: 'idle' as const
        };
      })
    );

    return createMockResponse({ message: '创建成功', team: buildTeamDetail(team) });
  },

  async fetchUpdateAgentTeam(id: string, data: Api.AgentManagement.UpdateAgentTeamRequest) {
    await delay(300);
    ensureSeeded();
    const team = teamStore.find(t => t.id === id);
    if (!team) throw new Error('团队不存在');

    Object.assign(team, data, { updatedAt: now() });
    if (data.workerTemplateIds) {
      teamWorkers.set(
        team.id,
        data.workerTemplateIds.map((templateId, i) => {
          const template = agentDataStore.agents.find(a => a.id === templateId);
          return {
            workerId: uuidv4(),
            teamId: team.id,
            agentType: template?.agentType ?? `worker-${i}`,
            templateId,
            name: template?.name ?? `Worker ${i + 1}`,
            status: 'idle' as const
          };
        })
      );
    }

    return createMockResponse({ message: '更新成功', team: buildTeamDetail(team) });
  },

  async fetchDeleteAgentTeam(id: string) {
    await delay(250);
    ensureSeeded();
    teamStore = teamStore.filter(t => t.id !== id);
    teamWorkers.delete(id);
    return createMockResponse({ message: '删除成功' });
  },

  async fetchStartAgentTeam(id: string) {
    await delay(400);
    ensureSeeded();
    const team = teamStore.find(t => t.id === id);
    if (!team) throw new Error('团队不存在');

    team.status = 'running';
    team.updatedAt = now();

    const workers = teamWorkers.get(id) ?? [];
    workers.forEach(w => {
      w.status = 'running';
      w.lastActiveAt = now();
    });

    const sessionId = uuidv4();
    sessionStore.unshift({
      sessionId,
      title: `${team.name} 编排`,
      tag: 'orchestration',
      status: 'active',
      turnCount: 0,
      lastActiveAt: now(),
      createdAt: now()
    });

    ORCHESTRATION_PHASES.forEach((phase, i) => {
      const runId = uuidv4();
      const template = agentDataStore.agents.find(a => a.agentType === team.coordinatorAgentType);
      const run: AgentRun = {
        runId,
        agentType: team.coordinatorAgentType,
        templateId: template?.id,
        parentSessionId: sessionId,
        teamId: id,
        task: `${phase} phase`,
        phase,
        status: i < ORCHESTRATION_PHASES.length - 1 ? 'completed' : 'running',
        startedAt: new Date(Date.now() - (ORCHESTRATION_PHASES.length - i) * 60000).toISOString(),
        endedAt:
          i < ORCHESTRATION_PHASES.length - 1
            ? new Date(Date.now() - (ORCHESTRATION_PHASES.length - i - 1) * 60000).toISOString()
            : undefined,
        durationMs: i < ORCHESTRATION_PHASES.length - 1 ? 60000 : undefined,
        tokensUsed: { input: 500 + i * 200, output: 150 + i * 50 },
        outputSummary: i < ORCHESTRATION_PHASES.length - 1 ? `${phase} 完成` : undefined
      };
      runStore.unshift(run);
      appendRunEvent(runId, 'turn_start', { phase });
      if (run.status === 'completed') {
        appendRunEvent(runId, 'loop_end', { success: true });
      }
    });

    return createMockResponse({ message: '编排已启动', team: buildTeamDetail(team), sessionId });
  },

  async fetchStopAgentTeam(id: string) {
    await delay(200);
    ensureSeeded();
    const team = teamStore.find(t => t.id === id);
    if (!team) throw new Error('团队不存在');

    team.status = 'stopped';
    team.updatedAt = now();
    const workers = teamWorkers.get(id) ?? [];
    workers.forEach(w => {
      w.status = 'shutdown';
    });

    runStore
      .filter(r => r.teamId === id && r.status === 'running')
      .forEach(r => {
        r.status = 'stopped';
        r.endedAt = now();
      });

    return createMockResponse({ message: '编排已停止', team: buildTeamDetail(team) });
  },

  async fetchAgentSessionList(params: Api.AgentManagement.AgentSessionListParams) {
    await delay(250);
    ensureSeeded();

    let filtered = [...sessionStore];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        s => s.title?.toLowerCase().includes(q) || s.sessionId.includes(q)
      );
    }
    if (params.status) filtered = filtered.filter(s => s.status === params.status);

    return createMockResponse(paginate(filtered, params.page || 1, params.limit || 10));
  },

  async fetchUpdateAgentSession(sessionId: string, data: Api.AgentManagement.UpdateSessionRequest) {
    await delay(200);
    ensureSeeded();
    const session = sessionStore.find(s => s.sessionId === sessionId);
    if (!session) throw new Error('会话不存在');

    Object.assign(session, data);
    session.lastActiveAt = now();
    return createMockResponse({ message: '更新成功', session });
  },

  async fetchStopAgentSession(sessionId: string) {
    await delay(200);
    ensureSeeded();
    const session = sessionStore.find(s => s.sessionId === sessionId);
    if (!session) throw new Error('会话不存在');

    session.status = 'destroyed';
    session.lastActiveAt = now();
    runStore
      .filter(r => r.parentSessionId === sessionId && r.status === 'running')
      .forEach(r => {
        r.status = 'stopped';
        r.endedAt = now();
      });

    return createMockResponse({ message: '会话已停止', session });
  },

  async fetchAgentRunList(params: Api.AgentManagement.AgentRunListParams) {
    await delay(250);
    ensureSeeded();

    let filtered = [...runStore];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        r => r.task.toLowerCase().includes(q) || r.agentType.toLowerCase().includes(q)
      );
    }
    if (params.sessionId) filtered = filtered.filter(r => r.parentSessionId === params.sessionId);
    if (params.agentType) filtered = filtered.filter(r => r.agentType === params.agentType);
    if (params.status) filtered = filtered.filter(r => r.status === params.status);
    if (params.teamId) filtered = filtered.filter(r => r.teamId === params.teamId);

    return createMockResponse(paginate(filtered, params.page || 1, params.limit || 10));
  },

  async fetchAgentRunEvents(runId: string) {
    await delay(200);
    ensureSeeded();
    const events = eventStore.get(runId) ?? [];
    return createMockResponse(events);
  }
};
