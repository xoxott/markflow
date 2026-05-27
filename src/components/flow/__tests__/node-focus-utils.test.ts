import { describe, expect, it } from 'vitest';
import { findNextNodeInDirection } from '../utils/node-focus-utils';
import type { FlowNode } from '../types';

const nodes: FlowNode[] = [
  { id: 'a', type: 'default', position: { x: 0, y: 0 }, data: {} },
  { id: 'b', type: 'default', position: { x: 300, y: 0 }, data: {} },
  { id: 'c', type: 'default', position: { x: 0, y: 200 }, data: {} }
];

describe('findNextNodeInDirection', () => {
  it('returns first node when no current focus', () => {
    expect(findNextNodeInDirection(nodes, null, 'right')).toBe('a');
  });

  it('moves right from a to b', () => {
    expect(findNextNodeInDirection(nodes, 'a', 'right')).toBe('b');
  });

  it('moves down from a to c', () => {
    expect(findNextNodeInDirection(nodes, 'a', 'down')).toBe('c');
  });
});
