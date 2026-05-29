import type { PropType } from 'vue';
import { computed, defineComponent, ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { BlacklistReasonDialogConfig } from './dialog';

export default defineComponent({
  name: 'BlacklistReasonDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<BlacklistReasonDialogConfig>,
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
      title: props.config.title ?? $t('page.userManagement.blacklist'),
      width: props.config.width ?? 480,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      if (!reason.value.trim()) return;
      const succeeded = await props.config.onConfirm(reason.value.trim());
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
              <NFormItem label={$t('page.userManagement.blacklistReasonLabel')}>
                <NInput
                  v-model:value={reason.value}
                  type="textarea"
                  rows={3}
                  placeholder={$t('page.userManagement.blacklistReasonPlaceholder')}
                />
              </NFormItem>
              {props.config.userCount > 1 && (
                <div class="text-12px text-gray-500">
                  {$t('page.userManagement.batchBlacklistHint', { count: props.config.userCount })}
                </div>
              )}
            </NForm>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleCancel}>{$t('common.cancel')}</NButton>
              <NButton type="error" disabled={!reason.value.trim()} onClick={handleConfirm}>
                {$t('common.confirm')}
              </NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
