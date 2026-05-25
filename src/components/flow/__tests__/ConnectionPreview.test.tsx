/** ConnectionPreview 组件测试 */

import { Fragment, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConnectionPreview from '../components/ConnectionPreview';
import type { FlowNode, FlowViewport } from '../types';

(globalThis as unknown as { React: { createElement: typeof h; Fragment: typeof Fragment } }).React =
  {
    createElement: h,
    Fragment
  };

const viewport: FlowViewport = { x: 0, y: 0, zoom: 1 };

function createCanvasRef(): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }) as DOMRect;
  return el;
}

const sourceNodeBase: FlowNode = {
  id: 'n1',
  type: 'default',
  position: { x: 100, y: 100 },
  data: {},
  size: { width: 100, height: 50 },
  handles: [
    {
      id: 'out',
      type: 'source',
      position: 'right'
    }
  ]
};

describe('ConnectionPreview', () => {
  it('renders preview svg when source node and canvas ref exist', async () => {
    const wrapper = mount(ConnectionPreview, {
      props: {
        sourceNodeId: 'n1',
        sourceHandleId: 'out',
        previewPos: { x: 200, y: 200 },
        getNodeById: (id: string) => (id === 'n1' ? sourceNodeBase : undefined),
        viewport,
        canvasRef: createCanvasRef()
      }
    });

    await nextTick();
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('path').exists()).toBe(true);
  });

  it('updates path when source node position changes', async () => {
    const sourceNode = ref<FlowNode>({ ...sourceNodeBase, position: { x: 0, y: 0 } });

    const Host = defineComponent({
      setup() {
        return () =>
          h(ConnectionPreview, {
            sourceNodeId: 'n1',
            sourceHandleId: 'out',
            previewPos: { x: 300, y: 300 },
            getNodeById: (id: string) => (id === 'n1' ? sourceNode.value : undefined),
            viewport,
            canvasRef: createCanvasRef()
          });
      }
    });

    const wrapper = mount(Host);
    await nextTick();
    const edgePath = () => wrapper.find('g.flow-edge-preview path');
    const pathBefore = edgePath().attributes('d');
    expect(pathBefore).toBeDefined();

    sourceNode.value = {
      ...sourceNode.value,
      position: { x: 400, y: 300 }
    };
    await nextTick();
    await nextTick();

    expect(edgePath().exists()).toBe(true);
    const pathAfter = edgePath().attributes('d');
    expect(pathAfter).toBeDefined();
    expect(pathAfter).not.toBe(pathBefore);
  });
});
