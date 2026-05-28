import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { mockWorkflowApi } from '@/service/api/workflow-mock';
import { readExposedBool } from '@/components/flow/internal';
import {
  NodeConfigPanel,
  NodeLibraryPanel,
  WorkflowEditorCanvas,
  type WorkflowEditorCanvasExpose
} from '../components';
import WorkflowEditorHeader from '../components/editor/WorkflowEditorHeader';
import WorkflowEditorWorkspace from '../components/editor/WorkflowEditorWorkspace';
import { useWorkflowEditor } from '../components/hooks/useWorkflowEditor';

const { fetchWorkflowDetail, fetchUpdateWorkflow } = mockWorkflowApi;

export default defineComponent({
  name: 'WorkflowEditor',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();

    const workflowId = computed(() => route.params.id as string);
    const workflow = ref<Api.Workflow.Workflow | null>(null);
    const loading = ref(true);
    const showLeftPanel = ref(true);
    const showRightPanel = ref(false);
    const selectedNode = ref<Api.Workflow.WorkflowNode | null>(null);
    const canvasRef = ref<WorkflowEditorCanvasExpose | null>(null);

    const definition = computed(
      () =>
        workflow.value?.definition ?? {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        }
    );

    async function handleSave(definitionPayload: Api.Workflow.WorkflowDefinition) {
      if (!workflowId.value) return;

      try {
        await fetchUpdateWorkflow(workflowId.value, { definition: definitionPayload });
        message.success('保存成功');
        if (workflow.value) {
          workflow.value.definition = definitionPayload;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '保存失败';
        message.error(msg);
        throw error;
      }
    }

    function handleNodeSelect(node: Api.Workflow.WorkflowNode | null) {
      selectedNode.value = node;
      showRightPanel.value = Boolean(node);
    }

    const editor = useWorkflowEditor({
      workflowId,
      definition,
      onSave: handleSave,
      onNodeSelect: handleNodeSelect
    });

    async function loadWorkflow() {
      if (!workflowId.value) return;

      loading.value = true;
      try {
        const { data } = await fetchWorkflowDetail(workflowId.value);
        workflow.value = data;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '加载失败';
        message.error(`加载工作流失败: ${msg}`);
        router.push('/ai-workflow');
      } finally {
        loading.value = false;
      }
    }

    async function handleNodeUpdate(nodeId: string, updates: Partial<Api.Workflow.WorkflowNode>) {
      editor.updateNode(nodeId, updates);
      if (selectedNode.value?.id === nodeId) {
        Object.assign(selectedNode.value, updates);
      }
      message.success('节点配置已更新（记得保存工作流）');
    }

    function handleBack() {
      router.push('/ai-workflow');
    }

    watch(selectedNode, node => {
      if (!node) showRightPanel.value = false;
    });

    onMounted(() => {
      loadWorkflow();
    });

    const canUndo = computed(() => readExposedBool(editor.canvasRef.value?.canUndo));
    const canRedo = computed(() => readExposedBool(editor.canvasRef.value?.canRedo));

    return () => (
      <div class="workflow-editor h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        <WorkflowEditorHeader
          title={workflow.value?.name || '工作流编辑器'}
          description={workflow.value?.description}
          showLeftPanel={showLeftPanel.value}
          showRightPanel={showRightPanel.value}
          isDirty={editor.isDirty.value}
          isSaving={editor.isSaving.value}
          canUndo={canUndo.value}
          canRedo={canRedo.value}
          lastValidation={editor.lastValidation.value}
          onBack={handleBack}
          onToggleLeftPanel={() => {
            showLeftPanel.value = !showLeftPanel.value;
          }}
          onToggleRightPanel={() => {
            showRightPanel.value = !showRightPanel.value;
          }}
          onSave={editor.save}
          onValidate={editor.validate}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onFitView={editor.fitView}
          onClear={editor.clearCanvas}
        />

        <div class="min-h-0 flex flex-1 overflow-hidden">
          <WorkflowEditorWorkspace
            loading={loading.value}
            showLeftPanel={showLeftPanel.value}
            showRightPanel={showRightPanel.value}
          >
            {{
              left: () => <NodeLibraryPanel />,
              default: () => (
                <WorkflowEditorCanvas
                  ref={canvasRef}
                  editor={editor}
                  workflowId={workflowId.value}
                  definition={definition.value}
                />
              ),
              right: () => (
                <NodeConfigPanel
                  node={selectedNode.value}
                  onUpdate={handleNodeUpdate}
                  onClose={() => {
                    showRightPanel.value = false;
                  }}
                />
              )
            }}
          </WorkflowEditorWorkspace>
        </div>
      </div>
    );
  }
});
