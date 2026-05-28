import type { FlowConfig } from '@/components/flow';
import { WORKFLOW_NODE_SIZE } from '../constants/workflow-layout';
import { WORKFLOW_NODE_REGISTRY } from '../registry/node-registry';
import WorkflowFlowNode from './WorkflowFlowNode';

const workflowNodeTypes = Object.fromEntries(
  (Object.keys(WORKFLOW_NODE_REGISTRY) as Api.Workflow.NodeType[]).map(type => [
    type,
    {
      name: type,
      component: WorkflowFlowNode
    }
  ])
);

export const WORKFLOW_FLOW_CONFIG: Partial<FlowConfig> = {
  canvas: {
    showGrid: true,
    gridType: 'dots',
    gridSize: 20,
    panOnDrag: true,
    zoomOnScroll: true,
    fitViewPadding: 0.2
  },
  nodes: {
    defaultWidth: WORKFLOW_NODE_SIZE.width,
    defaultHeight: WORKFLOW_NODE_SIZE.height,
    minWidth: WORKFLOW_NODE_SIZE.width,
    minHeight: WORKFLOW_NODE_SIZE.height,
    borderRadius: 8,
    elevateOnDragEnd: true,
    nodeTypes: workflowNodeTypes
  },
  edges: {
    defaultType: 'bezier',
    animated: false,
    renderBehindNodes: true
  },
  interaction: {
    enableMultiSelection: true,
    multiSelectKey: 'ctrl',
    enableBoxSelection: true,
    boxSelectionKey: 'shift',
    enableContextMenu: false
  },
  performance: {
    enableViewportCulling: true,
    maxHistorySize: 80
  }
};
