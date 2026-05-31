import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 权限表单数据 */
export interface PermissionFormData {
  name: string;
  code: string;
  resourceId: number | null;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
}

/** 权限表单对话框配置 */
export interface PermissionFormDialogConfig extends BaseDialogProps {
  isEdit: boolean;
  formData: PermissionFormData;
  onConfirm: (data: PermissionFormData) => void | Promise<void>;
  onCancel?: () => void;
}
