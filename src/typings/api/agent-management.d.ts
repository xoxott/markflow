/** Agent Management API types */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace AgentManagement {
    type AgentSource = 'builtin' | 'custom' | 'plugin';
    type AgentStatus = 'draft' | 'published' | 'disabled';
    type AgentPermissionMode = 'bubble' | 'auto';
    type AgentBackground = 'foreground' | 'background';
    type AgentIsolation = 'worktree' | 'remote' | 'shared';
    type StructuredPermissionMode =
      | 'default'
      | 'plan'
      | 'acceptEdits'
      | 'bypassPermissions'
      | 'auto'
      | 'restricted';
    type MemoryScope = 'user' | 'project' | 'local';
    type ExportFormat = 'md' | 'json';
    type TeamStatus = 'idle' | 'running' | 'stopped';
    type PhaseStrategy = 'default' | 'custom';
    type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
    type SessionStatus = 'active' | 'paused' | 'completed' | 'destroyed';
    type ModelProvider = 'anthropic' | 'openai';

    interface AgentMemoryScopeConfig {
      scope: MemoryScope;
      enabled: boolean;
    }

    /** 智能体模板 */
    interface AgentTemplate {
      id: string;
      agentType: string;
      name: string;
      source: AgentSource;
      status: AgentStatus;
      description: string;
      whenToUse: string;
      systemPrompt: string;
      tools?: string[];
      disallowedTools?: string[];
      modelProfileId?: string;
      maxTurns?: number;
      permissionMode?: AgentPermissionMode;
      structuredPermissionMode?: StructuredPermissionMode;
      background?: AgentBackground;
      timeout?: number;
      maxResultSizeChars?: number;
      isolation?: AgentIsolation;
      mcpServerIds?: string[];
      skillIds?: string[];
      memoryScope?: AgentMemoryScopeConfig;
      color?: string;
      version: number;
      publishedAt?: string;
      createdAt: string;
      updatedAt: string;
    }

    /** 列表项（含统计字段） */
    interface AgentTemplateListItem extends AgentTemplate {
      toolCount: number;
      modelLabel?: string;
    }

    interface AgentListParams extends Common.PaginationParams {
      search?: string;
      source?: AgentSource;
      status?: AgentStatus;
    }

    interface CreateAgentRequest {
      agentType: string;
      name: string;
      description?: string;
      whenToUse?: string;
      systemPrompt?: string;
      tools?: string[];
      disallowedTools?: string[];
      modelProfileId?: string;
      maxTurns?: number;
      permissionMode?: AgentPermissionMode;
      structuredPermissionMode?: StructuredPermissionMode;
      background?: AgentBackground;
      timeout?: number;
      maxResultSizeChars?: number;
      isolation?: AgentIsolation;
      mcpServerIds?: string[];
      skillIds?: string[];
      memoryScope?: AgentMemoryScopeConfig;
      color?: string;
    }

    type UpdateAgentRequest = Partial<CreateAgentRequest>;

    interface CopyAgentRequest {
      name?: string;
      agentType?: string;
    }

    interface ExportAgentResponse {
      format: ExportFormat;
      content: string;
      filename: string;
    }

    interface ReloadRegistryResponse {
      subagentCount: number;
      coordinatorCount: number;
      reloadedAt: string;
    }

    type AgentListResponse = ListData<AgentTemplateListItem>;
    type AgentDetailResponse = AgentTemplate;

    interface CreateAgentResponse {
      message: string;
      agent: AgentTemplate;
    }

    interface UpdateAgentResponse {
      message: string;
      agent: AgentTemplate;
    }

    interface DeleteAgentResponse {
      message: string;
    }

    /** LLM 模型配置 */
    interface ModelProfile {
      id: string;
      name: string;
      provider: ModelProvider;
      modelId: string;
      baseURL?: string;
      maxTokens?: number;
      thinking?: boolean;
      isDefault: boolean;
      enabled: boolean;
      hasCredential: boolean;
      createdAt: string;
      updatedAt: string;
    }

    interface ModelProfileListParams extends Common.PaginationParams {
      search?: string;
      provider?: ModelProvider;
      enabled?: Common.QueryBoolean;
    }

    interface CreateModelProfileRequest {
      name: string;
      provider: ModelProvider;
      modelId: string;
      baseURL?: string;
      maxTokens?: number;
      thinking?: boolean;
      isDefault?: boolean;
      enabled?: boolean;
    }

    type UpdateModelProfileRequest = Partial<CreateModelProfileRequest>;

    interface SaveModelCredentialRequest {
      apiKey: string;
      organization?: string;
    }

    interface TestConnectionResponse {
      success: boolean;
      latencyMs: number;
      models?: string[];
      message?: string;
    }

    type ModelProfileListResponse = ListData<ModelProfile>;
    type ModelProfileDetailResponse = ModelProfile;

    /** 多智能体团队 */
    interface AgentTeam {
      id: string;
      name: string;
      coordinatorAgentType: string;
      workerTemplateIds: string[];
      phaseStrategy?: PhaseStrategy;
      status: TeamStatus;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }

    interface AgentTeamWorker {
      workerId: string;
      teamId: string;
      agentType: string;
      templateId?: string;
      name: string;
      status: 'idle' | 'running' | 'waiting' | 'completed' | 'failed' | 'shutdown';
      lastActiveAt?: string;
    }

    interface AgentTeamDetail extends AgentTeam {
      workers: AgentTeamWorker[];
    }

    interface AgentTeamListParams extends Common.PaginationParams {
      search?: string;
      status?: TeamStatus;
    }

    interface CreateAgentTeamRequest {
      name: string;
      coordinatorAgentType: string;
      workerTemplateIds: string[];
      phaseStrategy?: PhaseStrategy;
      description?: string;
    }

    type UpdateAgentTeamRequest = Partial<CreateAgentTeamRequest>;

    type AgentTeamListResponse = ListData<AgentTeam>;
    type AgentTeamDetailResponse = AgentTeamDetail;

    /** 运行监控 */
    interface AgentRun {
      runId: string;
      agentType: string;
      templateId?: string;
      parentSessionId?: string;
      teamId?: string;
      task: string;
      phase?: string;
      status: RunStatus;
      startedAt: string;
      endedAt?: string;
      durationMs?: number;
      tokensUsed?: { input: number; output: number };
      costUsd?: number;
      outputSummary?: string;
      error?: string;
    }

    interface AgentRunEvent {
      runId: string;
      seq: number;
      type: string;
      payload: Record<string, unknown>;
      timestamp: string;
    }

    interface AgentSession {
      sessionId: string;
      title?: string;
      tag?: string;
      status: SessionStatus;
      turnCount: number;
      modelProfileId?: string;
      accumulatedCostUsd?: number;
      lastActiveAt: string;
      createdAt: string;
    }

    interface AgentRunListParams extends Common.PaginationParams {
      search?: string;
      sessionId?: string;
      agentType?: string;
      status?: RunStatus;
      teamId?: string;
    }

    interface AgentSessionListParams extends Common.PaginationParams {
      search?: string;
      status?: SessionStatus;
    }

    interface UpdateSessionRequest {
      title?: string;
      tag?: string;
    }

    type AgentRunListResponse = ListData<AgentRun>;
    type AgentSessionListResponse = ListData<AgentSession>;
    type AgentRunEventsResponse = AgentRunEvent[];
  }
}
