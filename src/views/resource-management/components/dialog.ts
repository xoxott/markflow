import type { BaseDialogProps } from '@/components/base-dialog/dialog';

export interface ResourceFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ResourceFormDialogConfig extends BaseDialogProps {
  isEdit: boolean;
  formData: ResourceFormData;
  onConfirm: (data: ResourceFormData) => void | Promise<void>;
  onCancel?: () => void;
}
