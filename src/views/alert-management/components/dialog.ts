import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 告警表单数据 */
export interface AlertFormData {
  type: Api.AlertManagement.AlertType;
  level: Api.AlertManagement.AlertLevel;
  title: string;
  message: string;
  source: string;
}

/** 告警表单对话框配置 */
export interface AlertFormDialogConfig extends BaseDialogProps {
  isEdit: boolean;
  formData: AlertFormData;
  onConfirm: (data: AlertFormData) => void | Promise<void>;
  onCancel?: () => void;
}
