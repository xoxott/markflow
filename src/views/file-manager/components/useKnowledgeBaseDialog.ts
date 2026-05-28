import type { App } from 'vue';
import { createDialogInstance } from '@/components/base-dialog/useDialog';
import type { DialogInstance } from '@/components/base-dialog/dialog';
import type { KnowledgeBaseDialogOptions } from './dialog';
import KnowledgeBaseFormDialog from './KnowledgeBaseFormDialog';

export function useKnowledgeBaseDialog(app?: App) {
  const showKnowledgeBaseForm = (config: KnowledgeBaseDialogOptions): Promise<DialogInstance> => {
    return createDialogInstance(KnowledgeBaseFormDialog, config, app);
  };

  return { showKnowledgeBaseForm };
}
