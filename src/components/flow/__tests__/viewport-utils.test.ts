import { describe, expect, it } from 'vitest';
import type { FlowNode } from '../types';
import { computeFitViewViewport, getNodesBounds } from '../utils/viewport-utils';

const sampleNodes: FlowNode[] = [
  {
    id: 'a',
    type: 'default',
    position: { x: 200, y: 100 },
    size: { width: 150, height: 60 },
    data: {}
  },
  {
    id: 'b',
    type: 'default',
    position: { x: 400, y: 100 },
    size: { width: 150, height: 60 },
    data: {}
  },
  {
    id: 'c',
    type: 'default',
    position: { x: 300, y: 250 },
    size: { width: 150, height: 60 },
    data: {}
  }
];

describe('getNodesBounds', () => {
  it('returns bounding box of all nodes', () => {
    const b = getNodesBounds(sampleNodes, 150, 60);
    expect(b).not.toBeNull();
    expect(b!.minX).toBe(200);
    expect(b!.minY).toBe(100);
    expect(b!.maxX).toBe(550);
    expect(b!.maxY).toBe(310);
    expect(b!.centerX).toBe(375);
    expect(b!.centerY).toBe(205);
  });
});

describe('computeFitViewViewport', () => {
  it('centers node bounds in container', () => {
    const w = 800;
    const h = 500;
    const vp = computeFitViewViewport(sampleNodes, {
      width: w,
      height: h,
      padding: 0.2,
      defaultNodeWidth: 150,
      defaultNodeHeight: 60
    });
    expect(vp).not.toBeNull();

    const cx = 375;
    const cy = 205;
    const screenCx = cx * vp!.zoom + vp!.x;
    const screenCy = cy * vp!.zoom + vp!.y;
    expect(screenCx).toBeCloseTo(w / 2, 0);
    expect(screenCy).toBeCloseTo(h / 2, 0);
  });
});
