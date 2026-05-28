/** 将已发布 AgentTemplate 同步到浏览器端 Registry（Mock / 管理端预览用） */

import {
  templateToCoordinatorDefinition,
  templateToSubagentDefinition
} from '@/views/agent-management/utils/agent-form';
import { BrowserCoordinatorRegistry, BrowserSubagentRegistry } from './browserRegistry';

type AgentTemplate = Api.AgentManagement.AgentTemplate;
type ModelProfile = Api.AgentManagement.ModelProfile;

export function buildSubagentRegistry(
  templates: AgentTemplate[],
  modelProfiles: ModelProfile[] = []
): BrowserSubagentRegistry {
  const registry = new BrowserSubagentRegistry();
  const profileMap = new Map(modelProfiles.map(p => [p.id, p]));

  templates
    .filter(t => t.status === 'published')
    .forEach(template => {
      const profile = template.modelProfileId ? profileMap.get(template.modelProfileId) : undefined;
      registry.register(templateToSubagentDefinition(template, profile?.modelId));
    });

  return registry;
}

export function buildCoordinatorRegistry(
  templates: AgentTemplate[],
  modelProfiles: ModelProfile[] = []
): BrowserCoordinatorRegistry {
  const registry = new BrowserCoordinatorRegistry();
  const profileMap = new Map(modelProfiles.map(p => [p.id, p]));

  templates
    .filter(t => t.status === 'published')
    .forEach(template => {
      const profile = template.modelProfileId ? profileMap.get(template.modelProfileId) : undefined;
      registry.register(templateToCoordinatorDefinition(template, profile?.modelId));
    });

  return registry;
}

export function reloadAgentRegistries(
  templates: AgentTemplate[],
  modelProfiles: ModelProfile[] = []
) {
  return {
    subagentRegistry: buildSubagentRegistry(templates, modelProfiles),
    coordinatorRegistry: buildCoordinatorRegistry(templates, modelProfiles),
    subagentCount: templates.filter(t => t.status === 'published').length,
    coordinatorCount: templates.filter(t => t.status === 'published').length,
    reloadedAt: new Date().toISOString()
  };
}
