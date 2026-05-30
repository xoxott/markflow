import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { NButton, NDescriptions, NDescriptionsItem, NSpace, NTag, NTooltip } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { $t } from '@/locales';
import { isUserManageable } from '../utils/userManageability';
import UserEffectivePermissionsPanel from './UserEffectivePermissionsPanel';

type User = Api.UserManagement.User;

export default defineComponent({
  name: 'UserDetailDrawer',
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    },
    permissionsRefreshKey: {
      type: Number,
      default: 0
    },
    onEdit: {
      type: Function as PropType<() => void>
    },
    onAssignRoles: {
      type: Function as PropType<() => void>
    },
    onAssignDirectPermissions: {
      type: Function as PropType<() => void>
    },
    onRevokeDirectPermission: {
      type: Function as PropType<(permissionId: number) => void | Promise<void>>
    },
    onRoleClick: {
      type: Function as PropType<(roleId: number, roleName: string) => void>
    },
    onActivate: {
      type: Function as PropType<() => void>
    },
    onDeactivate: {
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
    return () => {
      const manageable = isUserManageable(props.user);

      return (
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
                  {props.user.roles.map(role =>
                    props.onRoleClick ? (
                      <span
                        key={role.id}
                        class="cursor-pointer"
                        onClick={() => props.onRoleClick?.(role.id, role.name)}
                      >
                        <NTag type="info" size="small" round>
                          {role.name}
                        </NTag>
                      </span>
                    ) : (
                      <NTag key={role.id} type="info" size="small" round>
                        {role.name}
                      </NTag>
                    )
                  )}
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

          <UserEffectivePermissionsPanel
            userId={props.user.id}
            manageable={manageable}
            refreshKey={props.permissionsRefreshKey}
            onAssignDirectPermissions={manageable ? props.onAssignDirectPermissions : undefined}
            onRevokeDirectPermission={manageable ? props.onRevokeDirectPermission : undefined}
          />

          {manageable && (
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
              {!props.user.isActive && props.onActivate && (
                <NButton size="small" type="success" onClick={props.onActivate}>
                  {$t('page.userManagement.activate')}
                </NButton>
              )}
              {props.user.isActive && props.onDeactivate && (
                <NButton size="small" type="warning" onClick={props.onDeactivate}>
                  {$t('page.userManagement.deactivate')}
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
              {props.onKick &&
                (props.user.isOnline ? (
                  <NButton size="small" type="warning" onClick={props.onKick}>
                    {$t('page.userManagement.kickOffline')}
                  </NButton>
                ) : (
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NButton size="small" type="warning" disabled>
                          {$t('page.userManagement.kickOffline')}
                        </NButton>
                      ),
                      default: () => $t('page.userManagement.kickOfflineDisabled')
                    }}
                  </NTooltip>
                ))}
            </NSpace>
          )}
        </>
      );
    };
  }
});
