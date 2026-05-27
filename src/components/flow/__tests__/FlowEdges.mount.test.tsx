/** FlowEdges 挂载 smoke（context + props 解析） */

import { Fragment, defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FlowEdges from '../components/FlowEdges';
import { flowCanvasContextKey } from '../context/flow-canvas-context';
import type { FlowConfig, FlowEdge, FlowNode } from '../types';

(globalThis as unknown as { React: { createElement: typeof h; Fragment: typeof Fragment } }).React =
  {
    createElement: h,
    Fragment
  };

describe('FlowEdges mount', () => {
  const nodes: FlowNode[] = [
    {
      id: 'a',
      type: 'default',
      position: { x: 0, y: 0 },
      data: {},
      size: { width: 80, height: 40 }
    },
    {
      id: 'b',
      type: 'default',
      position: { x: 200, y: 0 },
      data: {},
      size: { width: 80, height: 40 }
    }
  ];
  const edges: FlowEdge[] = [{ id: 'e1', source: 'a', target: 'b' }];

  it('renders SVG edges when context provides viewport config', () => {
    const config = ref<Readonly<FlowConfig>>({
      performance: { enableViewportCulling: true, enableEdgeCanvasRendering: false }
    });

    const Host = defineComponent({
      setup() {
        provide(flowCanvasContextKey, {
          config,
          nodes: ref(nodes),
          edges: ref(edges),
          viewport: ref({ x: 0, y: 0, zoom: 1 }),
          canvasRef: ref(null),
          stableViewport: ref({ x: 0, y: 0, zoom: 1 }),
          canvasSize: ref({ width: 800, height: 600 }),
          nodesMap: ref(new Map(nodes.map(n => [n.id, n]))),
          getNodeById: (id: string) => nodes.find(n => n.id === id),
          draggingNodeId: ref(null),
          isPanning: ref(false),
          instanceId: ref('test'),
          setViewport: () => {},
          getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
          selection: {
            selectedNodeIds: ref([] as string[]),
            selectedEdgeIds: ref([] as string[]),
            selectNode: () => {},
            selectNodes: () => {},
            selectEdge: () => {},
            deselectAll: () => {}
          },
          viewportActions: {
            setViewport: () => {},
            panViewport: () => {},
            zoomViewport: () => {},
            fitView: () => false
          },
          layoutLocked: ref(false),
          setLayoutLocked: () => {},
          toggleLayoutLock: () => {},
          setShowRuler: () => {},
          toggleShowRuler: () => {},
          setDragSnapGuidesEnabled: () => {},
          toggleDragSnapGuidesEnabled: () => {}
        });

        return () => h(FlowEdges, { edges, nodes });
      }
    });

    const wrapper = mount(Host);
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('[data-edge-id="e1"]').exists()).toBe(true);
  });

  it('mounts with explicit draggingNodeId prop', () => {
    const wrapper = mount(FlowEdges, {
      props: {
        edges,
        nodes,
        draggingNodeId: 'a',
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      global: {
        provide: {
          [flowCanvasContextKey as symbol]: null
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });
});
