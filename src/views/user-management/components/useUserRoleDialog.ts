import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { UserRoleDialogConfig } from './dialog';
import UserRoleDialog from './UserRoleDialog';

export function useUserRoleDialog(app?: App) {
  const showUserRole = (config: UserRoleDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(UserRoleDialog, config, app);
  };

  return {
    showUserRole
  };
}

export type UseUserRoleDialogReturn = ReturnType<typeof useUserRoleDialog>;
