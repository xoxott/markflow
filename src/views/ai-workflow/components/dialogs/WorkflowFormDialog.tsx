import type { PropType } from 'vue';
import { computed, defineComponent, watch } from 'vue';
import { NButton, NSpace } from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { WorkflowMetaForm } from '../shared/workflow-meta';
import WorkflowMetaFields from '../shared/WorkflowMetaFields';
import type { WorkflowDialogOptions } from './dialog';

export default defineComponent({
  name: 'WorkflowFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<WorkflowDialogOptions>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const formModel = useSyncedFormModel<WorkflowMetaForm>(
      () => props.config.formData as WorkflowMetaForm,
      {
        sync(model, data) {
          model.name = data.name ?? '';
          model.description = data.description ?? '';
          model.tags = [...(data.tags ?? [])];
          model.status = data.status ?? 'draft';
        }
      }
    );

    const handleClose = () => {
      props.config.onCancel?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? (props.config.isEdit ? $t('common.edit') : '新建工作流'),
      width: props.config.width ?? 520,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      await props.config.onConfirm({
        name: formModel.name,
        description: formModel.description,
        tags: formModel.tags,
        status: formModel.status
      });
      handleClose();
    };

    watch(
      () => props.show,
      show => {
        if (show) {
          formRef.value?.restoreValidation();
        }
      }
    );

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <WorkflowMetaFields
              formRef={formRef}
              model={formModel}
              showStatus={props.config.isEdit}
            />
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleClose}>{$t('common.cancel')}</NButton>
              <NButton type="primary" onClick={handleConfirm}>
                {$t('common.confirm')}
              </NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
