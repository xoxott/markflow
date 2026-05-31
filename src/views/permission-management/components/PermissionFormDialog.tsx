import type { PropType } from 'vue';
import { computed, defineComponent, watch } from 'vue';
import { type FormRules, NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui';
import { fetchResourceDetail } from '@/service/api/resource';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import { ResourceSelect } from '@/components/resource-select';
import { PermissionFacetSelect } from '@/components/permission-facet-select';
import BaseDialog from '@/components/base-dialog';
import { buildPermissionCode } from '../utils/permissionCode';
import type { PermissionFormDialogConfig } from './dialog';

const ACTION_PATTERN = /^[a-z0-9_-]+$/;

export default defineComponent({
  name: 'PermissionFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<PermissionFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const formModel = useSyncedFormModel(() => props.config.formData);

    watch(
      () => formModel.resourceId,
      async (resourceId, previousResourceId) => {
        if (previousResourceId !== undefined && resourceId !== previousResourceId) {
          formModel.action = '';
        }
        if (!resourceId) {
          formModel.resource = '';
          return;
        }
        const { data } = await fetchResourceDetail(resourceId);
        formModel.resource = data?.code ?? '';
      }
    );

    watch(
      () => [formModel.resource, formModel.action] as const,
      ([resource, action]) => {
        if (!props.config.isEdit && resource && action) {
          formModel.code = buildPermissionCode(resource, action);
        }
      }
    );

    const formRules: FormRules = {
      name: [
        {
          required: true,
          message: $t('page.permissionManagement.nameRequired' as any),
          trigger: 'blur'
        }
      ],
      resourceId: [
        {
          required: true,
          type: 'number' as const,
          message: $t('page.permissionManagement.resourceRequired' as any),
          trigger: 'change'
        }
      ],
      action: [
        {
          required: true,
          message: $t('page.permissionManagement.actionRequired' as any),
          trigger: 'change'
        },
        {
          pattern: ACTION_PATTERN,
          message: $t('page.permissionManagement.actionInvalid' as any),
          trigger: 'change'
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
      width: props.config.width ?? 700,
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

    const isEdit = computed(() => props.config.isEdit);

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
              <NFormItem label={$t('page.permissionManagement.name' as any)} path="name">
                <NInput
                  v-model:value={formModel.name}
                  placeholder={$t('page.permissionManagement.namePlaceholder' as any)}
                />
              </NFormItem>
              {isEdit.value ? (
                <NFormItem label={$t('page.permissionManagement.resource' as any)} path="resource">
                  <NInput value={formModel.resource} disabled />
                </NFormItem>
              ) : (
                <NFormItem
                  label={$t('page.permissionManagement.resource' as any)}
                  path="resourceId"
                >
                  <ResourceSelect
                    value={formModel.resourceId}
                    placeholder={$t('page.permissionManagement.resourcePlaceholder' as any)}
                    onUpdate:value={value => {
                      formModel.resourceId = value;
                    }}
                  />
                </NFormItem>
              )}
              <NFormItem label={$t('page.permissionManagement.action' as any)} path="action">
                {isEdit.value ? (
                  <NInput value={formModel.action} disabled />
                ) : (
                  <PermissionFacetSelect
                    facet="actions"
                    resource={formModel.resource || null}
                    value={formModel.action || null}
                    placeholder={$t('page.permissionManagement.actionPlaceholder' as any)}
                    onUpdate:value={value => {
                      formModel.action = value ?? '';
                    }}
                  />
                )}
              </NFormItem>
              <NFormItem label={$t('page.permissionManagement.code' as any)} path="code">
                <NInput
                  v-model:value={formModel.code}
                  placeholder={$t('page.permissionManagement.codePlaceholder' as any)}
                  disabled
                />
              </NFormItem>
              <NFormItem
                label={$t('page.permissionManagement.description' as any)}
                path="description"
              >
                <NInput
                  v-model:value={formModel.description}
                  type="textarea"
                  placeholder={$t('page.permissionManagement.descriptionPlaceholder' as any)}
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
