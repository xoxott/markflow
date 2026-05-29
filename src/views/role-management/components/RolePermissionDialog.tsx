import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NSpace, NTreeSelect } from 'naive-ui';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { RolePermissionDialogConfig } from './dialog';

export default defineComponent({
  name: 'RolePermissionDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<RolePermissionDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const permissionIds = ref<number[]>([...props.config.permissionIds]);

    watch(
      () => props.config.permissionIds,
      ids => {
        permissionIds.value = [...ids];
      },
      { immediate: true }
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
        `${$t('page.roleManagement.assignPermissions')} - ${props.config.roleName}`,
      width: props.config.width ?? 640,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      await props.config.onConfirm([...permissionIds.value]);
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
              <NFormItem label={$t('page.roleManagement.permissions')}>
                <NTreeSelect
                  v-model:value={permissionIds.value}
                  multiple
                  checkable
                  cascade
                  filterable
                  clearable
                  maxTagCount="responsive"
                  placeholder={$t('page.roleManagement.permissionsPlaceholder')}
                  options={props.config.permissionTreeOptions}
                  style={{ width: '100%' }}
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
