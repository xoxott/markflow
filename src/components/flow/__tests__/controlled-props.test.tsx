/** 受控 nodes prop → useFlowCanvasPropsSync → stateStore */

import { nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { DefaultStateStore } from '../core/state/stores/DefaultStateStore';
import { useFlowCanvasPropsSync } from '../hooks/useFlowCanvasPropsSync';
import type { FlowEdge, FlowNode } from '../types';

const nodeA: FlowNode = {
  id: 'controlled-a',
  type: 'default',
  position: { x: 0, y: 0 },
  size: { width: 100, height: 40 },
  data: { label: 'A' }
};

const nodeB: FlowNode = {
  id: 'controlled-b',
  type: 'default',
  position: { x: 200, y: 0 },
  size: { width: 100, height: 40 },
  data: { label: 'B' }
};

describe('FlowCanvas controlled nodes prop', () => {
  it('syncs state store when external nodes source changes', async () => {
    const store = new DefaultStateStore();
    const external = ref<FlowNode[] | undefined>(undefined);
    const nodes = ref<FlowNode[]>([]);
    const edges = ref<FlowEdge[]>([]);

    const { start, stop } = useFlowCanvasPropsSync({
      nodesSource: external,
      stateStore: store,
      nodes,
      edges
    });

    start();

    external.value = [nodeA];
    await nextTick();
    nodes.value = store.getNodes();
    expect(store.getNodes()).toHaveLength(1);
    expect(store.getNodes()[0]?.id).toBe('controlled-a');

    external.value = [nodeA, nodeB];
    await nextTick();
    nodes.value = store.getNodes();
    expect(store.getNodes()).toHaveLength(2);
    expect(store.getNodes().map(n => n.id)).toEqual(['controlled-a', 'controlled-b']);

    external.value = [];
    await nextTick();
    expect(store.getNodes()).toHaveLength(0);

    stop();
  });
});
