/** Flow 示例 3: 状态管理 */

import { type Ref, defineComponent, ref } from 'vue';
import { NButton, NCard, NH3, NSpace, NText, useMessage } from 'naive-ui';
import FlowCanvas from '@/components/flow/components/FlowCanvas';
import { readExposedRef } from '@/components/flow/utils/ref-utils';
import type { FlowEdge, FlowNode } from '@/components/flow';

interface FlowCanvasExposed {
  nodes: Ref<FlowNode[]> | FlowNode[];
  edges: Ref<FlowEdge[]> | FlowEdge[];
  selectedNodeIds: Ref<string[]> | string[];
  selectedEdgeIds: Ref<string[]> | string[];
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export default defineComponent({
  name: 'FlowStateExample',
  setup() {
    const message = useMessage();
    const flowRef = ref<FlowCanvasExposed | null>(null);

    const stateNodes = ref<FlowNode[]>([
      {
        id: 'state-node-1',
        type: 'default',
        position: { x: 100, y: 200 },
        size: { width: 150, height: 60 },
        data: { label: '状态节点 1' },
        handles: [
          { id: 'source-s1', type: 'source', position: 'right' },
          { id: 'target-s1', type: 'target', position: 'left' }
        ]
      },
      {
        id: 'state-node-2',
        type: 'default',
        position: { x: 320, y: 200 },
        size: { width: 150, height: 60 },
        data: { label: '状态节点 2' },
        handles: [
          { id: 'source-s2', type: 'source', position: 'right' },
          { id: 'target-s2', type: 'target', position: 'left' }
        ]
      }
    ]);

    const stateEdges = ref<FlowEdge[]>([
      {
        id: 'state-edge-1',
        source: 'state-node-1',
        target: 'state-node-2',
        sourceHandle: 'source-s1',
        targetHandle: 'target-s2',
        type: 'bezier'
      }
    ]);

    const newNodeId = ref(3);
    const newEdgeId = ref(2);

    const canvas = () => flowRef.value;

    const readNodes = () => readExposedRef(canvas()?.nodes, stateNodes.value);
    const readEdges = () => readExposedRef(canvas()?.edges, stateEdges.value);
    const readSelectedNodeIds = () => readExposedRef(canvas()?.selectedNodeIds, [] as string[]);
    const readSelectedEdgeIds = () => readExposedRef(canvas()?.selectedEdgeIds, [] as string[]);

    const handleAddNode = () => {
      const node: FlowNode = {
        id: `state-node-${newNodeId.value}`,
        type: 'default',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 200 + 200
        },
        size: { width: 150, height: 60 },
        data: { label: `新节点 ${newNodeId.value}` },
        handles: [
          { id: `source-${newNodeId.value}`, type: 'source', position: 'right' },
          { id: `target-${newNodeId.value}`, type: 'target', position: 'left' }
        ]
      };
      canvas()?.addNode(node);
      newNodeId.value++;
      message.success('添加节点成功');
    };

    const handleAddEdge = () => {
      const nodes = readNodes();
      if (nodes.length < 2) {
        message.warning('至少需要 2 个节点才能创建连接');
        return;
      }
      const edge: FlowEdge = {
        id: `state-edge-${newEdgeId.value}`,
        source: nodes[0].id,
        target: nodes[nodes.length - 1].id,
        type: 'bezier'
      };
      canvas()?.addEdge(edge);
      newEdgeId.value++;
      message.success('添加连接成功');
    };

    const handleRemoveSelectedEdge = () => {
      const selected = readSelectedEdgeIds();
      const id = selected[0];
      if (!id) {
        message.warning('请先点击选中一条连接线');
        return;
      }
      canvas()?.removeEdge(id);
      message.success(`删除连接线: ${id}`);
    };

    return () => {
      const inst = canvas();
      const nodeCount = readNodes().length;
      const edgeCount = readEdges().length;
      const selectedNodes = readSelectedNodeIds().join(', ') || '无';
      const selectedEdges = readSelectedEdgeIds().join(', ') || '无';
      const hasSelectedEdge = readSelectedEdgeIds().length > 0;

      return (
        <NCard bordered>
          <NH3 class="border-b pb-2 text-lg font-semibold">Flow 示例 3: 状态管理</NH3>
          <NText class="mb-4 block text-gray-500">
            通过 FlowCanvas expose API 管理节点/连接线。点击连接线选中后，点击 × 删除按钮或按 Delete
            删除；支持 Ctrl+Z 撤销。
          </NText>
          <NSpace class="mb-4">
            <NButton size="small" type="primary" onClick={handleAddNode}>
              添加节点
            </NButton>
            <NButton
              size="small"
              onClick={() => {
                const nodes = readNodes();
                if (nodes.length > 0) {
                  inst?.removeNode(nodes[nodes.length - 1].id);
                  message.success('删除末节点成功');
                }
              }}
            >
              删除末节点
            </NButton>
            <NButton size="small" onClick={handleAddEdge}>
              添加连接
            </NButton>
            <NButton
              size="small"
              type="warning"
              disabled={!hasSelectedEdge}
              onClick={handleRemoveSelectedEdge}
            >
              删除选中连接
            </NButton>
            <NButton size="small" onClick={() => inst?.undo()} disabled={!inst?.canUndo()}>
              撤销
            </NButton>
            <NButton size="small" onClick={() => inst?.redo()} disabled={!inst?.canRedo()}>
              重做
            </NButton>
          </NSpace>
          <NText class="mb-4 block text-sm text-gray-400">
            节点: {nodeCount} · 连接: {edgeCount} · 选中节点: {selectedNodes} · 选中连接:{' '}
            {selectedEdges}
          </NText>
          <div style={{ height: '300px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
            <FlowCanvas
              ref={flowRef}
              id="state-flow"
              initialNodes={stateNodes.value}
              initialEdges={stateEdges.value}
              width="100%"
              height="100%"
            />
          </div>
        </NCard>
      );
    };
  }
});
