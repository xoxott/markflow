/** Flow 示例：连接线标签（edge.label） */

import { defineComponent, ref } from 'vue';
import { NButton, NCard, NH3, NSpace, NTag, NText, useMessage } from 'naive-ui';
import FlowCanvas from '@/components/flow/components/FlowCanvas';
import type { FlowConfig, FlowEdge, FlowNode } from '@/components/flow';

export default defineComponent({
  name: 'FlowEdgeLabelExample',
  setup() {
    const message = useMessage();

    const labelNodes = ref<FlowNode[]>([
      {
        id: 'start-1',
        type: 'default',
        position: { x: 40, y: 110 },
        size: { width: 90, height: 48 },
        data: { label: '开始' },
        handles: [{ id: 'source-start', type: 'source', position: 'right' }]
      },
      {
        id: 'cond-1',
        type: 'default',
        position: { x: 180, y: 100 },
        size: { width: 140, height: 68 },
        data: { label: '条件判断' },
        handles: [
          { id: 'target-cond', type: 'target', position: 'left' },
          { id: 'source-yes', type: 'source', position: 'right', style: { top: '35%' } },
          { id: 'source-no', type: 'source', position: 'right', style: { top: '65%' } }
        ]
      },
      {
        id: 'action-yes',
        type: 'default',
        position: { x: 400, y: 40 },
        size: { width: 130, height: 56 },
        data: { label: '成功处理' },
        handles: [{ id: 'target-yes', type: 'target', position: 'left' }]
      },
      {
        id: 'action-no',
        type: 'default',
        position: { x: 400, y: 170 },
        size: { width: 130, height: 56 },
        data: { label: '失败处理' },
        handles: [{ id: 'target-no', type: 'target', position: 'left' }]
      }
    ]);

    const labelEdges = ref<FlowEdge[]>([
      {
        id: 'edge-start-cond',
        source: 'start-1',
        target: 'cond-1',
        sourceHandle: 'source-start',
        targetHandle: 'target-cond',
        type: 'bezier'
      },
      {
        id: 'edge-yes',
        source: 'cond-1',
        target: 'action-yes',
        sourceHandle: 'source-yes',
        targetHandle: 'target-yes',
        type: 'bezier',
        label: '是',
        labelStyle: { fill: 'var(--flow-edge-label, #334155)', fontWeight: '600' }
      },
      {
        id: 'edge-no',
        source: 'cond-1',
        target: 'action-no',
        sourceHandle: 'source-no',
        targetHandle: 'target-no',
        type: 'bezier',
        label: '否',
        labelStyle: { fill: 'var(--flow-edge-label, #334155)', fontWeight: '600' }
      }
    ]);

    const labelConfig = ref<Partial<FlowConfig>>({
      edges: {
        labelFontSize: 13,
        labelShowBackground: true,
        labelBackgroundPadding: 6,
        labelBackgroundRadius: 4
      }
    });

    const toggleLabelBackground = () => {
      const next = !labelConfig.value.edges?.labelShowBackground;
      labelConfig.value = {
        ...labelConfig.value,
        edges: { ...labelConfig.value.edges, labelShowBackground: next }
      };
      message.info(next ? '已开启标签背景' : '已关闭标签背景');
    };

    const cycleLabelFontSize = () => {
      const sizes = [12, 13, 14, 16];
      const current = labelConfig.value.edges?.labelFontSize ?? 13;
      const idx = sizes.indexOf(current);
      const next = sizes[(idx + 1) % sizes.length];
      labelConfig.value = {
        ...labelConfig.value,
        edges: { ...labelConfig.value.edges, labelFontSize: next }
      };
      message.info(`标签字号: ${next}px`);
    };

    return () => (
      <NCard bordered>
        <NH3 class="border-b pb-2 text-lg font-semibold">Flow 示例：连接线标签</NH3>
        <NText class="mb-3 block text-gray-500">
          在连接线路径中点显示描述文本，常用于分支名、条件说明等。每条边通过{' '}
          <code class="rounded bg-gray-100 px-1">edge.label</code> 配置文字，用{' '}
          <code class="rounded bg-gray-100 px-1">labelStyle</code> /{' '}
          <code class="rounded bg-gray-100 px-1">labelBackgroundStyle</code>{' '}
          覆盖单条样式；全局默认见 <code class="rounded bg-gray-100 px-1">config.edges.label*</code>
          。富文本或图标请注册 <code class="rounded bg-gray-100 px-1">edgeTypes</code>{' '}
          自定义边组件。
        </NText>

        <NSpace class="mb-3" align="center">
          <NButton size="small" onClick={toggleLabelBackground}>
            切换标签背景
          </NButton>
          <NButton size="small" onClick={cycleLabelFontSize}>
            切换字号
          </NButton>
          <NTag size="small" type="info">
            labelShowBackground: {String(labelConfig.value.edges?.labelShowBackground ?? true)}
          </NTag>
          <NTag size="small">labelFontSize: {labelConfig.value.edges?.labelFontSize ?? 13}px</NTag>
        </NSpace>

        <div style={{ height: '280px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <FlowCanvas
            id="edge-label-flow"
            initialNodes={labelNodes.value}
            initialEdges={labelEdges.value}
            config={labelConfig.value}
            width="100%"
            height="100%"
            onEdge-click={(edge: FlowEdge) => {
              message.info(`选中边 ${edge.id}，标签: ${edge.label ?? '（无）'}`);
            }}
          />
        </div>
      </NCard>
    );
  }
});
