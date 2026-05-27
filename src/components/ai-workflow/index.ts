/** AI 工作流模块公共 API */

export { default as WorkflowEditorCanvas } from './editor/WorkflowEditorCanvas';
export { default as WorkflowEditorToolbar } from './editor/WorkflowEditorToolbar';
export { default as NodeLibraryPanel } from './panels/NodeLibraryPanel';
export { default as NodeConfigPanel } from './panels/NodeConfigPanel';

export { useWorkflowEditor } from './hooks/useWorkflowEditor';
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

export type { WorkflowNodeFlowData, WorkflowFlowCanvasExpose } from './types/workflow-node-data';
