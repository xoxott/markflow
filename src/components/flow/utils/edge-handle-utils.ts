/** 连接线端口解析：未指定 sourceHandle / targetHandle 时按节点相对方向自动匹配 */

import type { FlowEdge, FlowNode } from '../types';
import type { FlowHandle } from '../types/flow-node';
import { getNodeCenter } from './layout-utils';

export interface ResolvedEdgeHandles {
  sourceHandle?: string;
  targetHandle?: string;
}

type HandleSide = FlowHandle['position'];

/** 根据指向目标的方向，选择节点上最合适的一侧 */
export function pickHandleSide(dx: number, dy: number): HandleSide {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

/**
 * 在节点上选取与方向匹配的端口
 *
 * @param node 节点
 * @param handleType 端口类型 source | target
 * @param dx 指向对端节点的水平偏移（画布坐标）
 * @param dy 指向对端节点的垂直偏移
 */
export function pickHandleIdByDirection(
  node: FlowNode,
  handleType: 'source' | 'target',
  dx: number,
  dy: number
): string | undefined {
  const handles = node.handles?.filter(h => h.type === handleType) ?? [];
  if (handles.length === 0) {
    return undefined;
  }

  const side = pickHandleSide(dx, dy);
  const onSide = handles.find(h => h.position === side);
  return (onSide ?? handles[0]).id;
}

/** 解析边的起止端口 ID（显式配置优先，否则按几何关系自动匹配） */
export function resolveEdgeHandles(
  edge: FlowEdge,
  sourceNode: FlowNode,
  targetNode: FlowNode
): ResolvedEdgeHandles {
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  return {
    sourceHandle: edge.sourceHandle ?? pickHandleIdByDirection(sourceNode, 'source', dx, dy),
    targetHandle: edge.targetHandle ?? pickHandleIdByDirection(targetNode, 'target', -dx, -dy)
  };
}
