/**
 * AI 工作流节点在 Flow 画布中的 data 载荷
 *
 * 业务配置持久化到 Api.Workflow；此处为画布展示与编辑用的聚合视图
 */

import type { Ref } from 'vue';
import type { FlowEdge, FlowNode, FlowViewport } from '@/components/flow';
import type { WorkflowValidationResult } from '../validation/validate-workflow';

/** Flow 节点 data 字段结构 */
export interface WorkflowNodeFlowData {
  /** 业务节点类型 */
  nodeType: Api.Workflow.NodeType;
  label: string;
  description?: string;
  icon: string;
  color: string;
  category: 'control' | 'ai' | 'data' | 'integration';
  config: Api.Workflow.NodeConfig;
  inputs: Api.Workflow.Port[];
  outputs: Api.Workflow.Port[];
}

/** 工作流画布节点（带业务 data） */
export type WorkflowFlowNode = FlowNode<WorkflowNodeFlowData>;

/** FlowCanvas 实例暴露 API（编辑器使用；expose 的 Ref 在父组件侧可能被自动解包） */
export interface WorkflowFlowCanvasExpose {
  nodes: Ref<WorkflowFlowNode[]> | WorkflowFlowNode[];
  edges: Ref<FlowEdge[]> | FlowEdge[];
  viewport: Ref<FlowViewport> | FlowViewport;
  selectedNodeIds: Ref<string[]> | string[];
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;
  setViewport: (viewport: Partial<FlowViewport>) => void;
  fitView: (padding?: number) => boolean;
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: Ref<boolean> | boolean;
  canRedo: Ref<boolean> | boolean;
}

/** WorkflowEditorCanvas 组件暴露 API */
export interface WorkflowEditorCanvasExpose {
  getDefinition: () => Api.Workflow.WorkflowDefinition | null;
  validate: () => WorkflowValidationResult | null;
  save: () => Promise<void>;
  fitView: () => void;
  updateNode: (nodeId: string, updates: Partial<Api.Workflow.WorkflowNode>) => void;
}
