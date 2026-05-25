import { describe, expect, it } from 'vitest';
import type { FlowEdge, FlowNode } from '../types';
import { pickHandleIdByDirection, resolveEdgeHandles } from '../utils/edge-handle-utils';

const nodeA: FlowNode = {
  id: 'a',
  type: 'default',
  position: { x: 0, y: 0 },
  size: { width: 100, height: 50 },
  data: {},
  handles: [
    { id: 'a-out-r', type: 'source', position: 'right' },
    { id: 'a-in-l', type: 'target', position: 'left' }
  ]
};

const nodeB: FlowNode = {
  id: 'b',
  type: 'default',
  position: { x: 200, y: 0 },
  size: { width: 100, height: 50 },
  data: {},
  handles: [
    { id: 'b-in-l', type: 'target', position: 'left' },
    { id: 'b-out-r', type: 'source', position: 'right' }
  ]
};

describe('pickHandleIdByDirection', () => {
  it('picks right source and left target for horizontal link', () => {
    expect(pickHandleIdByDirection(nodeA, 'source', 200, 0)).toBe('a-out-r');
    expect(pickHandleIdByDirection(nodeB, 'target', -200, 0)).toBe('b-in-l');
  });
});

describe('resolveEdgeHandles', () => {
  it('keeps explicit handle ids', () => {
    const edge: FlowEdge = {
      id: 'e1',
      source: 'a',
      target: 'b',
      sourceHandle: 'a-out-r',
      targetHandle: 'b-in-l'
    };
    expect(resolveEdgeHandles(edge, nodeA, nodeB)).toEqual({
      sourceHandle: 'a-out-r',
      targetHandle: 'b-in-l'
    });
  });

  it('auto-resolves when handles omitted', () => {
    const edge: FlowEdge = { id: 'e1', source: 'a', target: 'b' };
    expect(resolveEdgeHandles(edge, nodeA, nodeB)).toEqual({
      sourceHandle: 'a-out-r',
      targetHandle: 'b-in-l'
    });
  });
});
