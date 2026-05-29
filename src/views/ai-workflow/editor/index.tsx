import {
  computed,
  defineComponent,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { fetchUpdateWorkflow, fetchWorkflowDetail } from '@/service/api/workflow';
import { readExposedBool } from '@/components/flow/internal';
import { useDialog } from '@/components/base-dialog/useDialog';
import {
  NodeConfigPanel,
  NodeLibraryPanel,
  WorkflowEditorCanvas,
  type WorkflowEditorCanvasExpose
} from '../components';
import WorkflowEditorHeader from '../components/editor/WorkflowEditorHeader';
import WorkflowEditorWorkspace from '../components/editor/WorkflowEditorWorkspace';
import { useWorkflowEditor } from '../components/hooks/useWorkflowEditor';
import { useWorkflowMeta } from '../components/hooks/useWorkflowMeta';
import { definitionToFlowState } from '../components/adapters/flow-adapter';

export default defineComponent({
  name: 'WorkflowEditor',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);

    const workflowId = computed(() => route.params.id as string);
    const workflow = ref<Api.Workflow.Workflow | null>(null);
    const loading = ref(true);
    const showLeftPanel = ref(true);
    const showRightPanel = ref(false);
    const selectedNode = ref<Api.Workflow.WorkflowNode | null>(null);
    const canvasRef = ref<WorkflowEditorCanvasExpose | null>(null);
    const importInputRef = ref<HTMLInputElement | null>(null);

    const definition = computed(
      () =>
        workflow.value?.definition ?? {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        }
    );

    const meta = useWorkflowMeta({
      workflowId,
      updateWorkflow: fetchUpdateWorkflow,
      onUpdated: updated => {
        workflow.value = updated;
      }
    });

    async function handleSave(definitionPayload: Api.Workflow.WorkflowDefinition) {
      if (!workflowId.value) return;

      try {
        await fetchUpdateWorkflow(workflowId.value, { definition: definitionPayload });
        message.success('画布已保存');
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
        meta.syncFromWorkflow(data);
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
      message.success('节点配置已更新（记得保存画布）');
    }

    async function confirmLeaveIfDirty(): Promise<boolean> {
      if (!meta.isMetaDirty.value && !editor.isDirty.value) {
        return true;
      }

      return new Promise(resolve => {
        dialog.confirm({
          title: '未保存的修改',
          content: '当前有未保存的工作流信息或画布修改，确定要离开吗？',
          confirmText: '离开',
          cancelText: '留下',
          type: 'warning',
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false)
        });
      });
    }

    function handleBack() {
      router.push('/ai-workflow');
    }

    function downloadJSON(filename: string, content: unknown) {
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function handleExport() {
      const def = editor.getDefinition();
      if (!def) {
        message.warning('画布未就绪，无法导出');
        return;
      }
      const name = meta.metaForm.name.trim() || workflow.value?.name?.trim() || 'workflow';
      const id = workflowId.value || 'draft';
      downloadJSON(`${name}-${id}.json`, def);
      message.success('已导出 JSON');
    }

    function handleImportClick() {
      importInputRef.value?.click();
    }

    async function handleImportFile(e: Event) {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Api.Workflow.WorkflowDefinition;

        if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).nodes)) {
          message.error('导入失败：JSON 不是合法的工作流定义');
          return;
        }

        const api = editor.canvasRef.value;
        if (!api?.importJSON) {
          message.warning('画布未就绪，无法导入');
          return;
        }

        const state = definitionToFlowState(parsed);
        const snapshot = {
          version: 1,
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport
        };
        const ok = api.importJSON(snapshot, { replace: true, includeViewport: true });
        if (!ok) {
          message.error('导入失败：解析 Flow 快照失败');
          return;
        }
        editor.markDirty();
        message.success('导入成功（记得保存画布）');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '未知错误';
        message.error(`导入失败：${msg}`);
      }
    }

    function handleEditorKeydown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's' || !e.shiftKey) return;
      e.preventDefault();
      if (meta.isMetaDirty.value) {
        meta.saveMeta();
      }
    }

    watch(selectedNode, node => {
      if (!node) showRightPanel.value = false;
    });

    onBeforeRouteLeave(async (_to, _from, next) => {
      const canLeave = await confirmLeaveIfDirty();
      next(canLeave);
    });

    onMounted(() => {
      loadWorkflow();
      window.addEventListener('keydown', handleEditorKeydown);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleEditorKeydown);
    });

    const canUndo = computed(() => readExposedBool(editor.canvasRef.value?.canUndo));
    const canRedo = computed(() => readExposedBool(editor.canvasRef.value?.canRedo));

    return () => (
      <div class="workflow-editor h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          class="hidden"
          onChange={handleImportFile}
        />
        <WorkflowEditorHeader
          title={meta.metaForm.name || workflow.value?.name || '工作流编辑器'}
          description={meta.metaForm.description || workflow.value?.description}
          metaForm={meta.metaForm}
          metaFormRef={meta.formRef}
          isMetaDirty={meta.isMetaDirty.value}
          isMetaSaving={meta.isMetaSaving.value}
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
          onSaveMeta={meta.saveMeta}
          onSave={editor.save}
          onValidate={editor.validate}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onFitView={editor.fitView}
          showMinimap={editor.showMinimap.value}
          onToggleMinimap={editor.toggleMinimap}
          onClear={editor.clearCanvas}
          onImport={handleImportClick}
          onExport={handleExport}
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
