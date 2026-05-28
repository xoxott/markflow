/** 运行时 Registry 单例桥接 — 管理端发布/重载时更新（浏览器安全，不依赖 Node 包） */

import type { BrowserCoordinatorRegistry, BrowserSubagentRegistry } from './browserRegistry';
import { reloadAgentRegistries } from './buildSubagentRegistry';

type AgentTemplate = Api.AgentManagement.AgentTemplate;
type ModelProfile = Api.AgentManagement.ModelProfile;

let subagentRegistry: BrowserSubagentRegistry | null = null;
let coordinatorRegistry: BrowserCoordinatorRegistry | null = null;
let lastReloadAt: string | null = null;

export function getSubagentRegistry(): BrowserSubagentRegistry | null {
  return subagentRegistry;
}

export function getCoordinatorRegistry(): BrowserCoordinatorRegistry | null {
  return coordinatorRegistry;
}

export function getRegistryReloadMeta() {
  return {
    subagentCount: subagentRegistry?.size() ?? 0,
    coordinatorCount: coordinatorRegistry?.getAll().length ?? 0,
    reloadedAt: lastReloadAt
  };
}

/** 从模板列表热更新 Registry（clear + bulk reload） */
export function bridgeReloadAgentRegistries(
  templates: AgentTemplate[],
  modelProfiles: ModelProfile[] = []
): Api.AgentManagement.ReloadRegistryResponse {
  const result = reloadAgentRegistries(templates, modelProfiles);
  subagentRegistry = result.subagentRegistry;
  coordinatorRegistry = result.coordinatorRegistry;
  lastReloadAt = result.reloadedAt;

  return {
    subagentCount: result.subagentCount,
    coordinatorCount: result.coordinatorCount,
    reloadedAt: result.reloadedAt
  };
}

/** 订阅 Run 事件（P4 占位 — 对接 ai-server daemon SSE） */
export type RunEventListener = (event: Api.AgentManagement.AgentRunEvent) => void;

const runEventListeners = new Set<RunEventListener>();

export function subscribeRunEvents(listener: RunEventListener): () => void {
  runEventListeners.add(listener);
  return () => runEventListeners.delete(listener);
}

export function emitRunEvent(event: Api.AgentManagement.AgentRunEvent) {
  runEventListeners.forEach(listener => listener(event));
}
