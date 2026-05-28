import type { BaseDialogProps } from '@/components/base-dialog/dialog';

type Session = Api.AgentManagement.AgentSession;

/** 会话重命名对话框配置 */
export interface SessionRenameDialogConfig extends BaseDialogProps {
  session: Session;
  onConfirm: (title: string) => void | Promise<void>;
  onCancel?: () => void;
}
