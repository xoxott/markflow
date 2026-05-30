import type { PropType } from 'vue';
import { defineComponent, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NSpace, NTag } from 'naive-ui';
import { DIALOG_OVER_DRAWER_Z_INDEX } from '@/constants/overlay-z-index';
import { $t } from '@/locales';
import { AdminRemoteSelect } from '@/components/admin-remote-select';
import BaseDialog from '@/components/base-dialog';
import type { UserDirectPermissionDialogConfig } from './dialog';

export default defineComponent({
  name: 'UserDirectPermissionDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<UserDirectPermissionDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const permissionIds = ref<number[]>([]);

    watch(
      () => props.show,
      show => {
        if (show) {
          permissionIds.value = [];
        }
      }
    );

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title:
        props.config.title ??
        `${$t('page.userManagement.assignDirectPermissions')} - ${props.config.username}`,
      width: props.config.width ?? 520,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false,
      zIndex: props.config.zIndex ?? DIALOG_OVER_DRAWER_Z_INDEX
    }));

    const handleConfirm = async () => {
      if (permissionIds.value.length === 0) {
        handleClose();
        return;
      }
      const succeeded = await props.config.onConfirm([...permissionIds.value]);
      if (succeeded !== true) return;
      handleClose();
    };

    const handleCancel = () => {
      props.config.onCancel?.();
      handleClose();
    };

    return () => {
      const assigned = props.config.assignedDirectPermissions ?? [];

      return (
        <BaseDialog show={props.show} config={dialogConfig.value}>
          {{
            default: () => (
              <NForm labelPlacement="left" labelWidth="80px">
                {assigned.length > 0 ? (
                  <NFormItem label={$t('page.userManagement.assignedDirectPermissions')}>
                    <NSpace size="small" wrap>
                      {assigned.map(item => (
                        <NTag key={item.permissionId} size="small" type="warning" round>
                          {item.name}
                        </NTag>
                      ))}
                    </NSpace>
                  </NFormItem>
                ) : null}
                <NFormItem label={$t('page.userManagement.addDirectPermissions')}>
                  <AdminRemoteSelect
                    resource="permissions"
                    value={permissionIds.value}
                    multiple
                    placeholder={$t('page.roleManagement.permissionsPlaceholder')}
                    style={{ width: '100%' }}
                    onUpdate:value={value => {
                      permissionIds.value = (value as number[]) ?? [];
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
    };
  }
});
