/** Flow 示例：自定义节点（nodeTypes 注册表 + v-slot:node） */

import { defineComponent, ref } from 'vue';
import { NCard, NH3, NTabPane, NTabs, NText } from 'naive-ui';
import { FlowCanvas, type FlowConfig, type FlowNode } from '@/components/flow';

const registryNodes = ref<FlowNode[]>([
  {
    id: 'registry-1',
    type: 'pill',
    position: { x: 120, y: 120 },
    size: { width: 200, height: 48 },
    data: { label: 'nodeTypes 注册表', tone: 'violet' }
  },
  {
    id: 'registry-2',
    type: 'pill',
    position: { x: 380, y: 120 },
    data: { label: 'defaultConfig 合并尺寸', tone: 'emerald' }
  }
]);

const slotNodes = ref<FlowNode[]>([
  {
    id: 'slot-1',
    type: 'default',
    position: { x: 140, y: 140 },
    size: { width: 180, height: 72 },
    data: { label: 'v-slot:node 完全自定义' }
  }
]);

const PillNode = defineComponent({
  name: 'FlowPillNode',
  props: {
    node: { type: Object as () => FlowNode, required: true },
    selected: { type: Boolean, default: false }
  },
  setup(props) {
    const tone = () => (props.node.data?.tone as string) || 'sky';
    return () => (
      <div
        class="flex items-center justify-center rounded-full px-4 text-sm text-white font-medium shadow-sm"
        style={{
          width: '100%',
          height: '100%',
          background: props.selected ? '#7c3aed' : `var(--flow-pill-${tone()}, #6366f1)`,
          boxShadow: props.selected ? '0 0 0 2px #a78bfa' : undefined,
          // fallback colors when CSS vars absent
          ...(tone() === 'emerald' ? { background: props.selected ? '#059669' : '#10b981' } : {}),
          ...(tone() === 'violet' ? { background: props.selected ? '#6d28d9' : '#8b5cf6' } : {})
        }}
      >
        {String(props.node.data?.label ?? props.node.id)}
      </div>
    );
  }
});

const registryConfig: Partial<FlowConfig> = {
  nodes: {
    nodeTypes: {
      pill: {
        name: 'Pill',
        component: PillNode,
        defaultConfig: {
          size: { width: 200, height: 48 },
          data: { tone: 'sky' }
        }
      }
    }
  }
};

export default defineComponent({
  name: 'FlowCustomNodeExample',
  setup() {
    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">Flow 示例：自定义节点</NH3>
        <NText class="mb-4 block text-gray-500">
          左：`config.nodes.nodeTypes` 注册表 + `defaultConfig`；右：`FlowCanvas` 的{' '}
          <code class="rounded bg-gray-100 px-1">v-slot:node</code> 优先级更高，可逐节点覆盖渲染。
        </NText>
        <NTabs type="line" animated>
          <NTabPane name="registry" tab="nodeTypes 注册表">
            <div style={{ height: '280px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <FlowCanvas
                id="custom-node-registry"
                initialNodes={registryNodes.value}
                initialEdges={[]}
                config={registryConfig}
                width="100%"
                height="100%"
              />
            </div>
          </NTabPane>
          <NTabPane name="slot" tab="v-slot:node">
            <div style={{ height: '280px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <FlowCanvas
                id="custom-node-slot"
                initialNodes={slotNodes.value}
                initialEdges={[]}
                width="100%"
                height="100%"
              >
                {{
                  node: ({
                    node,
                    selected
                  }: {
                    node: FlowNode;
                    selected: boolean;
                    locked: boolean;
                    dragging: boolean;
                  }) => (
                    <div
                      class="flex flex-col items-center justify-center border-2 rounded-lg border-dashed p-3 text-center"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderColor: selected ? '#3b82f6' : '#94a3b8',
                        background: selected ? 'rgba(59,130,246,0.08)' : '#f8fafc'
                      }}
                    >
                      <span class="text-xs text-gray-400 uppercase">slot</span>
                      <span class="font-semibold">{String(node.data?.label ?? node.id)}</span>
                    </div>
                  )
                }}
              </FlowCanvas>
            </div>
          </NTabPane>
        </NTabs>
      </NCard>
    );
  }
});
