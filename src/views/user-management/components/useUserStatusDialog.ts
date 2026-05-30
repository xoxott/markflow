import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { UserStatusReasonDialogConfig } from './dialog';
import UserStatusReasonDialog from './UserStatusReasonDialog';

export function useUserStatusDialog(app?: App) {
  const showStatusReason = (config: UserStatusReasonDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(UserStatusReasonDialog, config, app);
  };

  return {
    showStatusReason
  };
}

export type UseUserStatusDialogReturn = ReturnType<typeof useUserStatusDialog>;
