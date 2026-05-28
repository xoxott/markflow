import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { MenuFormDialogConfig } from './dialog';
import MenuFormDialog from './MenuFormDialog';

export function useMenuDialog(app?: App) {
  const showMenuForm = (config: MenuFormDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(MenuFormDialog, config, app);
  };

  return { showMenuForm };
}

export type UseMenuDialogReturn = ReturnType<typeof useMenuDialog>;
