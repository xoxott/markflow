/** Flow 示例：画布背景 / 网格 / 刻度尺 */

import { defineComponent, ref } from 'vue';
import { NButton, NCard, NH3, NSpace, NTag, NText, useMessage } from 'naive-ui';
import FlowCanvas from '@/components/flow/components/FlowCanvas';
import { useFlowConfig } from '@/components/flow';
import type { FlowEdge, FlowGridType, FlowNode } from '@/components/flow';

const GRID_TYPE_OPTIONS: { value: FlowGridType; label: string }[] = [
  { value: 'dots', label: '点状' },
  { value: 'lines', label: '线状' },
  { value: 'cross', label: '十字' },
  { value: 'none', label: '无网格' }
];

const CANVAS_ID = 'flow-grid-config-demo';

export default defineComponent({
  name: 'FlowConfigExample',
  setup() {
    const message = useMessage();

    const { config: flowConfig, updateConfig: updateFlowConfig } = useFlowConfig({
      id: CANVAS_ID,
      initialConfig: {
        canvas: {
          minZoom: 0.1,
          maxZoom: 4,
          defaultZoom: 1,
          showGrid: true,
          gridType: 'dots',
          gridSize: 20,
          showRuler: true,
          snapToGrid: true,
          showSnapGuides: true
        },
        nodes: {
          draggable: true,
          selectable: true,
          connectable: true
        },
        edges: {
          defaultType: 'bezier',
          animated: false,
          showArrow: true
        }
      }
    });

    const configNodes = ref<FlowNode[]>([
      {
        id: 'config-node-1',
        type: 'default',
        position: { x: 120, y: 120 },
        size: { width: 150, height: 60 },
        data: { label: '拖动我' },
        handles: [{ id: 'source-c1', type: 'source', position: 'right' }]
      },
      {
        id: 'config-node-2',
        type: 'default',
        position: { x: 320, y: 120 },
        size: { width: 150, height: 60 },
        data: { label: '对齐网格' },
        handles: [{ id: 'target-c2', type: 'target', position: 'left' }]
      }
    ]);

    const configEdges = ref<FlowEdge[]>([
      {
        id: 'config-edge-1',
        source: 'config-node-1',
        target: 'config-node-2',
        sourceHandle: 'source-c1',
        targetHandle: 'target-c2',
        type: 'bezier',
        label: '示例连线'
      }
    ]);

    const currentGridType = () => flowConfig.value.canvas?.gridType ?? 'dots';

    const setGridType = (gridType: FlowGridType) => {
      updateFlowConfig({
        canvas: { gridType, showGrid: gridType !== 'none' }
      });
      const label = GRID_TYPE_OPTIONS.find(item => item.value === gridType)?.label ?? gridType;
      message.success(`已切换为${label}背景`);
    };

    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">Flow 示例：画布背景 / 网格 / 刻度尺</NH3>
        <NText class="mb-4 block text-gray-500">
          背景：<code class="rounded bg-gray-100 px-1">gridType</code> 支持点状 / 线状 / 十字 / 无网格。刻度尺：{' '}
          <code class="rounded bg-gray-100 px-1">showRuler</code> 显示坐标刻度——从<strong>顶部尺向下拖</strong>
          出水平辅助线，从<strong>左侧尺向右拖</strong>出垂直辅助线；可拖动已有辅助线，拖回刻度尺删除，双击也可删除。吸附：{' '}
          <code class="rounded bg-gray-100 px-1">snapToGrid</code> /{' '}
          <code class="rounded bg-gray-100 px-1">snapToGuides</code> 在拖节点时对齐网格与用户辅助线。
        </NText>
        <NSpace class="mb-4" vertical>
          <NSpace wrap>
            {GRID_TYPE_OPTIONS.map(option => (
              <NButton
                key={option.value}
                size="small"
                type={currentGridType() === option.value ? 'primary' : 'default'}
                onClick={() => setGridType(option.value)}
              >
                {option.label}
              </NButton>
            ))}
            <NButton
              size="small"
              type={flowConfig.value.canvas?.showRuler ? 'primary' : 'default'}
              onClick={() => {
                const next = !flowConfig.value.canvas?.showRuler;
                updateFlowConfig({ canvas: { showRuler: next } });
                message.info(next ? '已显示刻度尺' : '已隐藏刻度尺');
              }}
            >
              刻度尺
            </NButton>
            <NButton
              size="small"
              type={flowConfig.value.canvas?.snapToGrid ? 'primary' : 'default'}
              onClick={() => {
                const next = !flowConfig.value.canvas?.snapToGrid;
                updateFlowConfig({ canvas: { snapToGrid: next } });
                message.info(next ? '已开启网格吸附' : '已关闭网格吸附');
              }}
            >
              网格吸附
            </NButton>
            <NButton
              size="small"
              onClick={() => {
                updateFlowConfig({ canvas: { snapToGuides: false, snapToGrid: false } });
                message.info('已清除吸附（辅助线仍保留，可拖回刻度尺删除）');
              }}
            >
              关闭吸附
            </NButton>
          </NSpace>
          <NSpace align="center" wrap>
            <NTag size="small" type="info">
              gridType: {currentGridType()}
            </NTag>
            <NTag size="small">gridSize: {flowConfig.value.canvas?.gridSize ?? 20}px</NTag>
            <NTag size="small">
              刻度尺: {flowConfig.value.canvas?.showRuler ? '开' : '关'}
            </NTag>
            <NTag size="small">
              吸附: {flowConfig.value.canvas?.snapToGrid ? '开' : '关'}
            </NTag>
          </NSpace>
        </NSpace>
        <div style={{ height: '320px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <FlowCanvas
            id={CANVAS_ID}
            config={flowConfig.value}
            initialNodes={configNodes.value}
            initialEdges={configEdges.value}
            width="100%"
            height="100%"
          />
        </div>
      </NCard>
    );
  }
});
