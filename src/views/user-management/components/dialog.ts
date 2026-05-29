import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 用户表单数据 */
export interface UserFormData {
  username: string;
  email: string;
  password: string;
  /** 创建用户时必填（ai-server CreateUserInput） */
  verificationCode: string;
}

/** 用户表单对话框配置 */
export interface UserFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: UserFormData;
  /** 确认回调；返回 true 表示成功并关闭对话框 */
  onConfirm: (data: UserFormData) => boolean | undefined | Promise<boolean | undefined>;
  /** 取消回调 */
  onCancel?: () => void;
}
