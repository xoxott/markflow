/** useEdgePositions 拖拽缓存失效测试 */

import { type Ref, nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEdgePositions } from '../hooks/useEdgePositions';
import type { FlowEdge, FlowNode, FlowViewport } from '../types';

describe('useEdgePositions', () => {
  let edges: Ref<FlowEdge[]>;
  let nodes: Ref<FlowNode[]>;
  let viewport: Ref<FlowViewport>;
  let draggingNodeIds: Ref<Set<string>>;

  beforeEach(() => {
    nodes = ref([
      {
        id: 'n1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
        size: { width: 100, height: 50 }
      },
      {
        id: 'n2',
        type: 'default',
        position: { x: 200, y: 0 },
        data: {},
        size: { width: 100, height: 50 }
      }
    ]);
    edges = ref([{ id: 'e1', source: 'n1', target: 'n2' }]);
    viewport = ref({ x: 0, y: 0, zoom: 1 });
    draggingNodeIds = ref(new Set());
  });

  it('returns positions for visible edge', async () => {
    const { getEdgePositions } = useEdgePositions({ edges, nodes, viewport, draggingNodeIds });
    await nextTick();

    const pos = getEdgePositions(edges.value[0]);
    expect(pos).not.toBeNull();
    expect(pos?.sourceX).toBeDefined();
    expect(pos?.targetX).toBeDefined();
  });

  it('recomputes when dragging endpoint node', async () => {
    const { getEdgePositions } = useEdgePositions({
      edges,
      nodes,
      viewport,
      draggingNodeIds,
      cacheTTL: 10000
    });

    await nextTick();
    const pos1 = getEdgePositions(edges.value[0]);
    expect(pos1).not.toBeNull();

    draggingNodeIds.value = new Set(['n1']);
    nodes.value = [{ ...nodes.value[0], position: { x: 50, y: 0 } }, nodes.value[1]];
    await nextTick();

    const pos2 = getEdgePositions(edges.value[0]);
    expect(pos2).not.toBeNull();
    expect(pos2?.sourceX).not.toBe(pos1?.sourceX);
  });
});
