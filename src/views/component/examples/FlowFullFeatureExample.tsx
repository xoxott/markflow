/** Flow 示例 4: 完整功能（小地图、工具栏，viewport 与 FlowCanvas 同步） */

import { defineComponent, ref } from 'vue';
import { NCard, NH3, NText, useMessage } from 'naive-ui';
import FlowCanvas from '@/components/flow/components/FlowCanvas';
import FlowMinimap from '@/components/flow/components/FlowMinimap';
import FlowToolbar from '@/components/flow/components/FlowToolbar';
import type { FlowEdge, FlowNode, FlowViewport } from '@/components/flow';

/** FlowCanvas expose 的最小类型 */
interface FlowCanvasExposed {
  setViewport: (viewport: Partial<FlowViewport>) => void;
  zoomViewport: (zoom: number, centerX?: number, centerY?: number) => void;
  fitView: (padding?: number) => boolean;
}

export default defineComponent({
  name: 'FlowFullFeatureExample',
  setup() {
    const message = useMessage();
    const flowRef = ref<FlowCanvasExposed | null>(null);
    const canvasHostRef = ref<HTMLDivElement | null>(null);

    const fullFeatureNodes = ref<FlowNode[]>([
      {
        id: 'full-1',
        type: 'default',
        position: { x: 200, y: 100 },
        size: { width: 150, height: 60 },
        data: { label: '完整功能示例' },
        handles: [
          { id: 'source-f1', type: 'source', position: 'right' },
          { id: 'source-f1-top', type: 'source', position: 'top' }
        ]
      },
      {
        id: 'full-2',
        type: 'default',
        position: { x: 400, y: 100 },
        size: { width: 150, height: 60 },
        data: { label: '支持所有工具' },
        handles: [
          { id: 'target-f2', type: 'target', position: 'left' },
          { id: 'source-f2', type: 'source', position: 'right' },
          { id: 'source-f2-bottom', type: 'source', position: 'bottom' }
        ]
      },
      {
        id: 'full-3',
        type: 'default',
        position: { x: 300, y: 250 },
        size: { width: 150, height: 60 },
        data: { label: '小地图、工具栏' },
        handles: [
          { id: 'target-f3', type: 'target', position: 'top' },
          { id: 'source-f3', type: 'source', position: 'bottom' }
        ]
      }
    ]);

    const fullFeatureEdges = ref<FlowEdge[]>([
      {
        id: 'full-edge-1',
        source: 'full-1',
        target: 'full-2',
        sourceHandle: 'source-f1',
        targetHandle: 'target-f2',
        type: 'bezier',
        label: '主流程'
      },
      {
        id: 'full-edge-2',
        source: 'full-2',
        target: 'full-3',
        sourceHandle: 'source-f2-bottom',
        targetHandle: 'target-f3',
        type: 'bezier',
        label: '回环'
      }
    ]);

    const toolbarViewport = ref<FlowViewport>({ x: 0, y: 0, zoom: 1 });

    const handleViewportChange = (newViewport: FlowViewport) => {
      toolbarViewport.value = newViewport;
    };

    const handleResetView = () => {
      flowRef.value?.setViewport({ x: 0, y: 0, zoom: 1 });
      message.info('视图已重置');
    };

    const handleFitView = () => {
      if (flowRef.value?.fitView()) {
        message.success('已适应视图');
      }
    };

    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">
          Flow 示例：完整功能（小地图 + 工具栏）
        </NH3>
        <NText class="mb-4 block text-gray-500">
          小地图通过 FlowCanvas inject 读取视口；工具栏百分比由{' '}
          <code class="rounded bg-gray-100 px-1">viewport-change</code> 更新。边上配置了{' '}
          <code class="rounded bg-gray-100 px-1">label</code> 描述文本；选中连接线后，点击路径中点的 ×
          按钮即可删除。
        </NText>
        <div
          ref={canvasHostRef}
          style={{
            height: '500px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            position: 'relative'
          }}
        >
          <FlowCanvas
            ref={flowRef}
            id="full-feature-flow"
            initialNodes={fullFeatureNodes.value}
            initialEdges={fullFeatureEdges.value}
            width="100%"
            height="100%"
            config={{
              canvas: {
                showGrid: true,
                gridType: 'dots',
                gridSize: 20,
                panOnDrag: true,
                zoomOnScroll: true
              }
            }}
            onViewport-change={handleViewportChange}
          >
            <FlowMinimap size={{ width: 200, height: 150 }} position="bottom-right" />
            <FlowToolbar
              viewport={toolbarViewport.value}
              minZoom={0.1}
              maxZoom={4}
              onZoomChange={(zoom: number) => {
                const host = canvasHostRef.value?.querySelector(
                  '.flow-canvas'
                ) as HTMLElement | null;
                const w = host?.clientWidth ?? canvasHostRef.value?.clientWidth ?? 700;
                const h = host?.clientHeight ?? canvasHostRef.value?.clientHeight ?? 500;
                flowRef.value?.zoomViewport(zoom, w / 2, h / 2);
              }}
              onResetView={handleResetView}
              onFitView={handleFitView}
              style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
            />
          </FlowCanvas>
        </div>
      </NCard>
    );
  }
});
