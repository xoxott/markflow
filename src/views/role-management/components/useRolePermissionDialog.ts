import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { RolePermissionDialogConfig } from './dialog';
import RolePermissionDialog from './RolePermissionDialog';

export function useRolePermissionDialog(app?: App) {
  const showRolePermission = (config: RolePermissionDialogConfig): Promise<DialogInstance> => {
    return createDialogInstance(RolePermissionDialog, config, app);
  };

  return {
    showRolePermission
  };
}

export type UseRolePermissionDialogReturn = ReturnType<typeof useRolePermissionDialog>;
