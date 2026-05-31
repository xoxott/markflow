import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { ResourceFormDialogConfig } from './dialog';
import ResourceFormDialog from './ResourceFormDialog';

export function useResourceDialog(app?: App) {
  const showResourceForm = (config: ResourceFormDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(ResourceFormDialog, config, app);
  };

  return { showResourceForm };
}

export type UseResourceDialogReturn = ReturnType<typeof useResourceDialog>;
