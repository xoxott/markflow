/** FlowCanvas 组件 emit 事件映射 */

import type { FlowGuideLine } from './flow-guide';
import type { FlowEdge, FlowNode, FlowViewport } from './index';

export interface FlowCanvasEmitMap {
  'node-click': [node: FlowNode, event: MouseEvent];
  'node-double-click': [node: FlowNode, event: MouseEvent];
  'edge-click': [edge: FlowEdge, event: MouseEvent];
  'edge-double-click': [edge: FlowEdge, event: MouseEvent];
  'connect': [edge: FlowEdge];
  'edge-update': [edge: FlowEdge];
  'connect-reject': [
    info: {
      sourceNodeId: string;
      sourceHandleId: string;
      targetNodeId: string;
      targetHandleId?: string;
      reason: 'invalid-connection' | 'duplicate' | 'self-loop';
    }
  ];
  'viewport-change': [viewport: FlowViewport];
  'guides-change': [guides: FlowGuideLine[]];
  // Phase 3：受控/双绑 update:*
  'update:nodes': [nodes: FlowNode[]];
  'update:edges': [edges: FlowEdge[]];
  'update:viewport': [viewport: FlowViewport];
  'update:selection': [selection: { nodeIds: string[]; edgeIds: string[] }];
  'update:guides': [guides: FlowGuideLine[]];
  'nodes-change': [nodes: FlowNode[]];
  'edges-change': [edges: FlowEdge[]];
  'selection-change': [selection: { nodeIds: string[]; edgeIds: string[] }];
}

/** 与 defineComponent setup 中的 emit 兼容 */
export type FlowCanvasEmit = <K extends keyof FlowCanvasEmitMap>(
  event: K,
  ...args: FlowCanvasEmitMap[K]
) => void;
