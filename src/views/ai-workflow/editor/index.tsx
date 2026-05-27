import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NIcon, NSpace, useMessage } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { mockWorkflowApi } from '@/service/api/workflow-mock';
import WorkflowEditorCanvas from '@/components/ai-workflow/editor/WorkflowEditorCanvas';
import NodeLibraryPanel from '@/components/ai-workflow/panels/NodeLibraryPanel';
import NodeConfigPanel from '@/components/ai-workflow/panels/NodeConfigPanel';
import type { WorkflowEditorCanvasExpose } from '@/components/ai-workflow/types/workflow-node-data';

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
    const saving = ref(false);
    const showLeftPanel = ref(true);
    const showRightPanel = ref(false);
    const selectedNode = ref<Api.Workflow.WorkflowNode | null>(null);
    const canvasRef = ref<WorkflowEditorCanvasExpose | null>(null);

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

    async function handleSave(definition: Api.Workflow.WorkflowDefinition) {
      if (!workflowId.value) return;

      saving.value = true;
      try {
        await fetchUpdateWorkflow(workflowId.value, { definition });
        message.success('保存成功');
        if (workflow.value) {
          workflow.value.definition = definition;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '保存失败';
        message.error(msg);
        throw error;
      } finally {
        saving.value = false;
      }
    }

    function handleNodeSelect(node: Api.Workflow.WorkflowNode | null) {
      selectedNode.value = node;
      showRightPanel.value = Boolean(node);
    }

    function handleNodeUpdate(nodeId: string, updates: Partial<Api.Workflow.WorkflowNode>) {
      canvasRef.value?.updateNode(nodeId, updates);
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

    const definition = computed(
      () =>
        workflow.value?.definition ?? {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        }
    );

    return () => (
      <div class="workflow-editor h-full flex flex-col from-gray-50 to-gray-100 bg-gradient-to-br dark:from-gray-900 dark:to-gray-950">
        <div class="flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
          <div class="flex items-center gap-4">
            <NButton
              text
              onClick={handleBack}
              class="rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <NIcon size={22}>
                <Icon icon="mdi:arrow-left" />
              </NIcon>
            </NButton>
            <div class="h-8 border-l border-gray-300 dark:border-gray-600" />
            <div>
              <h2 class="text-xl text-gray-800 font-semibold dark:text-gray-100">
                {workflow.value?.name || '工作流编辑器'}
              </h2>
              {workflow.value?.description && (
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {workflow.value.description}
                </p>
              )}
            </div>
          </div>

          <NSpace size="small">
            <NButton
              secondary
              size="small"
              onClick={() => {
                showLeftPanel.value = !showLeftPanel.value;
              }}
            >
              <NIcon class="mr-1">
                <Icon icon={showLeftPanel.value ? 'mdi:dock-left' : 'mdi:dock-window'} />
              </NIcon>
              {showLeftPanel.value ? '隐藏节点库' : '显示节点库'}
            </NButton>
            <NButton
              secondary
              size="small"
              onClick={() => {
                showRightPanel.value = !showRightPanel.value;
              }}
            >
              <NIcon class="mr-1">
                <Icon icon={showRightPanel.value ? 'mdi:dock-right' : 'mdi:dock-window'} />
              </NIcon>
              {showRightPanel.value ? '隐藏配置' : '显示配置'}
            </NButton>
          </NSpace>
        </div>

        <div class="min-h-0 flex flex-1 overflow-hidden">
          {loading.value ? (
            <div class="flex flex-1 items-center justify-center text-gray-500">加载中…</div>
          ) : (
            <div class="h-full w-full flex">
              {showLeftPanel.value && (
                <div
                  class="flex flex-col overflow-hidden border-r border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95"
                  style={{ flexShrink: 0 }}
                >
                  <NodeLibraryPanel />
                </div>
              )}

              <div class="h-full min-w-0 flex-1 overflow-hidden">
                <WorkflowEditorCanvas
                  ref={canvasRef}
                  workflowId={workflowId.value}
                  definition={definition.value}
                  onSave={handleSave}
                  onNodeSelect={handleNodeSelect}
                />
              </div>

              {showRightPanel.value && (
                <div
                  class="w-96 flex flex-col overflow-hidden border-l border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95"
                  style={{ flexShrink: 0 }}
                >
                  <NodeConfigPanel
                    node={selectedNode.value}
                    onUpdate={handleNodeUpdate}
                    onClose={() => {
                      showRightPanel.value = false;
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
});
