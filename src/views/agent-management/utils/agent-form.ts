/** AgentTemplate ↔ SubagentDefinition 映射 */

type AgentTemplate = Api.AgentManagement.AgentTemplate;

export interface SubagentDefinitionLike {
  agentType: string;
  source?: 'builtin' | 'custom' | 'plugin';
  description?: string;
  whenToUse: string;
  tools?: readonly string[];
  disallowedTools?: readonly string[];
  model?: string;
  maxTurns?: number;
  permissionMode?: string;
  structuredPermissionMode?: AgentTemplate['structuredPermissionMode'];
  background?: 'foreground' | 'background';
  timeout?: number;
  maxResultSizeChars?: number;
  isolation?: AgentTemplate['isolation'];
  systemPromptPrefix?: string;
  mcpServers?: readonly string[];
  skills?: readonly string[];
}

export function templateToSubagentDefinition(
  template: AgentTemplate,
  modelId?: string
): SubagentDefinitionLike {
  return {
    agentType: template.agentType,
    source: template.source,
    description: template.description,
    whenToUse: template.whenToUse,
    tools: template.tools,
    disallowedTools: template.disallowedTools,
    model: modelId ?? (template.modelProfileId ? undefined : 'inherit'),
    maxTurns: template.maxTurns,
    permissionMode: template.permissionMode,
    structuredPermissionMode: template.structuredPermissionMode,
    background: template.background,
    timeout: template.timeout,
    maxResultSizeChars: template.maxResultSizeChars,
    isolation: template.isolation,
    systemPromptPrefix: template.systemPrompt || undefined,
    mcpServers: template.mcpServerIds,
    skills: template.skillIds
  };
}

export function templateToCoordinatorDefinition(
  template: AgentTemplate,
  modelId?: string
): Omit<SubagentDefinitionLike, 'source' | 'systemPromptPrefix' | 'mcpServers'> {
  const sub = templateToSubagentDefinition(template, modelId);
  return {
    agentType: sub.agentType,
    description: sub.description,
    whenToUse: sub.whenToUse,
    tools: sub.tools,
    disallowedTools: sub.disallowedTools,
    model: sub.model,
    maxTurns: sub.maxTurns,
    permissionMode: sub.permissionMode,
    structuredPermissionMode: sub.structuredPermissionMode,
    isolation: sub.isolation,
    skills: sub.skills
  };
}

export function createEmptyAgentForm(): Partial<AgentTemplate> {
  return {
    agentType: '',
    name: '',
    source: 'custom',
    status: 'draft',
    description: '',
    whenToUse: '',
    systemPrompt: '',
    tools: [],
    disallowedTools: [],
    maxTurns: 10,
    permissionMode: 'auto',
    background: 'foreground',
    version: 1
  };
}

export function templateToExportJson(template: AgentTemplate): string {
  const payload = {
    description: template.description,
    whenToUse: template.whenToUse,
    tools: template.tools,
    disallowedTools: template.disallowedTools,
    prompt: template.systemPrompt,
    model: template.modelProfileId ?? 'inherit',
    permissionMode: template.permissionMode,
    maxTurns: template.maxTurns,
    skills: template.skillIds,
    background: template.background,
    isolation: template.isolation,
    color: template.color
  };
  return JSON.stringify(payload, null, 2);
}

export function templateToExportMd(template: AgentTemplate): string {
  const frontmatter = [
    '---',
    `name: ${template.agentType}`,
    `description: ${template.description}`,
    `whenToUse: ${template.whenToUse}`,
    template.tools?.length ? `tools: ${template.tools.join(', ')}` : null,
    template.maxTurns !== undefined && template.maxTurns !== null
      ? `maxTurns: ${template.maxTurns}`
      : null,
    template.permissionMode ? `permissionMode: ${template.permissionMode}` : null,
    '---',
    '',
    template.systemPrompt
  ]
    .filter(Boolean)
    .join('\n');
  return frontmatter;
}

export function agentTemplateToListItem(
  template: AgentTemplate,
  modelLabel?: string
): Api.AgentManagement.AgentTemplateListItem {
  return {
    ...template,
    toolCount: template.tools?.length ?? 0,
    modelLabel
  };
}
