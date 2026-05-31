import type { DrawerInstance } from '@/components/base-drawer/drawer';
import useDrawer from '@/components/base-drawer/useDrawer';
import { $t } from '@/locales';
import LogDetailDrawer from './LogDetailDrawer';

type Log = Api.LogManagement.Log;

export interface UseLogDetailDrawerReturn {
  open: (log: Log) => Promise<DrawerInstance>;
  close: () => void;
}

export function useLogDetailDrawer(): UseLogDetailDrawerReturn {
  const drawer = useDrawer();
  let activeInstance: DrawerInstance | null = null;

  const resetActive = () => {
    activeInstance = null;
  };

  const close = () => {
    activeInstance?.close();
    resetActive();
  };

  const renderContent = (log: Log) => <LogDetailDrawer log={log} />;

  const open = async (log: Log) => {
    activeInstance?.close();

    const instance = await drawer.open({
      title: $t('page.logManagement.logDetail'),
      content: () => renderContent(log),
      width: 560,
      placement: 'right',
      closable: true,
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

  return { open, close };
}
