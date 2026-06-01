/**
 * AI Workflow API Type Definitions
 *
 * 与后端 WorkflowConfig / WorkflowResponseDto 对齐
 */

declare namespace Api {
  namespace Workflow {
    /** 节点类型（P0 子集，对齐后端 NodeType） */
    type NodeType = 'start' | 'end' | 'llm' | 'http' | 'database' | 'condition' | 'transform';

    /** 工作流状态 */
    type WorkflowStatus = 'draft' | 'published' | 'archived';

    /** 执行状态 */
    type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

    /** HTTP 方法 */
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

    /** LLM 提供商 */
    type LlmProvider = 'openai' | 'anthropic' | 'custom';

    interface Position {
      x: number;
      y: number;
    }

    interface Viewport {
      x: number;
      y: number;
      zoom: number;
    }

    /** 端口定义（画布 UI 推导，不入库） */
    interface Port {
      id: string;
      type: 'input' | 'output';
      label?: string;
      dataType?: string;
      required?: boolean;
      defaultValue?: any;
    }

    /** LLM 节点配置 */
    interface LlmNodeConfig {
      provider?: LlmProvider;
      model?: string;
      prompt?: string;
      systemMessage?: string;
      temperature?: number;
      maxTokens?: number;
    }

    /** HTTP 节点配置 */
    interface HttpNodeConfig {
      url?: string;
      method?: HttpMethod;
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    }

    /** 数据库节点配置 */
    interface DatabaseNodeConfig {
      query?: string;
      parameters?: any[];
      timeout?: number;
    }

    /** 条件节点配置 */
    interface ConditionNodeConfig {
      conditions?: Array<{
        variable: string;
        operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
        value: any;
        logic?: 'AND' | 'OR';
      }>;
      defaultBranch?: string;
    }

    /** 转换节点配置 */
    interface TransformNodeConfig {
      mappings?: Array<{
        source: string;
        target: string;
        transform?: string;
      }>;
      script?: string;
    }

    type NodeConfig =
      | LlmNodeConfig
      | HttpNodeConfig
      | DatabaseNodeConfig
      | ConditionNodeConfig
      | TransformNodeConfig
      | Record<string, any>;

    /** 工作流节点（ReactFlow 风格，与后端一致） */
    interface WorkflowNode {
      id: string;
      type: NodeType | string;
      position: Position;
      data: {
        label: string;
        config?: NodeConfig;
      };
    }

    /** 工作流边 */
    interface WorkflowEdge {
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }

    /** 工作流配置 */
    interface WorkflowConfig {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      variables?: Record<string, any>;
      viewport?: Viewport;
    }

    /** 工作流 */
    interface Workflow {
      id: number;
      name: string;
      description?: string | null;
      status: WorkflowStatus;
      config: WorkflowConfig;
      triggers?: string[];
      tags?: string[] | null;
      userId?: number;
      nodeCount: number;
      edgeCount?: number;
      hasVariables?: boolean;
      currentVersion: number;
      executionCount: number;
      lastExecutedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }

    /** 执行日志（与后端 ExecutionLog 对齐） */
    interface ExecutionLog {
      nodeId: string;
      nodeName: string;
      status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
      input?: any;
      output?: any;
      error?: string;
      startedAt: string;
      finishedAt?: string;
      duration?: number;
    }

    /** 节点执行结果（前端展示用） */
    interface NodeExecutionResult {
      nodeId: string;
      nodeName?: string;
      status: ExecutionLog['status'] | ExecutionStatus;
      startTime: string;
      endTime?: string;
      duration?: number;
      input?: any;
      output?: any;
      error?: string;
    }

    /** 工作流执行 */
    interface Execution {
      id: number;
      workflowId: number;
      workflowName?: string | null;
      status: ExecutionStatus;
      startedAt: string | null;
      finishedAt?: string | null;
      duration?: number | null;
      input?: Record<string, any> | null;
      output?: any;
      error?: string | null;
    }

    /** 执行详情 */
    interface ExecutionDetail extends Execution {
      logs: ExecutionLog[];
      nodeResults: NodeExecutionResult[];
    }

    /** 工作流列表查询参数 */
    interface WorkflowListParams {
      page?: number;
      limit?: number;
      search?: string;
      status?: WorkflowStatus;
      tags?: string[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }

    /** 创建工作流请求 */
    interface CreateWorkflowRequest {
      name: string;
      description?: string;
      config?: WorkflowConfig;
      tags?: string[];
    }

    /** 更新工作流请求 */
    interface UpdateWorkflowRequest {
      name?: string;
      description?: string;
      status?: WorkflowStatus;
      config?: WorkflowConfig;
      tags?: string[];
    }

    /** 执行工作流参数 */
    interface ExecutionParams {
      input?: Record<string, any>;
      variables?: Record<string, any>;
    }

    /** 执行历史查询参数 */
    interface ExecutionHistoryParams {
      workflowId: number;
      page?: number;
      limit?: number;
      status?: ExecutionStatus;
      startDate?: string;
      endDate?: string;
    }

    /** 工作流版本（P1） */
    interface WorkflowVersion {
      version: number;
      createdAt: string;
      createdBy?: string;
      changes?: string;
      config: WorkflowConfig;
    }

    /** @deprecated 兼容旧引用，等同于 WorkflowConfig */
    type WorkflowDefinition = WorkflowConfig;
  }
}
