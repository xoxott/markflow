/** AI 工作流页面私有模块公共 API（由 views/ai-workflow 页面显式 import，非全局组件） */

export { default as WorkflowEditorCanvas } from './editor/WorkflowEditorCanvas';
export { default as WorkflowEditorHeader } from './editor/WorkflowEditorHeader';
export { default as WorkflowEditorSidePanel } from './editor/WorkflowEditorSidePanel';
export { default as WorkflowEditorWorkspace } from './editor/WorkflowEditorWorkspace';
export { default as NodeLibraryPanel } from './panels/NodeLibraryPanel';
export { default as NodeConfigPanel } from './panels/NodeConfigPanel';

export { useWorkflowEditor } from './hooks/useWorkflowEditor';
export { useWorkflowMeta } from './hooks/useWorkflowMeta';
export { useWorkflowDialog } from './dialogs/useWorkflowDialog';

export {
  definitionToFlowState,
  flowStateToDefinition,
  workflowNodeToFlowNode,
  createFlowNodeAt
} from './adapters/flow-adapter';

export {
  WORKFLOW_NODE_REGISTRY,
  getNodeTypeConfig,
  getNodesByCategory,
  createDefaultNodeData
} from './registry/node-registry';

export { validateWorkflowGraph } from './validation/validate-workflow';
export type {
  WorkflowValidationResult,
  WorkflowValidationIssue
} from './validation/validate-workflow';

export type {
  WorkflowNodeFlowData,
  WorkflowFlowCanvasExpose,
  WorkflowEditorCanvasExpose
} from './types/workflow-node-data';
