import type { PropType } from 'vue';
import { computed, defineComponent, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSpace, NSwitch } from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { ResourceFormDialogConfig } from './dialog';

const CODE_PATTERN = /^[a-z0-9_-]+$/;

export default defineComponent({
  name: 'ResourceFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<ResourceFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();
    const formModel = useSyncedFormModel(() => props.config.formData);
    const isEdit = computed(() => props.config.isEdit);

    const formRules = {
      code: [
        { required: true, message: $t('page.resourceManagement.codeRequired'), trigger: 'blur' },
        {
          pattern: CODE_PATTERN,
          message: $t('page.resourceManagement.codeInvalid'),
          trigger: 'blur'
        }
      ],
      name: [
        { required: true, message: $t('page.resourceManagement.nameRequired'), trigger: 'blur' }
      ]
    };

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? (props.config.isEdit ? $t('common.edit') : $t('common.add')),
      width: props.config.width ?? 560,
      height: props.config.height ?? 'auto'
    }));

    const handleConfirm = async () => {
      if (!(await validate())) return;
      await props.config.onConfirm({ ...formModel });
      handleClose();
    };

    watch(
      () => props.show,
      show => {
        if (show) formRef.value?.restoreValidation();
      }
    );

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NForm ref={formRef} model={formModel} rules={formRules} labelWidth="100px">
              <NFormItem label={$t('page.resourceManagement.code')} path="code">
                <NInput
                  v-model:value={formModel.code}
                  disabled={isEdit.value}
                  placeholder={$t('page.resourceManagement.codePlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.resourceManagement.name')} path="name">
                <NInput
                  v-model:value={formModel.name}
                  placeholder={$t('page.resourceManagement.namePlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.resourceManagement.description')} path="description">
                <NInput
                  v-model:value={formModel.description}
                  type="textarea"
                  placeholder={$t('page.resourceManagement.descriptionPlaceholder')}
                  rows={3}
                />
              </NFormItem>
              {isEdit.value ? (
                <NFormItem label={$t('page.resourceManagement.status')} path="isActive">
                  <NSwitch v-model:value={formModel.isActive} />
                </NFormItem>
              ) : null}
            </NForm>
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
