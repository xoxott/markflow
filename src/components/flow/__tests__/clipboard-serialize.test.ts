/** exportJSON / importJSON 底层序列化（toJSON / fromJSON） */

import { describe, expect, it } from 'vitest';
import {
  FLOW_SNAPSHOT_VERSION,
  type FlowSnapshot,
  fromJSON,
  toJSON
} from '../utils/serialization-utils';
import type { FlowEdge, FlowNode } from '../types';

const nodes: FlowNode[] = [
  {
    id: 'n1',
    type: 'default',
    position: { x: 10, y: 20 },
    size: { width: 100, height: 50 },
    data: { label: 'One', meta: { nested: true } }
  }
];

const edges: FlowEdge[] = [
  {
    id: 'e1',
    source: 'n1',
    target: 'n1',
    type: 'bezier',
    label: 'loop'
  }
];

const viewport = { x: 100, y: 200, zoom: 1.25 };

describe('Flow snapshot serialization', () => {
  it('toJSON produces versioned snapshot with cloned nodes', () => {
    const snapshot = toJSON({ nodes, edges, viewport }, { includeViewport: true });
    expect(snapshot.version).toBe(FLOW_SNAPSHOT_VERSION);
    expect(snapshot.nodes).toHaveLength(1);
    expect(snapshot.nodes[0]?.position).toEqual({ x: 10, y: 20 });
    expect(snapshot.nodes[0]?.data).toEqual({ label: 'One', meta: { nested: true } });
    expect(snapshot.edges[0]?.label).toBe('loop');
    expect(snapshot.viewport).toEqual(viewport);

    nodes[0]!.position.x = 999;
    expect(snapshot.nodes[0]?.position.x).toBe(10);
  });

  it('fromJSON round-trips snapshot and defaults viewport for legacy input', () => {
    const exported = toJSON({ nodes, edges, viewport });
    const parsed = fromJSON(JSON.parse(JSON.stringify(exported)) as FlowSnapshot);
    expect(parsed.nodes[0]?.id).toBe('n1');
    expect(parsed.viewport).toEqual(viewport);

    const legacy = fromJSON({ nodes, edges });
    expect(legacy.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('fromJSON rejects invalid input', () => {
    expect(() => fromJSON(null)).toThrow();
    expect(() => fromJSON({ version: 1, nodes: 'bad', edges: [] })).toThrow();
  });

  it('toJSON can omit viewport when includeViewport is false', () => {
    const snapshot = toJSON({ nodes, edges, viewport }, { includeViewport: false });
    expect(snapshot.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});
