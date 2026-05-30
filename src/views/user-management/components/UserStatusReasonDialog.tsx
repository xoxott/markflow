import type { PropType } from 'vue';
import { computed, defineComponent, ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSpace, NText } from 'naive-ui';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { UserStatusReasonDialogConfig } from './dialog';

export default defineComponent({
  name: 'UserStatusReasonDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<UserStatusReasonDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const reason = ref('');

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? $t('page.userManagement.deactivate'),
      width: props.config.width ?? 480,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const trimmed = reason.value.trim();
      const succeeded = await props.config.onConfirm(trimmed || undefined);
      if (succeeded !== true) return;
      handleClose();
    };

    const handleCancel = () => {
      props.config.onCancel?.();
      handleClose();
    };

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NForm labelPlacement="left" labelWidth="80px">
              {props.config.description && (
                <div class="mb-12px text-13px text-gray-600 leading-relaxed dark:text-gray-400">
                  {props.config.description}
                </div>
              )}
              <NFormItem
                label={props.config.reasonLabel ?? $t('page.userManagement.statusReasonLabel')}
              >
                <NInput
                  v-model:value={reason.value}
                  type="textarea"
                  rows={3}
                  placeholder={
                    props.config.reasonPlaceholder ??
                    $t('page.userManagement.statusReasonPlaceholder')
                  }
                />
              </NFormItem>
              {props.config.userCount && props.config.userCount > 1 && (
                <NText depth={3} class="text-12px">
                  {$t('page.userManagement.batchStatusReasonHint', {
                    count: props.config.userCount
                  })}
                </NText>
              )}
            </NForm>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleCancel}>{$t('common.cancel')}</NButton>
              <NButton type={props.config.confirmType ?? 'warning'} onClick={handleConfirm}>
                {$t('common.confirm')}
              </NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
