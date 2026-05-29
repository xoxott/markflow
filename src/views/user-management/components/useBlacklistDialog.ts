import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { BlacklistReasonDialogConfig } from './dialog';
import BlacklistReasonDialog from './BlacklistReasonDialog';

export function useBlacklistDialog(app?: App) {
  const showBlacklistReason = (config: BlacklistReasonDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(BlacklistReasonDialog, config, app);
  };

  return {
    showBlacklistReason
  };
}

export type UseBlacklistDialogReturn = ReturnType<typeof useBlacklistDialog>;
