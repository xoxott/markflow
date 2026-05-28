import type { FlowNode, MinimapSize, MinimapTheme } from '@/components/flow';
import { getNodeTypeConfig } from '../registry/node-registry';
import type { WorkflowNodeFlowData } from '../types/workflow-node-data';

const FALLBACK_NODE_COLOR = '#94a3b8';

/** 小地图节点按业务类型着色，与画布卡片左侧色条一致 */
export function resolveWorkflowMinimapNodeColor(node: FlowNode): string {
  const data = node.data as WorkflowNodeFlowData | undefined;
  if (data?.color) return data.color;
  if (data?.nodeType) return getNodeTypeConfig(data.nodeType).color;
  return FALLBACK_NODE_COLOR;
}

/** 视口框用中性色，避免与各色节点混在一起 */
export const WORKFLOW_MINIMAP_THEME: Partial<MinimapTheme> = {
  nodeOpacity: 0.92,
  viewportStroke: '#64748b',
  viewportFill: 'rgba(100, 116, 139, 0.12)'
};

export const WORKFLOW_MINIMAP_SIZE: MinimapSize = { width: 216, height: 152 };
