import { ref } from 'vue';
import type { DrawerInstance } from '@/components/base-drawer/drawer';
import useDrawer from '@/components/base-drawer/useDrawer';
import { $t } from '@/locales';
import type { UserDetailDrawerConfig } from './dialog';
import UserDetailDrawer from './UserDetailDrawer';

export interface UseUserDetailDrawerReturn {
  showUserDetail: (config: UserDetailDrawerConfig) => Promise<DrawerInstance>;
  closeUserDetail: () => void;
}

export function useUserDetailDrawer(): UseUserDetailDrawerReturn {
  const drawer = useDrawer();
  const activeInstance = ref<DrawerInstance | null>(null);

  const closeUserDetail = () => {
    activeInstance.value?.close();
    activeInstance.value = null;
  };

  const showUserDetail = async (config: UserDetailDrawerConfig) => {
    closeUserDetail();

    const instance = await drawer.open({
      title: $t('page.userManagement.userDetail'),
      content: () => (
        <UserDetailDrawer
          user={config.user}
          onEdit={config.onEdit}
          onAssignRoles={config.onAssignRoles}
          onActivate={config.onActivate}
          onDeactivate={config.onDeactivate}
          onBlacklist={config.onBlacklist}
          onUnblacklist={config.onUnblacklist}
          onKick={config.onKick}
        />
      ),
      width: 480,
      placement: 'right',
      closable: true
    });

    activeInstance.value = instance;
    return instance;
  };

  return {
    showUserDetail,
    closeUserDetail
  };
}
