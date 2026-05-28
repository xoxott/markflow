import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import {
  type WorkflowMetaForm,
  cloneWorkflowMetaForm,
  createEmptyWorkflowMetaForm,
  isWorkflowMetaEqual,
  workflowToMetaForm
} from '../shared/workflow-meta';

export interface UseWorkflowMetaOptions {
  workflowId: Ref<string | undefined>;
  updateWorkflow: (
    id: string,
    data: Api.Workflow.UpdateWorkflowRequest
  ) => Promise<{ data: Api.Workflow.Workflow }>;
  onUpdated?: (workflow: Api.Workflow.Workflow) => void;
}

export function useWorkflowMeta(options: UseWorkflowMetaOptions) {
  const message = useMessage();
  const { formRef, validate } = useNaiveForm();

  const metaForm = reactive<WorkflowMetaForm>(createEmptyWorkflowMetaForm());
  const baseline = ref<WorkflowMetaForm>(createEmptyWorkflowMetaForm());
  const isMetaSaving = ref(false);

  const isMetaDirty = computed(() => !isWorkflowMetaEqual(metaForm, baseline.value));

  function syncFromWorkflow(workflow: Api.Workflow.Workflow | null) {
    const next = workflow ? workflowToMetaForm(workflow) : createEmptyWorkflowMetaForm();
    Object.assign(metaForm, next);
    baseline.value = cloneWorkflowMetaForm(next);
  }

  async function saveMeta(): Promise<boolean> {
    if (!options.workflowId.value) return false;

    const isValid = await validate();
    if (!isValid) return false;

    isMetaSaving.value = true;
    try {
      const { data } = await options.updateWorkflow(options.workflowId.value, {
        name: metaForm.name.trim(),
        description: metaForm.description.trim() || undefined,
        tags: metaForm.tags,
        status: metaForm.status
      });
      syncFromWorkflow(data);
      options.onUpdated?.(data);
      message.success('信息已保存');
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '保存失败';
      message.error(msg);
      return false;
    } finally {
      isMetaSaving.value = false;
    }
  }

  return {
    metaForm,
    formRef,
    isMetaDirty,
    isMetaSaving,
    syncFromWorkflow,
    saveMeta
  };
}

export type UseWorkflowMetaReturn = ReturnType<typeof useWorkflowMeta>;
