/** 视口工具：节点包围盒、适应视图（fitView） */

import type { FlowNode, FlowViewport } from '../types';

export interface FlowNodesBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ComputeFitViewOptions {
  /** 画布容器宽高（像素） */
  width: number;
  height: number;
  /** 边距比例 0–0.5，默认 0.2 表示四周各留 10% 可视区域 */
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
  defaultNodeWidth?: number;
  defaultNodeHeight?: number;
  /** 是否允许放大到大于 1（默认 true，小图也能居中填满） */
  maxZoomToFit?: boolean;
}

/** 计算所有节点的轴对齐包围盒（画布坐标） */
export function getNodesBounds(
  nodes: FlowNode[],
  defaultNodeWidth = 220,
  defaultNodeHeight = 72
): FlowNodesBounds | null {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const w = node.size?.width ?? defaultNodeWidth;
    const h = node.size?.height ?? defaultNodeHeight;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/**
 * 计算 fitView 视口：将所有节点居中并缩放到容器内
 *
 * 变换：`screen = canvas * zoom + translate`，使包围盒中心落在容器中心
 */
export function computeFitViewViewport(
  nodes: FlowNode[],
  options: ComputeFitViewOptions
): FlowViewport | null {
  const {
    width,
    height,
    padding = 0.2,
    minZoom = 0.1,
    maxZoom = 4,
    defaultNodeWidth = 220,
    defaultNodeHeight = 72,
    maxZoomToFit = true
  } = options;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const bounds = getNodesBounds(nodes, defaultNodeWidth, defaultNodeHeight);
  if (!bounds) {
    return null;
  }

  const pad = Math.min(Math.max(padding, 0), 0.45);
  const insetW = width * (1 - pad * 2);
  const insetH = height * (1 - pad * 2);

  let zoom = Math.min(insetW / bounds.width, insetH / bounds.height);
  if (!maxZoomToFit) {
    zoom = Math.min(zoom, 1);
  }
  zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

  return {
    x: width / 2 - bounds.centerX * zoom,
    y: height / 2 - bounds.centerY * zoom,
    zoom
  };
}
