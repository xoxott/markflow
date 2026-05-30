import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NSpace } from 'naive-ui';
import { buildPresetOptionsFromTargets } from '@/hooks/admin/adminOptionUtils';
import { $t } from '@/locales';
import { AdminRemoteSelect } from '@/components/admin-remote-select';
import BaseDialog from '@/components/base-dialog';
import type { UserRoleDialogConfig } from './dialog';

export default defineComponent({
  name: 'UserRoleDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<UserRoleDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const roleIds = ref<number[]>([...props.config.roleIds]);

    watch(
      () => props.config.roleIds,
      ids => {
        roleIds.value = [...ids];
      },
      { immediate: true }
    );

    const rolePresetOptions = computed(() =>
      buildPresetOptionsFromTargets(roleIds.value, props.config.roles)
    );

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title:
        props.config.title ?? `${$t('page.userManagement.assignRoles')} - ${props.config.username}`,
      width: props.config.width ?? 520,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const succeeded = await props.config.onConfirm([...roleIds.value]);
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
              <NFormItem label={$t('page.userManagement.role')}>
                <AdminRemoteSelect
                  resource="roles"
                  value={roleIds.value}
                  presetOptions={rolePresetOptions.value}
                  multiple
                  placeholder={$t('page.userManagement.rolePlaceholder')}
                  style={{ width: '100%' }}
                  onUpdate:value={value => {
                    roleIds.value = (value as number[]) ?? [];
                  }}
                />
              </NFormItem>
              <div class="text-12px text-gray-500">{$t('page.userManagement.reloginHint')}</div>
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
