/** Mock Agent Template Management API */

import { v4 as uuidv4 } from 'uuid';
import { bridgeReloadAgentRegistries } from '@/service/agent/agentRegistryBridge';
import {
  agentTemplateToListItem,
  templateToExportJson,
  templateToExportMd
} from '@/views/agent-management/utils/agent-form';
import { AGENT_TYPE_PATTERN } from '@/views/agent-management/constants';
import { agentDataStore, getModelProfileById } from './agent-data-store';

type AgentTemplate = Api.AgentManagement.AgentTemplate;
type AgentTemplateListItem = Api.AgentManagement.AgentTemplateListItem;

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

function createTemplate(
  partial: Omit<AgentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'> & {
    id?: string;
    version?: number;
  }
): AgentTemplate {
  const timestamp = now();
  return {
    id: partial.id ?? uuidv4(),
    version: partial.version ?? 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial
  };
}

const BUILTIN_SEED: Omit<AgentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    agentType: 'general-purpose',
    name: '通用子代理',
    source: 'builtin',
    status: 'published',
    description: '通用子代理，执行各种任务',
    whenToUse: '用于不需要特殊限制的通用任务',
    systemPrompt: '',
    tools: undefined,
    disallowedTools: [],
    maxTurns: 10,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1,
    publishedAt: now()
  },
  {
    agentType: 'explore',
    name: '探索代理',
    source: 'builtin',
    status: 'published',
    description: '代码探索和搜索代理，只做搜索/读取不做修改',
    whenToUse: '需要快速搜索代码、读取文件、探索项目结构时',
    systemPrompt: '你是一个只读探索代理，仅使用搜索和读取工具，不修改任何文件。',
    tools: ['read', 'glob', 'grep', 'search', 'ls', 'file-read', 'file-search'],
    disallowedTools: [],
    maxTurns: 5,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1,
    publishedAt: now()
  },
  {
    agentType: 'plan',
    name: '规划代理',
    source: 'builtin',
    status: 'published',
    description: '规划代理，只做分析和规划不做执行',
    whenToUse: '需要分析任务并制定执行计划时',
    systemPrompt: '你是一个规划代理，只分析和规划，不执行修改操作。',
    tools: ['read', 'glob', 'grep', 'search', 'ls', 'file-read', 'file-search'],
    disallowedTools: [],
    maxTurns: 5,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1,
    publishedAt: now()
  },
  {
    agentType: 'claude-code-guide',
    name: 'Claude Code 指南',
    source: 'builtin',
    status: 'published',
    description: 'Claude Code 使用指南代理',
    whenToUse: '需要回答关于 Claude Code 使用方法、功能、配置的问题时',
    systemPrompt: '你是 Claude Code 使用指南助手。',
    tools: ['read', 'glob', 'grep', 'search'],
    disallowedTools: [],
    maxTurns: 3,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1,
    publishedAt: now()
  },
  {
    agentType: 'statusline-setup',
    name: '状态栏配置',
    source: 'builtin',
    status: 'published',
    description: '状态栏配置代理',
    whenToUse: '需要配置 Claude Code 的状态栏设置时',
    systemPrompt: '帮助用户配置状态栏。',
    tools: ['read', 'glob', 'grep', 'search'],
    disallowedTools: [],
    maxTurns: 3,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1,
    publishedAt: now()
  },
  {
    agentType: 'verification',
    name: '验证代理',
    source: 'builtin',
    status: 'published',
    description: '验证和测试代理，执行检查和验证任务',
    whenToUse: '需要验证代码、运行测试、检查一致性时',
    systemPrompt: '你是一个验证代理，运行测试并报告结果。',
    tools: ['read', 'glob', 'grep', 'bash'],
    disallowedTools: [],
    maxTurns: 5,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1,
    publishedAt: now()
  },
  {
    agentType: 'fork',
    name: 'Fork 子代理',
    source: 'builtin',
    status: 'published',
    description: '并行 fork 子代理，继承父的完整上下文',
    whenToUse: '需要并行执行多个独立子任务时',
    systemPrompt: '',
    tools: undefined,
    disallowedTools: [],
    permissionMode: 'bubble',
    maxTurns: 10,
    background: 'background',
    version: 1,
    publishedAt: now()
  }
];

function ensureSeeded() {
  if (agentDataStore.agentsSeeded && agentDataStore.agents.length > 0) return;
  agentDataStore.agents = BUILTIN_SEED.map(item =>
    createTemplate({
      ...item,
      id: `builtin-${item.agentType}`
    })
  );
  agentDataStore.agentsSeeded = true;
  bridgeReloadAgentRegistries(agentDataStore.agents, agentDataStore.modelProfiles);
}

function getAgentStoreRef() {
  ensureSeeded();
  return agentDataStore.agents;
}

function findAgent(id: string) {
  return getAgentStoreRef().find(a => a.id === id);
}

function findByAgentType(agentType: string) {
  return getAgentStoreRef().find(a => a.agentType === agentType);
}

function toListItem(template: AgentTemplate): AgentTemplateListItem {
  const profile = template.modelProfileId
    ? getModelProfileById(template.modelProfileId)
    : undefined;
  const modelLabel = profile ? `${profile.provider}/${profile.modelId}` : 'inherit';
  return agentTemplateToListItem(template, modelLabel);
}

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

function validateAgentType(agentType: string, excludeId?: string) {
  if (!AGENT_TYPE_PATTERN.test(agentType)) {
    throw new Error('agentType 必须为小写字母开头的 slug（如 my-agent）');
  }
  const dup = getAgentStoreRef().find(a => a.agentType === agentType && a.id !== excludeId);
  if (dup) throw new Error(`agentType "${agentType}" 已存在`);
}

export function getAgentStore(): AgentTemplate[] {
  return getAgentStoreRef();
}

export const mockAgentApi = {
  ensureSeeded,

  async fetchAgentList(params: Api.AgentManagement.AgentListParams) {
    await delay(250);
    ensureSeeded();

    let filtered = [...getAgentStoreRef()];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.agentType.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    if (params.source) filtered = filtered.filter(a => a.source === params.source);
    if (params.status) filtered = filtered.filter(a => a.status === params.status);

    const page = params.page || 1;
    const limit = params.limit || 10;
    const paged = paginate(filtered.map(toListItem), page, limit);

    return createMockResponse(paged);
  },

  async fetchPublishedAgents() {
    await delay(150);
    ensureSeeded();
    const published = getAgentStoreRef()
      .filter(a => a.status === 'published')
      .map(toListItem);
    return createMockResponse(published);
  },

  async fetchAgentDetail(id: string) {
    await delay(200);
    ensureSeeded();
    const agent = findAgent(id);
    if (!agent) throw new Error('智能体模板不存在');
    return createMockResponse(agent);
  },

  async fetchCreateAgent(data: Api.AgentManagement.CreateAgentRequest) {
    await delay(300);
    ensureSeeded();
    validateAgentType(data.agentType);

    const agent = createTemplate({
      agentType: data.agentType,
      name: data.name,
      source: 'custom',
      status: 'draft',
      description: data.description ?? '',
      whenToUse: data.whenToUse ?? '',
      systemPrompt: data.systemPrompt ?? '',
      tools: data.tools,
      disallowedTools: data.disallowedTools,
      modelProfileId: data.modelProfileId,
      maxTurns: data.maxTurns,
      permissionMode: data.permissionMode,
      structuredPermissionMode: data.structuredPermissionMode,
      background: data.background,
      timeout: data.timeout,
      maxResultSizeChars: data.maxResultSizeChars,
      isolation: data.isolation,
      mcpServerIds: data.mcpServerIds,
      skillIds: data.skillIds,
      memoryScope: data.memoryScope,
      color: data.color
    });

    getAgentStoreRef().push(agent);
    return createMockResponse({ message: '创建成功', agent });
  },

  async fetchUpdateAgent(id: string, data: Api.AgentManagement.UpdateAgentRequest) {
    await delay(300);
    ensureSeeded();
    const agent = findAgent(id);
    if (!agent) throw new Error('智能体模板不存在');
    if (agent.source === 'builtin') throw new Error('内置智能体不可编辑');

    if (data.agentType && data.agentType !== agent.agentType) {
      validateAgentType(data.agentType, id);
    }

    Object.assign(agent, data, { updatedAt: now() });
    if (agent.status === 'published') {
      bridgeReloadAgentRegistries(getAgentStoreRef(), agentDataStore.modelProfiles);
    }

    return createMockResponse({ message: '更新成功', agent });
  },

  async fetchDeleteAgent(id: string) {
    await delay(250);
    ensureSeeded();
    const agent = findAgent(id);
    if (!agent) throw new Error('智能体模板不存在');
    if (agent.source === 'builtin') throw new Error('内置智能体不可删除');

    agentDataStore.agents = getAgentStoreRef().filter(a => a.id !== id);
    bridgeReloadAgentRegistries(getAgentStoreRef(), agentDataStore.modelProfiles);
    return createMockResponse({ message: '删除成功' });
  },

  async fetchPublishAgent(id: string) {
    await delay(250);
    ensureSeeded();
    const agent = findAgent(id);
    if (!agent) throw new Error('智能体模板不存在');
    if (agent.source === 'builtin') throw new Error('内置智能体已发布');

    agent.status = 'published';
    agent.version += 1;
    agent.publishedAt = now();
    agent.updatedAt = now();
    bridgeReloadAgentRegistries(getAgentStoreRef(), agentDataStore.modelProfiles);

    return createMockResponse({ message: '发布成功', agent });
  },

  async fetchDisableAgent(id: string) {
    await delay(200);
    ensureSeeded();
    const agent = findAgent(id);
    if (!agent) throw new Error('智能体模板不存在');
    if (agent.source === 'builtin') throw new Error('内置智能体不可停用');

    agent.status = 'disabled';
    agent.updatedAt = now();
    bridgeReloadAgentRegistries(getAgentStoreRef(), agentDataStore.modelProfiles);
    return createMockResponse({ message: '已停用', agent });
  },

  async fetchCopyAgent(id: string, data?: Api.AgentManagement.CopyAgentRequest) {
    await delay(300);
    ensureSeeded();
    const source = findAgent(id);
    if (!source) throw new Error('智能体模板不存在');

    const agentType =
      data?.agentType ?? `${source.agentType}-copy-${Date.now().toString(36).slice(-4)}`;
    validateAgentType(agentType);

    const copy = createTemplate({
      ...source,
      id: undefined,
      agentType,
      name: data?.name ?? `${source.name} (副本)`,
      source: 'custom',
      status: 'draft',
      version: 1,
      publishedAt: undefined
    });

    getAgentStoreRef().push(copy);
    return createMockResponse({ message: '复制成功', agent: copy });
  },

  async fetchExportAgent(id: string, format: Api.AgentManagement.ExportFormat = 'json') {
    await delay(150);
    ensureSeeded();
    const agent = findAgent(id);
    if (!agent) throw new Error('智能体模板不存在');

    const content = format === 'md' ? templateToExportMd(agent) : templateToExportJson(agent);
    return createMockResponse({
      format,
      content,
      filename: `${agent.agentType}.${format === 'md' ? 'md' : 'json'}`
    } satisfies Api.AgentManagement.ExportAgentResponse);
  },

  async fetchReloadRegistry() {
    await delay(200);
    ensureSeeded();
    const result = bridgeReloadAgentRegistries(getAgentStoreRef(), agentDataStore.modelProfiles);
    return createMockResponse(result);
  },

  getAgentById(id: string) {
    ensureSeeded();
    return findAgent(id);
  },

  getPublishedById(id: string) {
    ensureSeeded();
    const agent = findAgent(id);
    return agent?.status === 'published' ? agent : undefined;
  },

  getByAgentType(agentType: string) {
    ensureSeeded();
    return findByAgentType(agentType);
  }
};

export type AgentMockApi = typeof mockAgentApi;
