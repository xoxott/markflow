/** DefaultStateStore.addNode 与 updateNode 引用一致性 */

import { describe, expect, it } from 'vitest';
import { DefaultStateStore } from '../core/state/stores/DefaultStateStore';
import type { FlowNode } from '../types/flow-node';

describe('DefaultStateStore.addNode', () => {
  it('keeps nodes array and nodesMap in sync so drag updates apply', () => {
    const store = new DefaultStateStore();
    const input: FlowNode = {
      id: 'new-1',
      type: 'default',
      position: { x: 10, y: 20 },
      size: { width: 150, height: 60 },
      data: { label: 'New' }
    };

    store.addNode(input);
    store.updateNode('new-1', { position: { x: 100, y: 80 } });

    const fromGet = store.getNodes().find(n => n.id === 'new-1');
    expect(fromGet?.position).toEqual({ x: 100, y: 80 });

    const internal = store.getNode('new-1');
    expect(internal?.position).toEqual({ x: 100, y: 80 });
  });
});
