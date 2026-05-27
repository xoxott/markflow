/**
 * Api.Workflow 与 Flow 画布数据互转
 *
 * 单一职责：定义持久化模型 ↔ 运行时 FlowNode/FlowEdge 的映射规则
 */

import type { FlowEdge, FlowHandle, FlowNode, FlowViewport } from '@/components/flow';
import { createDefaultNodeData, getNodeTypeConfig } from '../registry/node-registry';
import { WORKFLOW_NODE_SIZE } from '../constants/workflow-layout';
import type { WorkflowNodeFlowData } from '../types/workflow-node-data';

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
  const meta = getNodeTypeConfig(node.type);
  const inputs = node.inputs ?? meta.defaultPorts?.inputs ?? [];
  const outputs = node.outputs ?? meta.defaultPorts?.outputs ?? [];

  return {
    id: node.id,
    type: node.type,
    position: { ...node.position },
    size: { ...WORKFLOW_NODE_SIZE },
    class: `workflow-flow-node workflow-flow-node--${node.type}`,
    data: {
      nodeType: node.type,
      label: node.name,
      description: node.description,
      icon: meta.icon,
      color: meta.color,
      category: meta.category,
      config: node.config ?? {},
      inputs,
      outputs
    },
    handles: portsToHandles(inputs, outputs),
    connectable: node.type !== 'start' && node.type !== 'end',
    deletable: node.type !== 'start'
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
    name: data.label,
    description: data.description,
    position: { ...node.position },
    config: data.config ?? {},
    inputs: data.inputs,
    outputs: data.outputs
  };
}

/** 业务连接 → Flow 边 */
export function workflowConnectionToFlowEdge(conn: Api.Workflow.Connection): FlowEdge {
  return {
    id: conn.id,
    source: conn.sourceNodeId,
    target: conn.targetNodeId,
    sourceHandle: conn.sourcePortId,
    targetHandle: conn.targetPortId,
    type: 'bezier'
  };
}

/** Flow 边 → 业务连接 */
export function flowEdgeToWorkflowConnection(edge: FlowEdge): Api.Workflow.Connection {
  return {
    id: edge.id,
    sourceNodeId: edge.source,
    sourcePortId: edge.sourceHandle ?? 'output',
    targetNodeId: edge.target,
    targetPortId: edge.targetHandle ?? 'input'
  };
}

/** 工作流定义 → Flow 初始状态 */
export function definitionToFlowState(definition: Api.Workflow.WorkflowDefinition): {
  nodes: FlowNode<WorkflowNodeFlowData>[];
  edges: FlowEdge[];
  viewport: FlowViewport;
} {
  return {
    nodes: (definition.nodes ?? []).map(workflowNodeToFlowNode),
    edges: (definition.connections ?? []).map(workflowConnectionToFlowEdge),
    viewport: definition.viewport ?? { x: 0, y: 0, zoom: 1 }
  };
}

/** Flow 当前状态 → 工作流定义 */
export function flowStateToDefinition(
  nodes: FlowNode<WorkflowNodeFlowData>[],
  edges: FlowEdge[],
  viewport: FlowViewport
): Api.Workflow.WorkflowDefinition {
  return {
    nodes: nodes.map(flowNodeToWorkflowNode),
    connections: edges.map(flowEdgeToWorkflowConnection),
    viewport: { ...viewport }
  };
}

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
    name: defaults.name ?? getNodeTypeConfig(type).label,
    description: defaults.description,
    position,
    config: defaults.config ?? {},
    inputs: defaults.inputs,
    outputs: defaults.outputs
  };
  return workflowNodeToFlowNode(apiNode);
}
