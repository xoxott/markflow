import type { PropType } from 'vue';
import { computed, defineComponent, reactive, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NInputNumber, NSpace } from 'naive-ui';
import { REG_ROLE_CODE } from '@/constants/reg';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { RoleFormDialogConfig } from './dialog';

const DEFAULT_ROLE_LEVEL = 999;

export default defineComponent({
  name: 'RoleFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<RoleFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const formModel = reactive({ ...props.config.formData });

    watch(
      () => props.config.formData,
      newData => {
        Object.assign(formModel, newData);
      },
      { deep: true, immediate: true }
    );

    const formRules = {
      name: [
        { required: true, message: $t('page.roleManagement.nameRequired' as any), trigger: 'blur' },
        {
          min: 2,
          max: 100,
          message: $t('page.roleManagement.nameLengthInvalid' as any),
          trigger: 'blur'
        }
      ],
      code: [
        { required: true, message: $t('page.roleManagement.codeRequired' as any), trigger: 'blur' },
        {
          pattern: REG_ROLE_CODE,
          message: $t('page.roleManagement.codeInvalid' as any),
          trigger: 'blur'
        }
      ],
      level: [
        {
          type: 'number',
          min: 0,
          max: 999,
          message: $t('page.roleManagement.levelInvalid' as any),
          trigger: 'blur'
        }
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
      width: props.config.width ?? 600,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      await props.config.onConfirm({
        ...formModel,
        code: formModel.code.trim().toLowerCase(),
        name: formModel.name.trim(),
        level: formModel.level ?? DEFAULT_ROLE_LEVEL
      });
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
              <NFormItem label={$t('page.roleManagement.name' as any)} path="name">
                <NInput
                  v-model:value={formModel.name}
                  placeholder={$t('page.roleManagement.namePlaceholder' as any)}
                />
              </NFormItem>
              <NFormItem label={$t('page.roleManagement.code' as any)} path="code">
                <NInput
                  v-model:value={formModel.code}
                  placeholder={$t('page.roleManagement.codePlaceholder' as any)}
                  disabled={props.config.isEdit}
                />
              </NFormItem>
              <NFormItem label={$t('page.roleManagement.level' as any)} path="level">
                <NInputNumber
                  v-model:value={formModel.level}
                  min={0}
                  max={999}
                  placeholder={$t('page.roleManagement.levelPlaceholder' as any)}
                  style={{ width: '100%' }}
                />
              </NFormItem>
              <NFormItem label={$t('page.roleManagement.description' as any)} path="description">
                <NInput
                  v-model:value={formModel.description}
                  type="textarea"
                  placeholder={$t('page.roleManagement.descriptionPlaceholder' as any)}
                  rows={3}
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
