/**
 * Flow vs Vue-Flow 挂载耗时对比（happy-dom）
 *
 * 运行: pnpm test:flow-compare
 */

import { Fragment, defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type Edge, type GraphNode, VueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import FlowCanvas from '../components/FlowCanvas';
import {
  generateFlowEdges,
  generateFlowNodes,
  toVueFlowEdges,
  toVueFlowNodes
} from './benchmark-data';

// Vitest 下 TSX 组件需要 classic JSX 的 React 别名
(globalThis as unknown as { React: { createElement: typeof h; Fragment: typeof Fragment } }).React =
  {
    createElement: h,
    Fragment
  };

const LightNode = defineComponent({
  name: 'LightBenchmarkNode',
  props: { data: { type: Object, default: () => ({}) } },
  setup(props) {
    return () =>
      h(
        'div',
        {
          style: {
            width: '220px',
            height: '72px',
            padding: '8px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }
        },
        String((props.data as { label?: string })?.label ?? '')
      );
  }
});

async function measureMountMs(mountFn: () => Promise<{ unmount: () => void }>): Promise<number> {
  const start = Date.now();
  const wrapper = await mountFn();
  await nextTick();
  await nextTick();
  const elapsed = Date.now() - start;
  wrapper.unmount();
  return elapsed;
}

describe('Flow vs Vue-Flow mount time (happy-dom)', () => {
  const scenarios = [
    { nodes: 100, edges: 50, label: '100 nodes / 50 edges' },
    { nodes: 1000, edges: 200, label: '1000 nodes / 200 edges' }
  ] as const;

  for (const { nodes: nodeCount, edges: edgeCount, label } of scenarios) {
    it(`records mount timings for ${label}`, async () => {
      const flowNodes = generateFlowNodes(nodeCount);
      const flowEdges = generateFlowEdges(nodeCount, edgeCount);
      const vueNodes = toVueFlowNodes(flowNodes);
      const vueEdges = toVueFlowEdges(flowEdges);

      const flowMs = await measureMountMs(async () => {
        return mount(FlowCanvas, {
          props: {
            initialNodes: flowNodes,
            initialEdges: flowEdges,
            width: 800,
            height: 600,
            config: {
              performance: {
                enableViewportCulling: true,
                enableEdgeCanvasRendering: edgeCount >= 200
              }
            }
          }
        });
      });

      const vueFlowMs = await measureMountMs(async () => {
        return mount(
          defineComponent({
            components: { VueFlow },
            setup() {
              return () =>
                h('div', { style: { width: '800px', height: '600px', position: 'relative' } }, [
                  h(VueFlow, {
                    nodes: vueNodes as GraphNode[],
                    edges: vueEdges as Edge[],
                    nodeTypes: { default: LightNode },
                    onlyRenderVisibleElements: true
                  } as Record<string, unknown>)
                ]);
            }
          }),
          { attachTo: document.body }
        );
      });

      expect(flowMs).toBeGreaterThan(0);
      expect(vueFlowMs).toBeGreaterThan(0);

      // eslint-disable-next-line no-console -- 基准结果供文档更新
      console.info(`[mount ${label}] Flow=${flowMs}ms VueFlow=${vueFlowMs}ms`);
    });
  }
});
