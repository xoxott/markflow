import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type {
  ExecutionDetailDialogOptions,
  VersionHistoryDialogOptions,
  WorkflowDialogOptions
} from './dialog';
import WorkflowFormDialog from './WorkflowFormDialog';
import ExecutionDetailDialog from './ExecutionDetailDialog';
import VersionHistoryDialog from './VersionHistoryDialog';

export function useWorkflowDialog(app?: App) {
  const showWorkflowForm = (config: WorkflowDialogOptions): Promise<DialogInstance> => {
    return createDialogInstance(WorkflowFormDialog, config, app);
  };

  const showExecutionDetail = (config: ExecutionDetailDialogOptions): Promise<DialogInstance> => {
    return createDialogInstance(ExecutionDetailDialog, config, app);
  };

  const showVersionHistory = (config: VersionHistoryDialogOptions): Promise<DialogInstance> => {
    return createDialogInstance(VersionHistoryDialog, config, app);
  };

  return {
    showWorkflowForm,
    showExecutionDetail,
    showVersionHistory
  };
}

export type UseWorkflowDialogReturn = ReturnType<typeof useWorkflowDialog>;
