/** 小地图坐标与视口框（纯函数，可单测） */

import type { FlowViewport } from '../types';
import type { FlowNode } from '../types/flow-node';
import type { MinimapBounds, MinimapLayoutOptions, MinimapRect, MinimapSize } from './types';

export function getNodeDimensions(
  node: FlowNode,
  layout: Pick<MinimapLayoutOptions, 'defaultNodeWidth' | 'defaultNodeHeight'>
): { width: number; height: number } {
  return {
    width: node.size?.width ?? layout.defaultNodeWidth,
    height: node.size?.height ?? layout.defaultNodeHeight
  };
}

export function computeMinimapBounds(
  nodes: FlowNode[],
  layout: MinimapLayoutOptions
): MinimapBounds {
  if (nodes.length === 0) {
    return layout.emptyBounds;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { width, height } = getNodeDimensions(node, layout);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  return {
    minX: minX - layout.padding,
    minY: minY - layout.padding,
    maxX: maxX + layout.padding,
    maxY: maxY + layout.padding
  };
}

export function computeMinimapScale(
  bounds: MinimapBounds,
  minimapSize: MinimapSize,
  maxScale: number
): number {
  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;
  if (boundsWidth <= 0 || boundsHeight <= 0) {
    return maxScale;
  }
  const scaleX = minimapSize.width / boundsWidth;
  const scaleY = minimapSize.height / boundsHeight;
  return Math.min(scaleX, scaleY, maxScale);
}

export function worldToMinimap(
  worldX: number,
  worldY: number,
  bounds: MinimapBounds,
  scale: number
): { x: number; y: number } {
  return {
    x: (worldX - bounds.minX) * scale,
    y: (worldY - bounds.minY) * scale
  };
}

/** 主视口在小地图上的矩形（与 ai-workflow Minimap viewportRect 一致） */
export function computeMinimapViewportRect(
  viewport: FlowViewport,
  canvasSize: MinimapSize,
  bounds: MinimapBounds,
  scale: number
): MinimapRect {
  const zoom = viewport.zoom || 1;
  const viewportWidth = canvasSize.width / zoom;
  const viewportHeight = canvasSize.height / zoom;
  const viewportX = -viewport.x / zoom;
  const viewportY = -viewport.y / zoom;

  const topLeft = worldToMinimap(viewportX, viewportY, bounds, scale);
  const bottomRight = worldToMinimap(
    viewportX + viewportWidth,
    viewportY + viewportHeight,
    bounds,
    scale
  );

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
  };
}

/** 小地图点击/拖拽位置 → 使该世界坐标位于主视口中心的 viewport.x/y */
export function viewportCenterFromMinimapPoint(
  minimapX: number,
  minimapY: number,
  bounds: MinimapBounds,
  scale: number,
  canvasSize: MinimapSize,
  zoom: number
): { x: number; y: number } {
  const canvasX = bounds.minX + minimapX / scale;
  const canvasY = bounds.minY + minimapY / scale;
  return {
    x: -canvasX * zoom + canvasSize.width / 2,
    y: -canvasY * zoom + canvasSize.height / 2
  };
}

export function clampToMinimap(
  x: number,
  y: number,
  minimapSize: MinimapSize
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(minimapSize.width, x)),
    y: Math.max(0, Math.min(minimapSize.height, y))
  };
}
