import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSpace,
  NTag
} from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { $t } from '@/locales';
import type { UserDetailDrawerConfig } from './dialog';

export default defineComponent({
  name: 'UserDetailDrawer',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<UserDetailDrawerConfig | null>,
      default: null
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const user = computed(() => props.config?.user);

    const handleClose = () => {
      emit('update:show', false);
    };

    return () => (
      <NDrawer
        show={props.show}
        width={480}
        onUpdateShow={(val: boolean) => {
          if (!val) handleClose();
          else emit('update:show', val);
        }}
      >
        <NDrawerContent title={$t('page.userManagement.userDetail')} closable>
          {user.value && (
            <>
              <NDescriptions bordered column={1} labelPlacement="left" size="small">
                <NDescriptionsItem label={$t('page.userManagement.username')}>
                  {user.value.username}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.email')}>
                  {user.value.email}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.role')}>
                  {user.value.roles?.length ? (
                    <NSpace size="small">
                      {user.value.roles.map(role => (
                        <NTag key={role.id} type="info" size="small" round>
                          {role.name}
                        </NTag>
                      ))}
                    </NSpace>
                  ) : (
                    '-'
                  )}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.status')}>
                  {user.value.isActive
                    ? $t('page.userManagement.active')
                    : $t('page.userManagement.inactive')}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.onlineStatus')}>
                  {user.value.isOnline
                    ? $t('page.userManagement.online')
                    : $t('page.userManagement.offline')}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.blacklistStatus')}>
                  {user.value.isBlacklisted ? (
                    <div>
                      <NTag type="error" size="small" round>
                        {$t('page.userManagement.blacklisted')}
                      </NTag>
                      {user.value.blacklistReason && (
                        <div class="mt-4px text-12px text-gray-500">
                          {$t('page.userManagement.blacklistReasonLabel')}:{' '}
                          {user.value.blacklistReason}
                        </div>
                      )}
                      {user.value.blacklistedAt && (
                        <div class="mt-2px text-12px text-gray-500">
                          {formatApiDateTime(user.value.blacklistedAt)}
                        </div>
                      )}
                    </div>
                  ) : (
                    $t('page.userManagement.notBlacklisted')
                  )}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.lastLoginAt')}>
                  {user.value.lastLoginAt
                    ? formatApiDateTime(user.value.lastLoginAt)
                    : $t('page.userManagement.neverLoggedIn')}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.lastActivityAt')}>
                  {user.value.lastActivityAt
                    ? formatApiDateTime(user.value.lastActivityAt)
                    : $t('page.userManagement.neverActive')}
                </NDescriptionsItem>
                <NDescriptionsItem label={$t('page.userManagement.createdAt')}>
                  {formatApiDateTime(user.value.createdAt)}
                </NDescriptionsItem>
              </NDescriptions>

              <NSpace class="mt-16px" size="small" wrap>
                {props.config?.onEdit && (
                  <NButton size="small" type="primary" onClick={props.config.onEdit}>
                    {$t('common.edit')}
                  </NButton>
                )}
                {props.config?.onAssignRoles && (
                  <NButton size="small" onClick={props.config.onAssignRoles}>
                    {$t('page.userManagement.assignRoles')}
                  </NButton>
                )}
                {user.value.isBlacklisted
                  ? props.config?.onUnblacklist && (
                      <NButton size="small" type="warning" onClick={props.config.onUnblacklist}>
                        {$t('page.userManagement.unblacklist')}
                      </NButton>
                    )
                  : props.config?.onBlacklist && (
                      <NButton size="small" type="error" onClick={props.config.onBlacklist}>
                        {$t('page.userManagement.blacklist')}
                      </NButton>
                    )}
                {user.value.isOnline && props.config?.onKick && (
                  <NButton size="small" type="warning" onClick={props.config.onKick}>
                    {$t('page.userManagement.kickOffline')}
                  </NButton>
                )}
              </NSpace>
            </>
          )}
        </NDrawerContent>
      </NDrawer>
    );
  }
});
