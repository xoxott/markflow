/** 浏览器端 Registry 轻量实现 — 对齐 SubagentRegistry / CoordinatorRegistry API，不依赖 Node 包 */

import type { SubagentDefinitionLike } from '@/views/agent-management/utils/agent-form';

export type CoordinatorDefinitionLike = Omit<
  SubagentDefinitionLike,
  'source' | 'systemPromptPrefix' | 'mcpServers'
>;

export class BrowserSubagentRegistry {
  private readonly definitions = new Map<string, SubagentDefinitionLike>();

  register(def: SubagentDefinitionLike): void {
    if (this.definitions.has(def.agentType)) {
      throw new Error(`子代理 "${def.agentType}" 已注册，不允许覆盖`);
    }
    this.definitions.set(def.agentType, def);
  }

  get(agentType: string): SubagentDefinitionLike | undefined {
    return this.definitions.get(agentType);
  }

  getAll(): SubagentDefinitionLike[] {
    return [...this.definitions.values()];
  }

  size(): number {
    return this.definitions.size;
  }
}

export class BrowserCoordinatorRegistry {
  private readonly definitions = new Map<string, CoordinatorDefinitionLike>();

  register(def: CoordinatorDefinitionLike): void {
    if (this.definitions.has(def.agentType)) {
      throw new Error(`Agent type "${def.agentType}" 已注册`);
    }
    this.definitions.set(def.agentType, def);
  }

  get(agentType: string): CoordinatorDefinitionLike | undefined {
    return this.definitions.get(agentType);
  }

  getAll(): CoordinatorDefinitionLike[] {
    return [...this.definitions.values()];
  }

  clear(): void {
    this.definitions.clear();
  }
}
