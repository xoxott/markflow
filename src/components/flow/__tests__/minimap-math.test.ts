import { describe, expect, it } from 'vitest';
import {
  computeMinimapBounds,
  computeMinimapScale,
  computeMinimapViewportRect,
  viewportCenterFromMinimapPoint,
  worldToMinimap
} from '../minimap/minimap-math';
import { DEFAULT_MINIMAP_LAYOUT } from '../minimap/types';
import type { FlowNode } from '../types';

const sampleNodes: FlowNode[] = [
  {
    id: 'a',
    type: 'default',
    position: { x: 100, y: 50 },
    size: { width: 150, height: 60 },
    data: {}
  },
  {
    id: 'b',
    type: 'default',
    position: { x: 300, y: 200 },
    size: { width: 150, height: 60 },
    data: {}
  }
];

describe('minimap-math', () => {
  it('computeMinimapBounds includes padding', () => {
    const b = computeMinimapBounds(sampleNodes, DEFAULT_MINIMAP_LAYOUT);
    expect(b.minX).toBe(100 - DEFAULT_MINIMAP_LAYOUT.padding);
    expect(b.maxX).toBe(300 + 150 + DEFAULT_MINIMAP_LAYOUT.padding);
  });

  it('worldToMinimap round-trips via bounds and scale', () => {
    const bounds = computeMinimapBounds(sampleNodes, DEFAULT_MINIMAP_LAYOUT);
    const size = { width: 200, height: 150 };
    const scale = computeMinimapScale(bounds, size, 1);
    const p = worldToMinimap(200, 100, bounds, scale);
    const worldX = bounds.minX + p.x / scale;
    const worldY = bounds.minY + p.y / scale;
    expect(worldX).toBeCloseTo(200, 5);
    expect(worldY).toBeCloseTo(100, 5);
  });

  it('viewport rect shrinks when zoomed in', () => {
    const bounds = computeMinimapBounds(sampleNodes, DEFAULT_MINIMAP_LAYOUT);
    const scale = computeMinimapScale(bounds, { width: 200, height: 150 }, 1);
    const canvas = { width: 800, height: 600 };
    const r1 = computeMinimapViewportRect({ x: 0, y: 0, zoom: 1 }, canvas, bounds, scale);
    const r4 = computeMinimapViewportRect({ x: 0, y: 0, zoom: 4 }, canvas, bounds, scale);
    expect(r4.width).toBeLessThan(r1.width);
  });

  it('viewportCenterFromMinimapPoint centers world point', () => {
    const bounds = computeMinimapBounds(sampleNodes, DEFAULT_MINIMAP_LAYOUT);
    const scale = computeMinimapScale(bounds, { width: 200, height: 150 }, 1);
    const canvas = { width: 800, height: 600 };
    const p = worldToMinimap(200, 100, bounds, scale);
    const vp = viewportCenterFromMinimapPoint(p.x, p.y, bounds, scale, canvas, 1);
    expect(-vp.x / 1 + canvas.width / 2).toBeCloseTo(200, 0);
    expect(-vp.y / 1 + canvas.height / 2).toBeCloseTo(100, 0);
  });
});
