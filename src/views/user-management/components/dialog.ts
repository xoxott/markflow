import type { SelectOption } from 'naive-ui';
import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 用户表单数据 */
export interface UserFormData {
  username: string;
  email: string;
  password: string;
  /** 编辑用户修改密码时必填（须与 password 一致） */
  confirmPassword: string;
  /** 创建用户时必填（ai-server CreateUserInput） */
  verificationCode: string;
  /** 创建用户时的初始角色 */
  roleIds: number[];
  /** 编辑用户时的头像 URL */
  avatar: string;
}

/** 用户表单对话框配置 */
export interface UserFormDialogConfig extends BaseDialogProps {
  /** 是否为编辑模式 */
  isEdit: boolean;
  /** 表单数据 */
  formData: UserFormData;
  /** 角色下拉选项 */
  roleOptions: SelectOption[];
  /** 确认回调；返回 true 表示成功并关闭对话框 */
  onConfirm: (data: UserFormData) => boolean | undefined | Promise<boolean | undefined>;
  /** 取消回调 */
  onCancel?: () => void;
}

/** 分配角色对话框配置 */
export interface UserRoleDialogConfig extends BaseDialogProps {
  userId: number;
  username: string;
  roleIds: number[];
  roleOptions: SelectOption[];
  /** 返回 true 表示成功并关闭 */
  onConfirm: (roleIds: number[]) => boolean | undefined | Promise<boolean | undefined>;
  onCancel?: () => void;
}

/** 拉黑原因对话框配置 */
export interface BlacklistReasonDialogConfig extends BaseDialogProps {
  userCount: number;
  /** 返回 true 表示成功并关闭 */
  onConfirm: (reason: string) => boolean | undefined | Promise<boolean | undefined>;
  onCancel?: () => void;
}

/** 在线用户对话框配置 */
export interface OnlineUsersDialogConfig extends BaseDialogProps {
  users: Api.UserManagement.User[];
  onCancel?: () => void;
}

/** 用户详情抽屉配置 */
export interface UserDetailDrawerConfig {
  user: Api.UserManagement.User;
  onEdit?: () => void;
  onAssignRoles?: () => void;
  onBlacklist?: () => void;
  onUnblacklist?: () => void;
  onKick?: () => void;
}
