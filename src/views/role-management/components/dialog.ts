import type { SelectOption, TreeOption } from 'naive-ui';
import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 角色表单数据 */
export interface RoleFormData {
  name: string;
  code: string;
  description: string;
  /** 角色级别，数字越小权限越大；与 ai-server 默认 999 一致 */
  level: number;
  permissionIds: number[];
  parentRoleId: number | null;
}

/** 父角色 / 下拉选项（与 NSelect options 一致） */
export type RoleSelectOption = SelectOption;

/** 角色表单对话框配置 */
export interface RoleFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 编辑中的角色 ID（用于父角色选项排除自身） */
  roleId?: number;
  /** 是否系统角色（编辑只读展示） */
  isSystem?: boolean;
  /** 表单数据 */
  formData: RoleFormData;
  /** 权限树选项 */
  permissionTreeOptions: TreeOption[];
  /** 父角色选项 */
  parentRoleOptions: RoleSelectOption[];
  /** 确认回调 */
  onConfirm: (data: RoleFormData) => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
}

/** 分配权限对话框配置 */
export interface RolePermissionDialogConfig extends BaseDialogProps {
  roleId: number;
  roleName: string;
  permissionIds: number[];
  permissionTreeOptions: TreeOption[];
  onConfirm: (permissionIds: number[]) => void | Promise<void>;
  onCancel?: () => void;
}
