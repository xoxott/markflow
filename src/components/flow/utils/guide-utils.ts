/**
 * 辅助线工具（吸附、坐标换算）
 */

import type { FlowGuideLine } from '../types/flow-guide';
import type { FlowPosition, FlowViewport } from '../types';
import { snapPositionToGrid, screenToFlow } from './ruler-utils';

export function createGuideId(): string {
  return `guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 鼠标位置 → 画布坐标（相对 canvas 容器） */
export function getFlowPointFromClient(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  viewport: FlowViewport
): FlowPosition {
  const screenX = clientX - canvasRect.left;
  const screenY = clientY - canvasRect.top;
  return {
    x: screenToFlow(screenX, viewport.x, viewport.zoom),
    y: screenToFlow(screenY, viewport.y, viewport.zoom)
  };
}

/** 辅助线位置 → 画布坐标值 */
export function getGuideFlowPosition(axis: FlowGuideLine['axis'], point: FlowPosition): number {
  return axis === 'horizontal' ? point.y : point.x;
}

/** 吸附到用户辅助线 */
export function snapPositionToGuides(
  position: FlowPosition,
  guides: FlowGuideLine[],
  threshold: number
): FlowPosition {
  if (guides.length === 0 || threshold <= 0) {
    return position;
  }

  let { x, y } = position;
  for (const guide of guides) {
    if (guide.axis === 'vertical' && Math.abs(x - guide.position) <= threshold) {
      x = guide.position;
    }
    if (guide.axis === 'horizontal' && Math.abs(y - guide.position) <= threshold) {
      y = guide.position;
    }
  }
  return { x, y };
}

export interface ApplyFlowSnapOptions {
  snapToGuides?: boolean;
  snapToGrid?: boolean;
  guides?: FlowGuideLine[];
  guideSnapThreshold?: number;
  gridSize?: number;
  /** 移动已有辅助线时排除自身 */
  excludeGuideId?: string;
}

/** 合并辅助线与网格吸附 */
export function applyFlowSnap(position: FlowPosition, options: ApplyFlowSnapOptions): FlowPosition {
  const guides = options.excludeGuideId
    ? (options.guides ?? []).filter(guide => guide.id !== options.excludeGuideId)
    : (options.guides ?? []);

  let result = { ...position };

  if (options.snapToGuides !== false && guides.length > 0) {
    result = snapPositionToGuides(result, guides, options.guideSnapThreshold ?? 8);
  }

  if (options.snapToGrid) {
    result = snapPositionToGrid(result, options.gridSize ?? 20);
  }

  return result;
}

/** 创建辅助线时是否已拖入画布区域（离开刻度尺） */
export function isGuidePlacementValid(
  axis: FlowGuideLine['axis'],
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  rulerSize: number
): boolean {
  const screenX = clientX - canvasRect.left;
  const screenY = clientY - canvasRect.top;
  if (axis === 'horizontal') {
    return screenY >= rulerSize;
  }
  return screenX >= rulerSize;
}

/** 拖回刻度尺区域时删除辅助线 */
export function shouldRemoveGuideOnRelease(
  axis: FlowGuideLine['axis'],
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  rulerSize: number
): boolean {
  const screenX = clientX - canvasRect.left;
  const screenY = clientY - canvasRect.top;
  if (axis === 'horizontal') {
    return screenY <= rulerSize;
  }
  return screenX <= rulerSize;
}
