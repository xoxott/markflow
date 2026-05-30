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
  targetRoleCodes: string[];
}

/** 告警表单对话框配置 */
export interface AlertFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: AlertFormData;
  /** 确认回调 */
  onConfirm: (data: AlertFormData) => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
}
