/**
 * AI 工作流编辑器画布
 *
 * 基于项目内 Flow 组件，仅承载工作流领域逻辑（拖拽落点、校验、持久化映射）
 */

import '../styles/workflow-flow-nodes.scss';

import { type PropType, defineComponent, ref, watch } from 'vue';
import { FlowCanvas, type FlowConfig } from '@/components/flow';
import { readExposedBool } from '@/components/flow/internal';
import { type UseWorkflowEditorOptions, useWorkflowEditor } from '../hooks/useWorkflowEditor';
import type { WorkflowFlowCanvasExpose } from '../types/workflow-node-data';
import WorkflowCanvasOverlays from './WorkflowCanvasOverlays';
import WorkflowEditorToolbar from './WorkflowEditorToolbar';

const WORKFLOW_FLOW_CONFIG: Partial<FlowConfig> = {
  canvas: {
    showGrid: true,
    gridType: 'dots',
    gridSize: 20,
    panOnDrag: true,
    zoomOnScroll: true,
    fitViewPadding: 0.2
  },
  nodes: {
    defaultWidth: 220,
    defaultHeight: 72,
    elevateOnDragEnd: true
  },
  edges: {
    defaultType: 'bezier',
    animated: false,
    renderBehindNodes: true
  },
  interaction: {
    enableMultiSelection: true,
    multiSelectKey: 'ctrl',
    enableBoxSelection: true,
    boxSelectionKey: 'shift'
  },
  performance: {
    enableViewportCulling: true,
    maxHistorySize: 80
  }
};

export default defineComponent({
  name: 'WorkflowEditorCanvas',
  props: {
    workflowId: {
      type: String,
      default: undefined
    },
    definition: {
      type: Object as PropType<Api.Workflow.WorkflowDefinition>,
      required: true
    },
    onSave: {
      type: Function as PropType<
        (definition: Api.Workflow.WorkflowDefinition) => void | Promise<void>
      >,
      default: undefined
    },
    onNodeSelect: {
      type: Function as PropType<(node: Api.Workflow.WorkflowNode | null) => void>,
      default: undefined
    }
  },
  setup(props, { expose }) {
    const flowCanvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null);
    const dropZoneRef = ref<HTMLElement | null>(null);

    const workflowIdRef = ref(props.workflowId);
    const definitionRef = ref(props.definition);

    watch(
      () => props.definition,
      v => {
        definitionRef.value = v;
      },
      { deep: true }
    );
    watch(
      () => props.workflowId,
      v => {
        workflowIdRef.value = v;
      }
    );

    const editorOptions: UseWorkflowEditorOptions = {
      workflowId: workflowIdRef,
      definition: definitionRef,
      onSave: props.onSave,
      onNodeSelect: props.onNodeSelect
    };

    const editor = useWorkflowEditor(editorOptions);

    watch(
      flowCanvasRef,
      inst => {
        if (inst) editor.bindCanvas(inst as unknown as WorkflowFlowCanvasExpose);
      },
      { immediate: true }
    );

    expose({
      getDefinition: editor.getDefinition,
      validate: editor.validate,
      save: editor.save,
      fitView: editor.fitView,
      updateNode: editor.updateNode
    });

    return () => {
      const { nodes, edges, viewport } = editor.initialFlowState.value;
      const canvasExpose = flowCanvasRef.value as unknown as WorkflowFlowCanvasExpose | null;

      return (
        <div class="workflow-editor-canvas h-full min-h-0 flex flex-col">
          <WorkflowEditorToolbar
            isDirty={editor.isDirty.value}
            isSaving={editor.isSaving.value}
            canUndo={readExposedBool(canvasExpose?.canUndo)}
            canRedo={readExposedBool(canvasExpose?.canRedo)}
            lastValidation={editor.lastValidation.value}
            onSave={editor.save}
            onValidate={editor.validate}
            onUndo={editor.undo}
            onRedo={editor.redo}
            onFitView={editor.fitView}
            onClear={editor.clearCanvas}
          />

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
              initialNodes={nodes}
              initialEdges={edges}
              initialViewport={viewport}
              width="100%"
              height="100%"
              onNode-click={editor.handleNodeClick}
              onConnect={editor.handleConnect}
              onViewport-change={editor.handleViewportChange}
              v-slots={{
                default: () => <WorkflowCanvasOverlays onFitView={editor.fitView} />
              }}
            />
          </div>
        </div>
      );
    };
  }
});
