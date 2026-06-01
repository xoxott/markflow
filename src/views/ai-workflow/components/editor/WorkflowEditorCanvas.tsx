/**
 * AI 工作流编辑器画布
 *
 * 基于项目内 Flow 组件，仅承载工作流领域逻辑（拖拽落点、校验、持久化映射）
 */

import '../styles/workflow-flow-nodes.scss';

import { type PropType, defineComponent, ref, watch } from 'vue';
import { FlowCanvas } from '@/components/flow';
import type { UseWorkflowEditorReturn } from '../hooks/useWorkflowEditor';
import type { WorkflowFlowCanvasExpose } from '../types/workflow-node-data';
import WorkflowFlowOverlays from './WorkflowFlowOverlays';
import WorkflowContextMenu from './WorkflowContextMenu';
import { WORKFLOW_FLOW_CONFIG } from './workflow-flow-config';

export default defineComponent({
  name: 'WorkflowEditorCanvas',
  props: {
    editor: {
      type: Object as PropType<UseWorkflowEditorReturn>,
      required: true
    },
    workflowId: {
      type: Number,
      default: undefined
    },
    config: {
      type: Object as PropType<Api.Workflow.WorkflowConfig>,
      required: true
    }
  },
  setup(props, { expose }) {
    const flowCanvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null);
    const dropZoneRef = ref<HTMLElement | null>(null);
    const editor = props.editor;

    watch(
      flowCanvasRef,
      inst => {
        if (inst) editor.bindCanvas(inst as unknown as WorkflowFlowCanvasExpose);
      },
      { immediate: true }
    );

    expose({
      getWorkflowConfig: editor.getWorkflowConfig,
      validate: editor.validate,
      save: editor.save,
      fitView: editor.fitView,
      updateNode: editor.updateNode
    });

    return () => {
      const { nodes, edges, viewport } = editor.initialFlowState.value;

      return (
        <div class="workflow-editor-canvas h-full min-h-0 flex flex-col">
          <div
            ref={dropZoneRef}
            class="workflow-editor-canvas__stage relative min-h-0 flex-1"
            onDragover={editor.handleDragOver}
            onDrop={e => editor.handleDrop(e, dropZoneRef.value)}
          >
            <FlowCanvas
              ref={flowCanvasRef}
              id={`workflow-${props.workflowId ?? 'draft'}`}
              class="h-full w-full"
              config={WORKFLOW_FLOW_CONFIG}
              clipboardShortcuts={false}
              initialNodes={nodes}
              initialEdges={edges}
              initialViewport={viewport}
              width="100%"
              height="100%"
              onNode-click={editor.handleNodeClick}
              onConnect={editor.handleConnect}
              onViewport-change={editor.handleViewportChange}
              onNodes-change={() => editor.markDirty()}
            >
              <WorkflowFlowOverlays editor={editor} onFitView={editor.fitView} />
              <WorkflowContextMenu editor={editor} />
            </FlowCanvas>
          </div>
        </div>
      );
    };
  }
});
