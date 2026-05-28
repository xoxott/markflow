/** Mock Model Profile Management API */

import { v4 as uuidv4 } from 'uuid';
import { bridgeReloadAgentRegistries } from '@/service/agent/agentRegistryBridge';
import { agentDataStore, getModelProfileById as lookupModelProfileById } from './agent-data-store';

type ModelProfile = Api.AgentManagement.ModelProfile;

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

const credentialStore = new Map<string, { apiKey: string; organization?: string }>();

function createProfile(
  partial: Omit<ModelProfile, 'id' | 'createdAt' | 'updatedAt' | 'hasCredential'> & {
    id?: string;
  }
): ModelProfile {
  const timestamp = now();
  const id = partial.id ?? uuidv4();
  return {
    id,
    hasCredential: credentialStore.has(id),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial
  };
}

const SEED: Omit<ModelProfile, 'id' | 'createdAt' | 'updatedAt' | 'hasCredential'>[] = [
  {
    name: 'Claude Sonnet',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    thinking: false,
    isDefault: true,
    enabled: true
  },
  {
    name: 'GPT-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    maxTokens: 4096,
    thinking: false,
    isDefault: false,
    enabled: true
  },
  {
    name: 'GPT-4 Turbo',
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    maxTokens: 4096,
    isDefault: false,
    enabled: true
  }
];

function ensureSeeded() {
  if (agentDataStore.profilesSeeded && agentDataStore.modelProfiles.length > 0) return;
  agentDataStore.modelProfiles = SEED.map((item, i) => {
    const id = `model-${i + 1}`;
    credentialStore.set(id, { apiKey: `sk-mock-${id}` });
    return createProfile({ ...item, id, hasCredential: true } as Parameters<
      typeof createProfile
    >[0] & {
      hasCredential: boolean;
    });
  });
  agentDataStore.profilesSeeded = true;
}

function syncRegistry() {
  bridgeReloadAgentRegistries(agentDataStore.agents, agentDataStore.modelProfiles);
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

export function getModelProfileStore(): ModelProfile[] {
  ensureSeeded();
  return agentDataStore.modelProfiles;
}

export function getModelProfileById(id: string) {
  ensureSeeded();
  return lookupModelProfileById(id);
}

export const mockModelProfileApi = {
  ensureSeeded,

  async fetchModelProfileList(params: Api.AgentManagement.ModelProfileListParams) {
    await delay(250);
    ensureSeeded();

    let filtered = [...agentDataStore.modelProfiles];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(q) || p.modelId.toLowerCase().includes(q)
      );
    }
    if (params.provider) filtered = filtered.filter(p => p.provider === params.provider);
    if (params.enabled !== undefined && params.enabled !== null)
      filtered = filtered.filter(p => (p.enabled ? 1 : 0) === params.enabled);

    return createMockResponse(paginate(filtered, params.page || 1, params.limit || 10));
  },

  async fetchModelProfileDetail(id: string) {
    await delay(150);
    ensureSeeded();
    const profile = getModelProfileById(id);
    if (!profile) throw new Error('模型配置不存在');
    return createMockResponse(profile);
  },

  async fetchCreateModelProfile(data: Api.AgentManagement.CreateModelProfileRequest) {
    await delay(300);
    ensureSeeded();

    if (data.isDefault) {
      agentDataStore.modelProfiles.forEach(p => {
        p.isDefault = false;
      });
    }

    const profile = createProfile({
      name: data.name,
      provider: data.provider,
      modelId: data.modelId,
      baseURL: data.baseURL,
      maxTokens: data.maxTokens,
      thinking: data.thinking,
      isDefault: data.isDefault ?? false,
      enabled: data.enabled ?? true
    });
    profile.hasCredential = false;

    agentDataStore.modelProfiles.push(profile);
    return createMockResponse({ message: '创建成功', profile });
  },

  async fetchUpdateModelProfile(id: string, data: Api.AgentManagement.UpdateModelProfileRequest) {
    await delay(300);
    ensureSeeded();
    const profile = getModelProfileById(id);
    if (!profile) throw new Error('模型配置不存在');

    if (data.isDefault) {
      agentDataStore.modelProfiles.forEach(p => {
        p.isDefault = false;
      });
    }

    Object.assign(profile, data, { updatedAt: now() });
    syncRegistry();
    return createMockResponse({ message: '更新成功', profile });
  },

  async fetchDeleteModelProfile(id: string) {
    await delay(250);
    ensureSeeded();
    agentDataStore.modelProfiles = agentDataStore.modelProfiles.filter(p => p.id !== id);
    credentialStore.delete(id);
    return createMockResponse({ message: '删除成功' });
  },

  async fetchSaveModelCredential(id: string, data: Api.AgentManagement.SaveModelCredentialRequest) {
    await delay(200);
    ensureSeeded();
    const profile = getModelProfileById(id);
    if (!profile) throw new Error('模型配置不存在');

    credentialStore.set(id, { apiKey: data.apiKey, organization: data.organization });
    profile.hasCredential = true;
    profile.updatedAt = now();
    return createMockResponse({ message: '凭证已保存', profile });
  },

  async fetchTestModelConnection(id: string) {
    await delay(500);
    ensureSeeded();
    const profile = getModelProfileById(id);
    if (!profile) throw new Error('模型配置不存在');
    if (!profile.hasCredential) throw new Error('请先配置 API 凭证');

    return createMockResponse({
      success: true,
      latencyMs: 120 + Math.floor(Math.random() * 80),
      models: [profile.modelId, `${profile.modelId}-preview`],
      message: '连接成功'
    } satisfies Api.AgentManagement.TestConnectionResponse);
  }
};
