/** Flow 示例：exportJSON / importJSON（FlowCanvas ref） */

import { defineComponent, ref } from 'vue';
import { NButton, NCard, NH3, NSpace, NText, useMessage } from 'naive-ui';
import { FlowCanvas, type FlowEdge, type FlowNode } from '@/components/flow';
import type { FlowSnapshot } from '@/components/flow/internal';

interface FlowCanvasExposed {
  exportJSON: (options?: { includeViewport?: boolean; includeGuides?: boolean }) => FlowSnapshot;
  importJSON: (input: unknown, opts?: { replace?: boolean; includeViewport?: boolean }) => boolean;
}

const seedNodes: FlowNode[] = [
  {
    id: 'persist-a',
    type: 'default',
    position: { x: 100, y: 150 },
    size: { width: 150, height: 60 },
    data: { label: '导出点 A' },
    handles: [{ id: 'persist-a-out', type: 'source', position: 'right' }]
  },
  {
    id: 'persist-b',
    type: 'default',
    position: { x: 320, y: 150 },
    size: { width: 150, height: 60 },
    data: { label: '导出点 B' },
    handles: [{ id: 'persist-b-in', type: 'target', position: 'left' }]
  }
];

const seedEdges: FlowEdge[] = [
  {
    id: 'persist-edge',
    source: 'persist-a',
    target: 'persist-b',
    sourceHandle: 'persist-a-out',
    targetHandle: 'persist-b-in',
    type: 'bezier',
    label: '持久化'
  }
];

export default defineComponent({
  name: 'FlowPersistenceExample',
  setup() {
    const message = useMessage();
    const flowRef = ref<FlowCanvasExposed | null>(null);
    const lastSnapshot = ref<string>('');

    const handleExport = () => {
      const snapshot = flowRef.value?.exportJSON({ includeViewport: true });
      if (!snapshot) {
        message.error('画布未就绪');
        return;
      }
      lastSnapshot.value = JSON.stringify(snapshot, null, 2);
      message.success(`已导出 ${snapshot.nodes.length} 节点 / ${snapshot.edges.length} 边`);
    };

    const handleImport = () => {
      if (!lastSnapshot.value) {
        message.warning('请先导出或粘贴 JSON');
        return;
      }
      try {
        const parsed = JSON.parse(lastSnapshot.value) as unknown;
        const ok = flowRef.value?.importJSON(parsed, { replace: true, includeViewport: true });
        message[ok ? 'success' : 'error'](ok ? 'importJSON 成功' : 'importJSON 失败');
      } catch {
        message.error('JSON 解析失败');
      }
    };

    const handleClear = () => {
      const empty: FlowSnapshot = {
        version: 1,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      flowRef.value?.importJSON(empty);
      message.info('已清空画布');
    };

    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">
          Flow 示例：序列化（exportJSON / importJSON）
        </NH3>
        <NText class="mb-4 block text-gray-500">
          通过 <code class="rounded bg-gray-100 px-1">FlowCanvas</code> ref 调用{' '}
          <code class="rounded bg-gray-100 px-1">exportJSON()</code> /{' '}
          <code class="rounded bg-gray-100 px-1">importJSON()</code>。下方文本框展示最近一次导出的
          FlowSnapshot JSON（可手改后点导入验证）。
        </NText>
        <NSpace class="mb-4">
          <NButton size="small" type="primary" onClick={handleExport}>
            导出 JSON
          </NButton>
          <NButton size="small" onClick={handleImport}>
            导入 JSON
          </NButton>
          <NButton size="small" onClick={handleClear}>
            清空画布
          </NButton>
        </NSpace>
        <div
          class="grid mb-4 gap-4"
          style={{ gridTemplateColumns: '1fr 280px', minHeight: '320px' }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', minHeight: '320px' }}>
            <FlowCanvas
              ref={flowRef}
              id="persistence-flow"
              initialNodes={seedNodes}
              initialEdges={seedEdges}
              width="100%"
              height="100%"
            />
          </div>
          <textarea
            class="w-full resize-y border border-gray-200 rounded p-2 text-xs font-mono"
            rows={14}
            placeholder="exportJSON() 输出会显示在这里"
            value={lastSnapshot.value}
            onInput={(e: Event) => {
              lastSnapshot.value = (e.target as HTMLTextAreaElement).value;
            }}
          />
        </div>
      </NCard>
    );
  }
});
