import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { UserDirectPermissionDialogConfig } from './dialog';
import UserDirectPermissionDialog from './UserDirectPermissionDialog';

export function useUserDirectPermissionDialog(app?: App) {
  const showUserDirectPermission = (
    config: UserDirectPermissionDialogConfig
  ): Promise<DialogInstance> => {
    return createDialogInstance(UserDirectPermissionDialog, config, app);
  };

  return {
    showUserDirectPermission
  };
}
