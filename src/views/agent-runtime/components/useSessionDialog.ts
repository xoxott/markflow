import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { SessionRenameDialogConfig } from './dialog';
import SessionRenameDialog from './SessionRenameDialog';

export function useSessionDialog(app?: App) {
  const showSessionRename = (config: SessionRenameDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(SessionRenameDialog, config, app);
  };

  return { showSessionRename };
}

export type UseSessionDialogReturn = ReturnType<typeof useSessionDialog>;
