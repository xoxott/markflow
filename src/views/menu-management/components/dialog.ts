import type { BaseDialogProps } from '@/components/base-dialog/dialog';

export interface MenuFormData {
  type: Api.MenuManagement.MenuType;
  name: string;
  i18nKey: string;
  routeKey: string;
  icon: string;
  parentId: string | null;
  order: number;
  isActive: boolean;
  hideInMenu: boolean;
  activeMenu: string;
  permissionCodes: string[];
}

export interface MenuFormDialogConfig extends BaseDialogProps {
  isEdit: boolean;
  formData: MenuFormData;
  parentOptions: Array<{ label: string; value: string }>;
  excludeMenuId?: string;
  title?: string;
  onConfirm: (data: MenuFormData) => void | Promise<void>;
  onCancel?: () => void;
}
