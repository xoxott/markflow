import type { PropType } from 'vue';
import { defineComponent, ref, watch } from 'vue';
import { NButton, NCollapse, NCollapseItem, NSpace, NSpin, NTag } from 'naive-ui';
import { fetchUserEffectivePermissions } from '@/service/api/user';
import { $t } from '@/locales';

type EffectivePermission = Api.UserManagement.EffectivePermission;

export default defineComponent({
  name: 'UserEffectivePermissionsPanel',
  props: {
    userId: { type: Number, required: true },
    manageable: { type: Boolean, default: false },
    onAssignDirectPermissions: {
      type: Function as PropType<() => void>
    },
    onRevokeDirectPermission: {
      type: Function as PropType<(permissionId: number) => void | Promise<void>>
    },
    refreshKey: { type: Number, default: 0 }
  },
  setup(props) {
    const loading = ref(false);
    const permissions = ref<EffectivePermission[]>([]);

    async function loadPermissions() {
      loading.value = true;
      try {
        const { data, error } = await fetchUserEffectivePermissions(props.userId);
        permissions.value = !error && data?.data ? data.data : [];
      } finally {
        loading.value = false;
      }
    }

    watch(
      () => [props.userId, props.refreshKey] as const,
      () => {
        loadPermissions();
      },
      { immediate: true }
    );

    function renderSourceLabel(item: EffectivePermission) {
      if (item.source === 'direct') {
        return $t('page.userManagement.permissionSourceDirect');
      }
      return item.roleName
        ? `${$t('page.userManagement.permissionSourceRole')}: ${item.roleName}`
        : $t('page.userManagement.permissionSourceRole');
    }

    return () => (
      <div class="mt-16px">
        <NCollapse defaultExpandedNames={['effective-permissions']}>
          <NCollapseItem
            title={$t('page.userManagement.effectivePermissions')}
            name="effective-permissions"
          >
            <NSpin show={loading.value}>
              {permissions.value.length === 0 ? (
                <div class="text-12px text-gray-500">
                  {$t('page.userManagement.noEffectivePermissions')}
                </div>
              ) : (
                <NSpace size="small" vertical>
                  {permissions.value.map(item => (
                    <NSpace
                      key={`${item.permissionId}-${item.source}-${item.roleName ?? ''}`}
                      size="small"
                      align="center"
                      wrap
                    >
                      <NTag
                        size="small"
                        type={item.source === 'direct' ? 'warning' : 'default'}
                        round
                      >
                        {item.name} ({item.code})
                      </NTag>
                      <span class="text-11px text-gray-500">[{renderSourceLabel(item)}]</span>
                      {props.manageable &&
                        item.source === 'direct' &&
                        props.onRevokeDirectPermission && (
                          <NButton
                            text
                            type="error"
                            size="tiny"
                            onClick={() => props.onRevokeDirectPermission?.(item.permissionId)}
                          >
                            {$t('page.userManagement.revokeDirectPermission')}
                          </NButton>
                        )}
                    </NSpace>
                  ))}
                </NSpace>
              )}
            </NSpin>
            {props.manageable && props.onAssignDirectPermissions && (
              <NButton
                size="small"
                class="mt-8px"
                onClick={() => props.onAssignDirectPermissions?.()}
              >
                {$t('page.userManagement.assignDirectPermissions')}
              </NButton>
            )}
          </NCollapseItem>
        </NCollapse>
      </div>
    );
  }
});
