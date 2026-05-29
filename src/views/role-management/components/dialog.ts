import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 角色表单数据 */
export interface RoleFormData {
  name: string;
  code: string;
  description: string;
  /** 角色级别，数字越小权限越大；与 ai-server 默认 999 一致 */
  level: number;
}

/** 角色表单对话框配置 */
export interface RoleFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: RoleFormData;
  /** 确认回调 */
  onConfirm: (data: RoleFormData) => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
}
