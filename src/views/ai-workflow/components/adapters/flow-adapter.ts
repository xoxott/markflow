/**
 * Api.Workflow 与 Flow 画布数据互转
 *
 * 持久化模型采用后端 ReactFlow 风格：config.nodes / config.edges / config.viewport
 */

import type { FlowEdge, FlowHandle, FlowNode, FlowViewport } from '@/components/flow';
import { createDefaultNodeData, getNodeTypeConfig } from '../registry/node-registry';
import { WORKFLOW_NODE_SIZE } from '../constants/workflow-layout';
import type { WorkflowNodeFlowData } from '../types/workflow-node-data';

function getNodeLabel(node: Api.Workflow.WorkflowNode): string {
  return node.data?.label ?? '未命名节点';
}

function getNodeConfig(node: Api.Workflow.WorkflowNode): Api.Workflow.NodeConfig {
  return node.data?.config ?? {};
}

/** 将业务端口映射为 Flow 句柄 */
export function portsToHandles(
  inputs: Api.Workflow.Port[] = [],
  outputs: Api.Workflow.Port[] = []
): FlowHandle[] {
  const handles: FlowHandle[] = [];

  inputs.forEach((port, index) => {
    const total = inputs.length;
    const position =
      total <= 1 ? 'left' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'left';
    handles.push({
      id: port.id,
      type: 'target',
      position
    });
  });

  outputs.forEach((port, index) => {
    const total = outputs.length;
    let position: FlowHandle['position'] = 'right';
    if (total === 2) {
      position = index === 0 ? 'top' : 'bottom';
    } else if (total > 2) {
      position = index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'right';
    }
    handles.push({
      id: port.id,
      type: 'source',
      position
    });
  });

  return handles;
}

/** 业务节点 → Flow 节点 */
export function workflowNodeToFlowNode(
  node: Api.Workflow.WorkflowNode
): FlowNode<WorkflowNodeFlowData> {
  const nodeType = node.type as Api.Workflow.NodeType;
  const meta = getNodeTypeConfig(nodeType);
  const inputs = meta.defaultPorts?.inputs ?? [];
  const outputs = meta.defaultPorts?.outputs ?? [];

  return {
    id: node.id,
    type: nodeType,
    position: { ...node.position },
    size: { ...WORKFLOW_NODE_SIZE },
    class: `workflow-flow-node workflow-flow-node--${nodeType}`,
    data: {
      nodeType,
      label: getNodeLabel(node),
      icon: meta.icon,
      color: meta.color,
      category: meta.category,
      config: getNodeConfig(node),
      inputs,
      outputs
    },
    handles: portsToHandles(inputs, outputs),
    connectable: nodeType !== 'start' && nodeType !== 'end',
    deletable: nodeType !== 'start'
  };
}

/** Flow 节点 → 业务节点 */
export function flowNodeToWorkflowNode(
  node: FlowNode<WorkflowNodeFlowData>
): Api.Workflow.WorkflowNode {
  const data = node.data;
  return {
    id: node.id,
    type: data.nodeType,
    position: { ...node.position },
    data: {
      label: data.label,
      config: data.config ?? {}
    }
  };
}

/** 业务边 → Flow 边 */
export function workflowEdgeToFlowEdge(edge: Api.Workflow.WorkflowEdge): FlowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: 'bezier'
  };
}

/** Flow 边 → 业务边 */
export function flowEdgeToWorkflowEdge(edge: FlowEdge): Api.Workflow.WorkflowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? 'output',
    targetHandle: edge.targetHandle ?? 'input'
  };
}

/** 工作流 config → Flow 初始状态 */
export function configToFlowState(config: Api.Workflow.WorkflowConfig): {
  nodes: FlowNode<WorkflowNodeFlowData>[];
  edges: FlowEdge[];
  viewport: FlowViewport;
} {
  return {
    nodes: (config.nodes ?? []).map(workflowNodeToFlowNode),
    edges: (config.edges ?? []).map(workflowEdgeToFlowEdge),
    viewport: config.viewport ?? { x: 0, y: 0, zoom: 1 }
  };
}

/** @deprecated 使用 configToFlowState */
export const definitionToFlowState = configToFlowState;

/** Flow 当前状态 → 工作流 config */
export function flowStateToConfig(
  nodes: FlowNode<WorkflowNodeFlowData>[],
  edges: FlowEdge[],
  viewport: FlowViewport
): Api.Workflow.WorkflowConfig {
  return {
    nodes: nodes.map(flowNodeToWorkflowNode),
    edges: edges.map(flowEdgeToWorkflowEdge),
    viewport: { ...viewport }
  };
}

/** @deprecated 使用 flowStateToConfig */
export const flowStateToDefinition = flowStateToConfig;

/** 在画布坐标创建新节点 */
export function createFlowNodeAt(
  type: Api.Workflow.NodeType,
  position: { x: number; y: number },
  id?: string
): FlowNode<WorkflowNodeFlowData> {
  const defaults = createDefaultNodeData(type);
  const nodeId = id ?? `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const apiNode: Api.Workflow.WorkflowNode = {
    id: nodeId,
    type,
    position,
    data: {
      label: defaults.data?.label ?? getNodeTypeConfig(type).label,
      config: defaults.data?.config ?? {}
    }
  };
  return workflowNodeToFlowNode(apiNode);
}
