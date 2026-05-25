/** Canvas 边绘制共用逻辑（EdgeCanvasRenderer 与 CanvasRenderer 类共用） */

import type { FlowEdge, FlowViewport } from '../types';
import type { EdgePositions } from '../hooks/useEdgePositions';
import { ARROW_SIZES, CANVAS_CONSTANTS, STROKE_WIDTHS } from '../constants/edge-constants';
import { calculateArrowSize, calculateStrokeWidth } from './edge-style-utils';
import { resolveEdgeColors } from './edge-theme-utils';

export interface DrawEdgesOnCanvasOptions {
  edges: FlowEdge[];
  getEdgePositions: (edge: FlowEdge) => EdgePositions | null;
  viewport: FlowViewport;
  selectedEdgeIds: Set<string> | string[];
  clearWidth: number;
  clearHeight: number;
  /** 主题根元素（通常为 .flow-canvas） */
  themeRoot?: HTMLElement | null;
}

function isEdgeSelected(edgeId: string, selected: Set<string> | string[]): boolean {
  if (selected instanceof Set) {
    return selected.has(edgeId);
  }
  return selected.includes(edgeId);
}

/** 在 2D 上下文中绘制连接线（屏幕坐标，直线） */
export function drawEdgesOnCanvas(
  ctx: CanvasRenderingContext2D,
  options: DrawEdgesOnCanvasOptions
): void {
  const { edges, getEdgePositions, viewport, selectedEdgeIds, clearWidth, clearHeight, themeRoot } =
    options;

  ctx.clearRect(0, 0, clearWidth, clearHeight);
  const colors = resolveEdgeColors(themeRoot);

  edges.forEach(edge => {
    const positions = getEdgePositions(edge);
    if (!positions) {
      return;
    }

    const isSelected = isEdgeSelected(edge.id, selectedEdgeIds);
    ctx.strokeStyle = isSelected ? colors.selected : colors.default;
    const zoom = viewport.zoom;
    const baseLineWidth = STROKE_WIDTHS.BASE;
    ctx.lineWidth = calculateStrokeWidth(baseLineWidth, zoom);
    ctx.lineCap = CANVAS_CONSTANTS.LINE_CAP;
    ctx.lineJoin = CANVAS_CONSTANTS.LINE_JOIN;

    const startX = positions.sourceHandleX ?? positions.sourceX;
    const startY = positions.sourceHandleY ?? positions.sourceY;
    let endX = positions.targetHandleX ?? positions.targetX;
    let endY = positions.targetHandleY ?? positions.targetY;

    const showArrow = edge.showArrow !== false;
    if (showArrow) {
      const currentArrowSize = calculateArrowSize(zoom);
      const arrowLength = (currentArrowSize / ARROW_SIZES.BASE) * ARROW_SIZES.LENGTH_RATIO;

      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        endX -= (dx / length) * arrowLength;
        endY -= (dy / length) * arrowLength;
      }
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  });
}

/**
 * 按布局尺寸设置 canvas 像素缓冲（含 DPR）
 *
 * @returns 布局宽高（CSS 像素），用于 clearRect
 */
export function ensureCanvasLayoutSize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { width: number; height: number } {
  const container = canvas.parentElement;
  const width = container ? container.clientWidth : window.innerWidth;
  const height = container ? container.clientHeight : window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  const needResize =
    canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr);

  if (needResize) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return { width, height };
}
