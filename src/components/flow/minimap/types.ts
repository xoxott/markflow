/** Flow 小地图类型与默认配置 */

import type { FlowNode } from '../types';

export type MinimapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface MinimapSize {
  width: number;
  height: number;
}

export interface MinimapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface MinimapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 节点在小地图上的布局（像素） */
export interface MinimapNodeLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface MinimapTheme {
  surfaceBackground: string;
  surfaceBorder: string;
  nodeFill: string;
  nodeOpacity: number;
  viewportFill: string;
  viewportStroke: string;
}

export interface MinimapLayoutOptions {
  padding: number;
  maxScale: number;
  defaultNodeWidth: number;
  defaultNodeHeight: number;
  minNodeSize: number;
  emptyBounds: MinimapBounds;
}

export const DEFAULT_MINIMAP_SIZE: MinimapSize = { width: 200, height: 150 };

export const DEFAULT_MINIMAP_LAYOUT: MinimapLayoutOptions = {
  padding: 100,
  maxScale: 0.2,
  defaultNodeWidth: 150,
  defaultNodeHeight: 60,
  minNodeSize: 2,
  emptyBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 800 }
};

export const DEFAULT_MINIMAP_THEME: MinimapTheme = {
  surfaceBackground: 'rgba(255, 255, 255, 0.95)',
  surfaceBorder: '#e5e7eb',
  nodeFill: '#2080f0',
  nodeOpacity: 0.7,
  viewportFill: 'rgba(32, 128, 240, 0.1)',
  viewportStroke: '#2080f0'
};

export const MINIMAP_POSITION_OFFSET = '10px';

export type ResolveMinimapNodeColor = (node: FlowNode) => string;
