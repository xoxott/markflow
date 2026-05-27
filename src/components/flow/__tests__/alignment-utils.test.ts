/** 对齐吸附工具单测 */

import { describe, expect, it } from 'vitest';
import { getNodeBounds, snapPositionToAlignment } from '../utils/alignment-utils';
import type { FlowNode } from '../types';

function node(id: string, x: number, y: number, w = 100, h = 50): FlowNode {
  return {
    id,
    type: 'default',
    position: { x, y },
    size: { width: w, height: h },
    data: {}
  };
}

describe('alignment-utils', () => {
  it('computes node bounds', () => {
    expect(getNodeBounds(node('a', 10, 20, 100, 50))).toEqual({
      left: 10,
      right: 110,
      centerX: 60,
      top: 20,
      bottom: 70,
      centerY: 45
    });
  });

  it('snaps left edges when within threshold', () => {
    const moving = node('m', 103, 50);
    const other = node('o', 100, 200);
    const result = snapPositionToAlignment(moving.position, moving, [other], 8);
    expect(result.position).toEqual({ x: 100, y: 50 });
    expect(result.guides.vertical).toContain(100);
  });

  it('snaps center Y alignment', () => {
    const moving = node('m', 0, 98);
    const other = node('o', 300, 100);
    const result = snapPositionToAlignment(moving.position, moving, [other], 8);
    expect(result.position.y).toBe(100);
    expect(result.guides.horizontal.length).toBeGreaterThan(0);
  });

  it('returns unchanged position when no peers', () => {
    const moving = node('m', 50, 50);
    const result = snapPositionToAlignment(moving.position, moving, [], 8);
    expect(result.position).toEqual({ x: 50, y: 50 });
    expect(result.guides.vertical).toHaveLength(0);
  });
});
