import type { PropType } from 'vue';
import { computed, defineComponent, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, NSpace } from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import { createAlertLevelOptions, createAlertTypeOptions } from '../constants';
import type { AlertFormDialogConfig } from './dialog';

export default defineComponent({
  name: 'AlertFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<AlertFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const formModel = useSyncedFormModel(() => props.config.formData);

    const typeOptions = createAlertTypeOptions();
    const levelOptions = createAlertLevelOptions();

    const formRules = {
      title: [
        { required: true, message: $t('page.alertManagement.nameRequired'), trigger: 'blur' }
      ],
      message: [
        { required: true, message: $t('page.alertManagement.messageRequired'), trigger: 'blur' }
      ],
      type: [
        { required: true, message: $t('page.alertManagement.typeRequired'), trigger: 'change' }
      ],
      level: [
        { required: true, message: $t('page.alertManagement.levelRequired'), trigger: 'change' }
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
      width: props.config.width ?? 720,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      await props.config.onConfirm({ ...formModel });
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
          formRef.value?.restoreValidation();
        }
      }
    );

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NForm
              ref={formRef}
              model={formModel}
              rules={formRules}
              labelPlacement="left"
              labelWidth="100px"
            >
              <NFormItem label={$t('page.alertManagement.name')} path="title">
                <NInput
                  v-model:value={formModel.title}
                  placeholder={$t('page.alertManagement.namePlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.alertManagement.message')} path="message">
                <NInput
                  v-model:value={formModel.message}
                  type="textarea"
                  placeholder={$t('page.alertManagement.messagePlaceholder')}
                  rows={4}
                />
              </NFormItem>
              <NFormItem label={$t('page.alertManagement.type')} path="type">
                <NSelect
                  v-model:value={formModel.type}
                  placeholder={$t('page.alertManagement.typePlaceholder')}
                  options={typeOptions}
                />
              </NFormItem>
              <NFormItem label={$t('page.alertManagement.level')} path="level">
                <NSelect
                  v-model:value={formModel.level}
                  placeholder={$t('page.alertManagement.levelPlaceholder')}
                  options={levelOptions}
                />
              </NFormItem>
              <NFormItem label={$t('page.alertManagement.source')} path="source">
                <NInput
                  v-model:value={formModel.source}
                  placeholder={$t('page.alertManagement.sourcePlaceholder')}
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
