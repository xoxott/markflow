/** useEdgeViewportCulling Hook 测试 */

import { type Ref, nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEdgeViewportCulling } from '../hooks/useEdgeViewportCulling';
import type { FlowEdge, FlowNode, FlowViewport } from '../types';

Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1000 });
Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

describe('useEdgeViewportCulling', () => {
  let edges: Ref<FlowEdge[]>;
  let nodes: Ref<FlowNode[]>;
  let viewport: Ref<FlowViewport>;

  beforeEach(() => {
    nodes = ref([
      {
        id: 'n1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {},
        size: { width: 80, height: 40 }
      },
      {
        id: 'n2',
        type: 'default',
        position: { x: 300, y: 200 },
        data: {},
        size: { width: 80, height: 40 }
      },
      {
        id: 'n3',
        type: 'default',
        position: { x: 5000, y: 5000 },
        data: {},
        size: { width: 80, height: 40 }
      },
      {
        id: 'n4',
        type: 'default',
        position: { x: 5100, y: 5100 },
        data: {},
        size: { width: 80, height: 40 }
      }
    ]);

    edges = ref([
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n3', target: 'n4' }
    ]);

    viewport = ref({ x: 0, y: 0, zoom: 1 });
  });

  it('returns visible edges in viewport', async () => {
    const { visibleEdges } = useEdgeViewportCulling({
      edges,
      nodes,
      viewport,
      enabled: true
    });

    await nextTick();

    const ids = visibleEdges.value.map(e => e.id);
    expect(ids).toContain('e1');
    expect(ids).not.toContain('e2');
  });

  it('returns all edges when disabled', async () => {
    const { visibleEdges } = useEdgeViewportCulling({
      edges,
      nodes,
      viewport,
      enabled: false
    });

    await nextTick();
    expect(visibleEdges.value.length).toBe(2);
  });

  it('keeps stable reference when viewport changes but visible set unchanged', async () => {
    const isPanning = ref(true);
    const { visibleEdges } = useEdgeViewportCulling({
      edges,
      nodes,
      viewport,
      isPanning
    });

    await nextTick();
    const ref1 = visibleEdges.value;

    viewport.value = { x: 10, y: 10, zoom: 1 };
    await nextTick();

    expect(visibleEdges.value).toBe(ref1);
  });
});
