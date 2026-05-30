import type { DrawerInstance } from '@/components/base-drawer/drawer';
import useDrawer from '@/components/base-drawer/useDrawer';
import { $t } from '@/locales';
import UserDetailDrawer from './UserDetailDrawer';

type User = Api.UserManagement.User;

export interface UserDetailDrawerDeps {
  loadUser: (id: number) => Promise<User | null>;
  getBuildConfig: () => (user: User) => import('./dialog').UserDetailDrawerConfig;
}

export interface UseUserDetailDrawerReturn {
  open: (user: User) => Promise<DrawerInstance>;
  close: () => void;
  syncIfOpen: () => Promise<void>;
}

export function useUserDetailDrawer(deps: UserDetailDrawerDeps): UseUserDetailDrawerReturn {
  const drawer = useDrawer();
  let activeUserId: number | null = null;
  let activeInstance: DrawerInstance | null = null;

  const resetActive = () => {
    activeUserId = null;
    activeInstance = null;
  };

  const close = () => {
    activeInstance?.close();
    resetActive();
  };

  const renderContent = (user: User) => {
    const config = deps.getBuildConfig()(user);

    return (
      <UserDetailDrawer
        user={config.user}
        permissionsRefreshKey={config.permissionsRefreshKey}
        onEdit={config.onEdit}
        onAssignRoles={config.onAssignRoles}
        onAssignDirectPermissions={config.onAssignDirectPermissions}
        onRevokeDirectPermission={config.onRevokeDirectPermission}
        onRoleClick={config.onRoleClick}
        onActivate={config.onActivate}
        onDeactivate={config.onDeactivate}
        onBlacklist={config.onBlacklist}
        onUnblacklist={config.onUnblacklist}
        onKick={config.onKick}
      />
    );
  };

  const open = async (user: User) => {
    activeInstance?.close();

    activeUserId = user.id;

    const instance = await drawer.open({
      title: $t('page.userManagement.userDetail'),
      content: () => renderContent(user),
      width: 480,
      placement: 'right',
      closable: true,
      // 允许在抽屉上打开弹窗（分配角色等）时与 teleported 下拉正常交互
      trapFocus: false,
      onClose: () => {
        if (activeInstance === instance) {
          resetActive();
        }
      }
    });

    activeInstance = instance;
    return instance;
  };

  const syncIfOpen = async () => {
    if (activeUserId === null || !activeInstance) {
      return;
    }

    const user = await deps.loadUser(activeUserId);
    if (!user) {
      return;
    }

    activeInstance.updateOptions({
      content: () => renderContent(user)
    });
  };

  return { open, close, syncIfOpen };
}
