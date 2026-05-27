/** Flow 示例：Shift + 拖拽框选（20+ 节点） */

import { defineComponent, ref } from 'vue';
import { NCard, NH3, NText, useMessage } from 'naive-ui';
import { FlowCanvas, type FlowNode } from '@/components/flow';
import { readExposedRef } from '@/components/flow/internal';

interface FlowCanvasExposed {
  selectedNodeIds: import('vue').Ref<string[]> | string[];
}

function buildGridNodes(rows: number, cols: number): FlowNode[] {
  const nodes: FlowNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c + 1;
      const id = `box-node-${index}`;
      nodes.push({
        id,
        type: 'default',
        position: { x: 60 + c * 170, y: 60 + r * 95 },
        size: { width: 140, height: 56 },
        data: { label: `#${index}` },
        handles: [
          { id: `${id}-src`, type: 'source', position: 'right' },
          { id: `${id}-tgt`, type: 'target', position: 'left' }
        ]
      });
    }
  }
  return nodes;
}

export default defineComponent({
  name: 'FlowBoxSelectionExample',
  setup() {
    const message = useMessage();
    const flowRef = ref<FlowCanvasExposed | null>(null);
    const boxNodes = ref<FlowNode[]>(buildGridNodes(4, 6));

    const readSelected = () =>
      readExposedRef(flowRef.value?.selectedNodeIds, [] as string[]).join(', ') || '无';

    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">Flow 示例：框选（Shift + 拖拽）</NH3>
        <NText class="mb-4 block text-gray-500">
          画布预置 {boxNodes.value.length} 个节点。按住 <strong>Shift</strong>{' '}
          在空白处拖拽绘制选框，松手后批量选中；可配合 Ctrl
          追加多选。画布平移仍为空白处左键拖拽（未按 Shift 时）。
        </NText>
        <NText class="mb-4 block text-sm text-gray-400">当前选中节点 ID：{readSelected()}</NText>
        <div style={{ height: '420px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <FlowCanvas
            ref={flowRef}
            id="box-selection-flow"
            initialNodes={boxNodes.value}
            initialEdges={[]}
            width="100%"
            height="100%"
            config={{
              interaction: {
                enableBoxSelection: true,
                boxSelectionKey: 'shift'
              }
            }}
            onSelection-change={sel => {
              if (sel.nodeIds.length > 0) {
                message.info(`已选中 ${sel.nodeIds.length} 个节点`);
              }
            }}
          />
        </div>
      </NCard>
    );
  }
});
