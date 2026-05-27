/** FlowNodes nodeTypes 注册表渲染 */

import { Fragment, defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FlowNodes from '../components/FlowNodes';
import { DEFAULT_FLOW_CONFIG } from '../config/default-config';
import { flowCanvasContextKey } from '../context/flow-canvas-context';
import type { FlowConfig, FlowNode } from '../types';

(globalThis as unknown as { React: { createElement: typeof h; Fragment: typeof Fragment } }).React =
  {
    createElement: h,
    Fragment
  };

const CustomTypeNode = defineComponent({
  name: 'TestCustomTypeNode',
  props: {
    node: { type: Object as () => FlowNode, required: true }
  },
  setup(props) {
    return () =>
      h(
        'div',
        { 'class': 'flow-test-custom-node', 'data-label': String(props.node.data?.label ?? '') },
        `custom:${props.node.id}`
      );
  }
});

describe('FlowNodes nodeTypes registry', () => {
  it('renders registered node type component in the DOM', () => {
    const nodes: FlowNode[] = [
      {
        id: 'custom-type-1',
        type: 'badge',
        position: { x: 50, y: 50 },
        size: { width: 120, height: 40 },
        data: { label: 'Badge' }
      }
    ];

    const config = ref<Readonly<FlowConfig>>({
      ...DEFAULT_FLOW_CONFIG,
      nodes: {
        ...DEFAULT_FLOW_CONFIG.nodes,
        nodeTypes: {
          badge: {
            name: 'Badge',
            component: CustomTypeNode
          }
        }
      },
      performance: {
        ...DEFAULT_FLOW_CONFIG.performance,
        enableViewportCulling: false
      }
    });

    const Host = defineComponent({
      setup() {
        provide(flowCanvasContextKey, {
          config,
          nodes: ref(nodes),
          edges: ref([]),
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
          toggleLayoutLock: () => {}
        });

        return () =>
          h(FlowNodes, {
            nodes,
            enableViewportCulling: false,
            canvasSize: { width: 800, height: 600 }
          });
      }
    });

    const wrapper = mount(Host);
    const custom = wrapper.find('.flow-test-custom-node');
    expect(custom.exists()).toBe(true);
    expect(custom.text()).toContain('custom:custom-type-1');
    expect(custom.attributes('data-label')).toBe('Badge');
  });
});
