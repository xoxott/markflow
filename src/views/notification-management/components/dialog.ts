import type { AdminOptionTarget } from '@/hooks/admin/adminOptionUtils';
import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 通知表单数据 */
export interface NotificationFormData {
  title: string;
  content: string;
  type: string;
  priority: number | null;
  isSent: boolean;
  sentAt: string;
  expiresAt: string;
  targetUserIds: number[];
  targetRoleIds: number[];
}

/** 通知表单对话框配置 */
export interface NotificationFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: NotificationFormData;
  /** 目标用户回显（detail 可带 name；缺省时用 ID 占位） */
  targetUsers?: AdminOptionTarget[];
  /** 目标角色回显（detail 可带 name；缺省时用 ID 占位） */
  targetRoles?: AdminOptionTarget[];
  /** 确认回调 */
  onConfirm: (data: NotificationFormData) => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
}
