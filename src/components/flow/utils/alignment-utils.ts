/** 节点对齐吸附（左/右/中 X，上/下/中 Y） */

import type { FlowNode, FlowPosition } from '../types';

export interface NodeBounds {
  left: number;
  right: number;
  centerX: number;
  top: number;
  bottom: number;
  centerY: number;
}

export interface AlignmentGuideLines {
  vertical: number[];
  horizontal: number[];
}

export interface AlignmentSnapResult {
  position: FlowPosition;
  guides: AlignmentGuideLines;
}

export interface NodeSizeDefaults {
  width: number;
  height: number;
}

const X_EDGES = ['left', 'right', 'centerX'] as const;
const Y_EDGES = ['top', 'bottom', 'centerY'] as const;

type XEdge = (typeof X_EDGES)[number];
type YEdge = (typeof Y_EDGES)[number];

/** 根据节点位置与尺寸计算包围盒对齐线 */
export function getNodeBounds(
  node: FlowNode,
  defaults: NodeSizeDefaults = { width: 220, height: 72 }
): NodeBounds {
  const w = node.size?.width ?? defaults.width;
  const h = node.size?.height ?? defaults.height;
  const x = node.position.x;
  const y = node.position.y;
  return {
    left: x,
    right: x + w,
    centerX: x + w / 2,
    top: y,
    bottom: y + h,
    centerY: y + h / 2
  };
}

function boundsAtPosition(
  node: FlowNode,
  position: FlowPosition,
  defaults: NodeSizeDefaults
): NodeBounds {
  return getNodeBounds({ ...node, position }, defaults);
}

function getX(bounds: NodeBounds, edge: XEdge): number {
  return bounds[edge];
}

function getY(bounds: NodeBounds, edge: YEdge): number {
  return bounds[edge];
}

/**
 * 将拖拽节点吸附到其他节点的对齐线
 *
 * 检测 moving 与 other 的 left/right/centerX、top/bottom/centerY 是否在阈值内重合
 */
export function snapPositionToAlignment(
  position: FlowPosition,
  movingNode: FlowNode,
  otherNodes: FlowNode[],
  threshold: number,
  defaults: NodeSizeDefaults = { width: 220, height: 72 }
): AlignmentSnapResult {
  if (otherNodes.length === 0 || threshold <= 0) {
    return { position: { ...position }, guides: { vertical: [], horizontal: [] } };
  }

  const moving = boundsAtPosition(movingNode, position, defaults);
  let bestXDelta: number | null = null;
  let bestYDelta: number | null = null;
  const verticalGuides = new Set<number>();
  const horizontalGuides = new Set<number>();

  for (const other of otherNodes) {
    const otherBounds = getNodeBounds(other, defaults);

    for (const movingEdge of X_EDGES) {
      const movingVal = getX(moving, movingEdge);
      for (const otherEdge of X_EDGES) {
        const otherVal = getX(otherBounds, otherEdge);
        const delta = otherVal - movingVal;
        if (Math.abs(delta) > threshold) continue;
        if (bestXDelta === null || Math.abs(delta) < Math.abs(bestXDelta)) {
          bestXDelta = delta;
          verticalGuides.clear();
          verticalGuides.add(otherVal);
        } else if (Math.abs(delta - bestXDelta) < 0.001) {
          verticalGuides.add(otherVal);
        }
      }
    }

    for (const movingEdge of Y_EDGES) {
      const movingVal = getY(moving, movingEdge);
      for (const otherEdge of Y_EDGES) {
        const otherVal = getY(otherBounds, otherEdge);
        const delta = otherVal - movingVal;
        if (Math.abs(delta) > threshold) continue;
        if (bestYDelta === null || Math.abs(delta) < Math.abs(bestYDelta)) {
          bestYDelta = delta;
          horizontalGuides.clear();
          horizontalGuides.add(otherVal);
        } else if (Math.abs(delta - bestYDelta) < 0.001) {
          horizontalGuides.add(otherVal);
        }
      }
    }
  }

  return {
    position: {
      x: position.x + (bestXDelta ?? 0),
      y: position.y + (bestYDelta ?? 0)
    },
    guides: {
      vertical: [...verticalGuides],
      horizontal: [...horizontalGuides]
    }
  };
}
