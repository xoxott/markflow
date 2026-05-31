import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NAlert, NButton, NDatePicker, NForm, NFormItem, NInput, NSelect, NSpace } from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { mapTargetsToPresetOptionsIfAny } from '@/hooks/admin/adminOptionUtils';
import { $t } from '@/locales';
import { AdminRemoteSelect } from '@/components/admin-remote-select';
import BaseDialog from '@/components/base-dialog';
import { createNotificationPriorityOptions, createNotificationTypeOptions } from '../constants';
import type { NotificationFormDialogConfig } from './dialog';

export default defineComponent({
  name: 'NotificationFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<NotificationFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();
    const expiresAtTimestamp = ref<number | null>(null);

    const formModel = useSyncedFormModel(() => props.config.formData, {
      afterSync(_, source) {
        expiresAtTimestamp.value = source.expiresAt ? new Date(source.expiresAt).getTime() : null;
      }
    });

    const typeOptions = computed(() => createNotificationTypeOptions());
    const priorityOptions = computed(() => createNotificationPriorityOptions());

    const formRules = {
      title: [
        {
          required: true,
          message: $t('page.notificationManagement.titleRequired'),
          trigger: 'blur'
        }
      ],
      content: [
        {
          required: true,
          message: $t('page.notificationManagement.contentRequired'),
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
      width: props.config.width ?? 800,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      const submitData = {
        ...formModel,
        expiresAt: expiresAtTimestamp.value ? new Date(expiresAtTimestamp.value).toISOString() : ''
      };
      await props.config.onConfirm(submitData);
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
            <>
              {!props.config.isEdit ? (
                <NAlert type="info" class="mb-16px" showIcon={false}>
                  {$t('page.notificationManagement.createDraftHint')}
                </NAlert>
              ) : null}
              <NForm
                ref={formRef}
                model={formModel}
                rules={formRules}
                labelPlacement="left"
                labelWidth="100px"
              >
                <NFormItem label={$t('page.notificationManagement.title')} path="title">
                  <NInput
                    v-model:value={formModel.title}
                    placeholder={$t('page.notificationManagement.titlePlaceholder')}
                  />
                </NFormItem>
                <NFormItem label={$t('page.notificationManagement.content')} path="content">
                  <NInput
                    v-model:value={formModel.content}
                    type="textarea"
                    placeholder={$t('page.notificationManagement.contentPlaceholder')}
                    rows={6}
                  />
                </NFormItem>
                <NFormItem label={$t('page.notificationManagement.type')} path="type">
                  <NSelect
                    v-model:value={formModel.type}
                    placeholder={$t('page.notificationManagement.typePlaceholder')}
                    options={typeOptions.value}
                  />
                </NFormItem>
                <NFormItem label={$t('page.notificationManagement.priority')} path="priority">
                  <NSelect
                    v-model:value={formModel.priority}
                    placeholder={$t('page.notificationManagement.priorityPlaceholder')}
                    clearable
                    options={priorityOptions.value}
                    style={{ width: '100%' }}
                  />
                </NFormItem>
                <NFormItem
                  label={$t('page.notificationManagement.targetUsers')}
                  path="targetUserIds"
                >
                  <AdminRemoteSelect
                    resource="users"
                    value={formModel.targetUserIds}
                    presetOptions={mapTargetsToPresetOptionsIfAny(props.config.targetUsers)}
                    multiple
                    placeholder={$t('page.notificationManagement.targetUsersPlaceholder')}
                    style={{ width: '100%' }}
                    onUpdate:value={value => {
                      formModel.targetUserIds = (value as number[]) ?? [];
                    }}
                  />
                </NFormItem>
                <NFormItem
                  label={$t('page.notificationManagement.targetRoles')}
                  path="targetRoleIds"
                >
                  <AdminRemoteSelect
                    resource="roles"
                    value={formModel.targetRoleIds}
                    presetOptions={mapTargetsToPresetOptionsIfAny(props.config.targetRoles)}
                    multiple
                    placeholder={$t('page.notificationManagement.targetRolesPlaceholder')}
                    style={{ width: '100%' }}
                    onUpdate:value={value => {
                      formModel.targetRoleIds = (value as number[]) ?? [];
                    }}
                  />
                </NFormItem>
                <NFormItem label={$t('page.notificationManagement.expiresAt')} path="expiresAt">
                  <NDatePicker
                    v-model:value={expiresAtTimestamp.value}
                    type="datetime"
                    placeholder={$t('page.notificationManagement.expiresAtPlaceholder')}
                    clearable
                    style={{ width: '100%' }}
                  />
                </NFormItem>
              </NForm>
            </>
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
