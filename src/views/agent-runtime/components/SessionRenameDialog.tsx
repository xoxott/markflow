import { type PropType, computed, defineComponent, reactive, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { SessionRenameDialogConfig } from './dialog';

export default defineComponent({
  name: 'SessionRenameDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<SessionRenameDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const formModel = reactive({
      title: props.config.session.title ?? ''
    });

    watch(
      () => props.config.session,
      session => {
        formModel.title = session.title ?? '';
      },
      { immediate: true }
    );

    const formRules = {
      title: [{ required: true, message: '请填写标题', trigger: 'blur' }]
    };

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? '重命名会话',
      width: props.config.width ?? 420,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      await props.config.onConfirm(formModel.title.trim());
      handleClose();
    };

    const handleCancel = () => {
      props.config.onCancel?.();
      handleClose();
    };

    watch(
      () => props.show,
      show => {
        if (show) {
          formModel.title = props.config.session.title ?? '';
          formRef.value?.restoreValidation();
        }
      }
    );

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NForm ref={formRef} model={formModel} rules={formRules} labelPlacement="top">
              <NFormItem label="标题" path="title">
                <NInput
                  v-model:value={formModel.title}
                  placeholder="会话标题"
                  onKeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') handleConfirm();
                  }}
                />
              </NFormItem>
            </NForm>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleCancel}>{$t('common.cancel')}</NButton>
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
