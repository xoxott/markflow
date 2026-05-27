/** Flow 示例 5: 性能测试（可配置节点数量） */

import { defineComponent, ref } from 'vue';
import { NButton, NCard, NH3, NInputNumber, NSpace, NText, useMessage } from 'naive-ui';
import {
  FlowCanvas,
  type FlowEdge,
  type FlowNode,
  FlowPerformanceMonitor
} from '@/components/flow';

export default defineComponent({
  name: 'FlowPerformanceExample',
  setup() {
    const message = useMessage();

    const perfNodeCount = ref(200); // 默认 200 个节点
    const perfShowMonitor = ref(true); // 显示性能监控

    // 生成性能测试节点（优化布局，确保在默认视图下可见）
    const generatePerformanceNodes = (count: number): FlowNode[] => {
      const nodes: FlowNode[] = [];

      // ✅ 优化：根据常见屏幕尺寸计算布局
      // 假设画布大小约为 1200x600（常见尺寸）
      const canvasWidth = 1200;
      const canvasHeight = 600;

      const nodeWidth = 120; // 减小节点宽度
      const nodeHeight = 50; // 减小节点高度
      const spacingX = 140; // 减小水平间距
      const spacingY = 70; // 减小垂直间距
      const padding = 30; // 边距

      // 计算可用空间
      const availableWidth = canvasWidth - 2 * padding;
      const availableHeight = canvasHeight - 2 * padding;

      // 计算列数和行数
      const cols = Math.floor(availableWidth / spacingX);
      const rows = Math.ceil(count / cols);

      // 如果行数过多，调整布局使其更紧凑
      const actualSpacingY = rows > availableHeight / spacingY ? availableHeight / rows : spacingY;

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * spacingX + padding;
        const y = row * actualSpacingY + padding;

        nodes.push({
          id: `perf-node-${i}`,
          type: 'default',
          position: { x, y },
          size: { width: nodeWidth, height: nodeHeight },
          data: { label: `节点 ${i + 1}` },
          draggable: true, // 显式启用拖拽
          selectable: true, // 显式启用选择
          connectable: true, // 显式启用连接
          handles: [
            { id: `source-${i}`, type: 'source', position: 'right' },
            { id: `target-${i}`, type: 'target', position: 'left' }
          ]
        });
      }

      return nodes;
    };

    // 生成连接线（每行连接相邻节点）
    const generatePerformanceEdges = (nodeCount: number): FlowEdge[] => {
      const edges: FlowEdge[] = [];

      // ✅ 使用与节点生成相同的列数计算
      const canvasWidth = 1200;
      const spacingX = 140;
      const padding = 30;
      const availableWidth = canvasWidth - 2 * padding;
      const cols = Math.floor(availableWidth / spacingX);

      // 每行连接相邻节点
      for (let i = 0; i < nodeCount - 1; i++) {
        // 连接同一行的相邻节点
        if ((i + 1) % cols !== 0) {
          edges.push({
            id: `perf-edge-${i}-${i + 1}`,
            source: `perf-node-${i}`,
            target: `perf-node-${i + 1}`,
            sourceHandle: `source-${i}`,
            targetHandle: `target-${i + 1}`,
            type: 'bezier'
          });
        }
      }

      return edges;
    };

    // 初始化性能测试数据
    const performanceNodes = ref<FlowNode[]>(generatePerformanceNodes(perfNodeCount.value));
    const performanceEdges = ref<FlowEdge[]>(generatePerformanceEdges(perfNodeCount.value));

    const applyPreset = (count: number) => {
      perfNodeCount.value = count;
      performanceNodes.value = generatePerformanceNodes(count);
      performanceEdges.value = generatePerformanceEdges(count);
      message.success(`已加载 ${count} 节点压测场景`);
    };

    const regeneratePerformanceData = () => {
      applyPreset(perfNodeCount.value);
    };

    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">Flow 性能压测（可配置节点数量）</NH3>
        <NText class="mb-4 block text-gray-500">
          用于观察 FPS 与大规模平移/拖拽。Mac 上若始终 60 FPS，请用 Chrome Performance 的{' '}
          <strong>CPU 4×</strong> 限速，并优先看面板中的<strong>最低 FPS</strong>。 算法对比请用{' '}
          <code class="rounded bg-gray-100 px-1">pnpm bench:compare</code>。
        </NText>
        <NSpace class="mb-4" vertical>
          <NSpace wrap>
            <NText class="text-sm">节点数量:</NText>
            <NInputNumber
              v-model:value={perfNodeCount.value}
              min={10}
              max={10000}
              step={50}
              style={{ width: '120px' }}
            />
            <NButton size="small" type="primary" onClick={regeneratePerformanceData}>
              重新生成
            </NButton>
            <NButton size="small" onClick={() => applyPreset(200)}>
              预设 200
            </NButton>
            <NButton size="small" onClick={() => applyPreset(1000)}>
              预设 1000
            </NButton>
            <NButton size="small" onClick={() => applyPreset(2000)}>
              预设 2000
            </NButton>
            <NButton
              size="small"
              onClick={() => {
                perfShowMonitor.value = !perfShowMonitor.value;
              }}
            >
              {perfShowMonitor.value ? '隐藏' : '显示'}性能监控
            </NButton>
          </NSpace>
          <NText class="text-sm text-gray-400">
            当前: {performanceNodes.value.length} 个节点, {performanceEdges.value.length} 条连接线 —
            建议测试：空白处平移 5s → 拖单节点 5s
          </NText>
        </NSpace>
        <div
          style={{
            height: '600px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            position: 'relative'
          }}
        >
          <FlowCanvas
            id="performance-flow"
            initialNodes={performanceNodes.value}
            initialEdges={performanceEdges.value}
            config={{
              performance: {
                enableViewportCulling: true,
                enableEdgeCanvasRendering: false,
                edgeCanvasThreshold: 100,
                enableRAFThrottle: true
              },
              canvas: {
                showGrid: true,
                gridType: 'dots',
                gridSize: 20,
                zoomOnScroll: true,
                panOnDrag: true
              },
              nodes: {
                draggable: true, // 启用节点拖拽
                selectable: true, // 启用节点选择
                connectable: true // 启用节点连接
              },
              interaction: {
                nodesDraggable: true, // 全局启用拖拽
                nodesSelectable: true // 全局启用选择
              }
            }}
            width="100%"
            height="100%"
          >
            {perfShowMonitor.value && (
              <FlowPerformanceMonitor
                totalNodes={performanceNodes.value.length}
                visibleNodes={performanceNodes.value.length}
                totalEdges={performanceEdges.value.length}
                visibleEdges={performanceEdges.value.length}
                position="top-right"
              />
            )}
          </FlowCanvas>
        </div>
      </NCard>
    );
  }
});
