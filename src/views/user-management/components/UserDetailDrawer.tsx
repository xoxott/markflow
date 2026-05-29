import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { NButton, NDescriptions, NDescriptionsItem, NSpace, NTag } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { $t } from '@/locales';

type User = Api.UserManagement.User;

export default defineComponent({
  name: 'UserDetailDrawer',
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    },
    onEdit: {
      type: Function as PropType<() => void>
    },
    onAssignRoles: {
      type: Function as PropType<() => void>
    },
    onBlacklist: {
      type: Function as PropType<() => void>
    },
    onUnblacklist: {
      type: Function as PropType<() => void>
    },
    onKick: {
      type: Function as PropType<() => void>
    }
  },
  setup(props) {
    return () => (
      <>
        <NDescriptions bordered column={1} labelPlacement="left" size="small">
          <NDescriptionsItem label={$t('page.userManagement.username')}>
            {props.user.username}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.email')}>
            {props.user.email}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.role')}>
            {props.user.roles?.length ? (
              <NSpace size="small">
                {props.user.roles.map(role => (
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
            {props.user.isActive
              ? $t('page.userManagement.active')
              : $t('page.userManagement.inactive')}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.onlineStatus')}>
            {props.user.isOnline
              ? $t('page.userManagement.online')
              : $t('page.userManagement.offline')}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.blacklistStatus')}>
            {props.user.isBlacklisted ? (
              <div>
                <NTag type="error" size="small" round>
                  {$t('page.userManagement.blacklisted')}
                </NTag>
                {props.user.blacklistReason && (
                  <div class="mt-4px text-12px text-gray-500">
                    {$t('page.userManagement.blacklistReasonLabel')}: {props.user.blacklistReason}
                  </div>
                )}
                {props.user.blacklistedAt && (
                  <div class="mt-2px text-12px text-gray-500">
                    {formatApiDateTime(props.user.blacklistedAt)}
                  </div>
                )}
              </div>
            ) : (
              $t('page.userManagement.notBlacklisted')
            )}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.lastLoginAt')}>
            {props.user.lastLoginAt
              ? formatApiDateTime(props.user.lastLoginAt)
              : $t('page.userManagement.neverLoggedIn')}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.lastActivityAt')}>
            {props.user.lastActivityAt
              ? formatApiDateTime(props.user.lastActivityAt)
              : $t('page.userManagement.neverActive')}
          </NDescriptionsItem>
          <NDescriptionsItem label={$t('page.userManagement.createdAt')}>
            {formatApiDateTime(props.user.createdAt)}
          </NDescriptionsItem>
        </NDescriptions>

        <NSpace class="mt-16px" size="small" wrap>
          {props.onEdit && (
            <NButton size="small" type="primary" onClick={props.onEdit}>
              {$t('common.edit')}
            </NButton>
          )}
          {props.onAssignRoles && (
            <NButton size="small" onClick={props.onAssignRoles}>
              {$t('page.userManagement.assignRoles')}
            </NButton>
          )}
          {props.user.isBlacklisted
            ? props.onUnblacklist && (
                <NButton size="small" type="warning" onClick={props.onUnblacklist}>
                  {$t('page.userManagement.unblacklist')}
                </NButton>
              )
            : props.onBlacklist && (
                <NButton size="small" type="error" onClick={props.onBlacklist}>
                  {$t('page.userManagement.blacklist')}
                </NButton>
              )}
          {props.user.isOnline && props.onKick && (
            <NButton size="small" type="warning" onClick={props.onKick}>
              {$t('page.userManagement.kickOffline')}
            </NButton>
          )}
        </NSpace>
      </>
    );
  }
});
