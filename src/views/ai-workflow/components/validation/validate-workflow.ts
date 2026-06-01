/** 工作流图校验（纯函数，与画布实现无关） */

import { getNodeDisplayLabel } from '../registry/node-registry';

export interface WorkflowValidationIssue {
  type: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  message: string;
  code?: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationIssue[];
  warnings: WorkflowValidationIssue[];
}

export function validateWorkflowGraph(
  nodes: Api.Workflow.WorkflowNode[],
  edges: Api.Workflow.WorkflowEdge[]
): WorkflowValidationResult {
  const issues = collectValidationIssues(nodes, edges);
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function collectValidationIssues(
  nodes: Api.Workflow.WorkflowNode[],
  edges: Api.Workflow.WorkflowEdge[]
): WorkflowValidationIssue[] {
  const errors: WorkflowValidationIssue[] = [];

  const startNodes = nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({ type: 'error', code: 'NO_START', message: '工作流必须包含至少一个开始节点' });
  } else if (startNodes.length > 1) {
    errors.push({ type: 'warning', code: 'MULTI_START', message: '工作流包含多个开始节点' });
  }

  const endNodes = nodes.filter(n => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push({ type: 'warning', code: 'NO_END', message: '建议包含至少一个结束节点' });
  }

  const connectedIds = new Set<string>();
  edges.forEach(e => {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  });

  nodes.forEach(node => {
    const label = getNodeDisplayLabel(node);
    if (!connectedIds.has(node.id) && node.type !== 'start' && node.type !== 'end') {
      errors.push({
        type: 'warning',
        nodeId: node.id,
        code: 'ORPHAN',
        message: `节点「${label}」未连接到其他节点`
      });
    }
    if (node.type !== 'start') {
      const hasInput = edges.some(e => e.target === node.id);
      if (!hasInput) {
        errors.push({
          type: 'warning',
          nodeId: node.id,
          code: 'NO_INPUT',
          message: `节点「${label}」缺少输入连接`
        });
      }
    }

    if (node.type === 'llm') {
      const cfg = (node.data?.config ?? {}) as Api.Workflow.LlmNodeConfig;
      if (!cfg.model) {
        errors.push({
          type: 'error',
          nodeId: node.id,
          code: 'LLM_NO_MODEL',
          message: `LLM 节点「${label}」未配置模型`
        });
      }
      if (!cfg.prompt) {
        errors.push({
          type: 'warning',
          nodeId: node.id,
          code: 'LLM_NO_PROMPT',
          message: `LLM 节点「${label}」未配置提示词`
        });
      }
    }
  });

  detectCycles(nodes, edges).forEach(cycle => {
    const label = cycle
      .map(id => {
        const node = nodes.find(n => n.id === id);
        return node ? getNodeDisplayLabel(node) : id;
      })
      .join(' → ');
    errors.push({
      type: 'error',
      code: 'CYCLE',
      message: `检测到循环依赖: ${label}`
    });
  });

  nodes
    .filter(n => n.type === 'condition')
    .forEach(node => {
      const label = getNodeDisplayLabel(node);
      const outs = edges.filter(e => e.source === node.id);
      if (!outs.some(e => e.sourceHandle === 'true')) {
        errors.push({
          type: 'warning',
          nodeId: node.id,
          code: 'COND_TRUE',
          message: `条件节点「${label}」缺少 true 分支`
        });
      }
      if (!outs.some(e => e.sourceHandle === 'false')) {
        errors.push({
          type: 'warning',
          nodeId: node.id,
          code: 'COND_FALSE',
          message: `条件节点「${label}」缺少 false 分支`
        });
      }
    });

  return errors;
}

function detectCycles(
  nodes: Api.Workflow.WorkflowNode[],
  edges: Api.Workflow.WorkflowEdge[]
): string[][] {
  const cycles: string[][] = [];
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    adj.get(e.source)?.push(e.target);
  });

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(id: string): boolean {
    visited.add(id);
    stack.add(id);
    path.push(id);

    for (const next of adj.get(id) ?? []) {
      if (!visited.has(next)) {
        if (dfs(next)) return true;
      } else if (stack.has(next)) {
        const start = path.indexOf(next);
        cycles.push([...path.slice(start), next]);
        return true;
      }
    }

    stack.delete(id);
    path.pop();
    return false;
  }

  nodes.forEach(n => {
    if (!visited.has(n.id)) dfs(n.id);
  });

  return cycles;
}
