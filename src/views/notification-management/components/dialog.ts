import type { AdminOptionTarget } from '@/hooks/admin/adminOptionUtils';
import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 通知表单数据 */
export interface NotificationFormData {
  title: string;
  content: string;
  type: Api.NotificationManagement.NotificationType;
  priority: number | null;
  expiresAt: string;
  targetUserIds: number[];
  targetRoleIds: number[];
}

/** 通知表单对话框配置 */
export interface NotificationFormDialogConfig extends BaseDialogProps {
  isEdit: boolean;
  formData: NotificationFormData;
  targetUsers?: AdminOptionTarget[];
  targetRoles?: AdminOptionTarget[];
  onConfirm: (data: NotificationFormData) => void | Promise<void>;
  onCancel?: () => void;
}
