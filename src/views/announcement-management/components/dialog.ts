import type { BaseDialogProps } from '@/components/base-dialog/dialog';

/** 公告表单数据（与 CreateAnnouncementRequest 字段对齐） */
export interface AnnouncementFormData {
  title: string;
  content: string;
  type: Api.AnnouncementManagement.AnnouncementType | '';
  priority: number | null;
  sticky: boolean;
  expiresAt: string;
  targetAudience: string;
}

/** 公告表单对话框配置 */
export interface AnnouncementFormDialogConfig extends BaseDialogProps {
  isEdit: boolean;
  formData: AnnouncementFormData;
  onConfirm: (data: AnnouncementFormData) => void | Promise<void>;
  onCancel?: () => void;
}
