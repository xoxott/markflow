import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 版本日志表单数据 */
export interface VersionLogFormData {
  version: string;
  title: string;
  description: string;
  releaseDate: string;
  features: string;
  fixes: string;
  improvements: string;
  breaking: string;
  security: string;
  deprecated: string;
}

/** 版本日志表单对话框配置 */
export interface VersionLogFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: VersionLogFormData;
  /** 确认回调；返回 true 时关闭对话框 */
  onConfirm: (data: VersionLogFormData) => boolean | undefined | Promise<boolean | undefined>;
  /** 取消回调 */
  onCancel?: () => void;
}
