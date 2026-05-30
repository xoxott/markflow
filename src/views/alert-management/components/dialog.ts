import type { AdminOptionTarget } from '@/hooks/admin/adminOptionUtils';
import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 告警表单数据 */
export interface AlertFormData {
  name: string;
  description: string;
  level: string;
  condition: string;
  threshold: number | null;
  metric: string;
  isEnabled: boolean;
  targetUserIds: number[];
  targetRoleIds: number[];
}

/** 告警表单对话框配置 */
export interface AlertFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: AlertFormData;
  /** 目标用户回显（detail 可带 name；缺省时用 ID 占位） */
  targetUsers?: AdminOptionTarget[];
  /** 目标角色回显（detail 可带 name；缺省时用 ID 占位） */
  targetRoles?: AdminOptionTarget[];
  /** 确认回调 */
  onConfirm: (data: AlertFormData) => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
}
