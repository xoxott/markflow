import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { OnlineUsersDialogConfig } from './dialog';
import OnlineUsersDialog from './OnlineUsersDialog';

export function useOnlineUsersDialog(app?: App) {
  const showOnlineUsers = (config: OnlineUsersDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(OnlineUsersDialog, config, app);
  };

  return {
    showOnlineUsers
  };
}

export type UseOnlineUsersDialogReturn = ReturnType<typeof useOnlineUsersDialog>;
