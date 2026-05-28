export interface KnowledgeBaseFormData {
  name: string;
  description: string;
  tags: string[];
  embeddingModel: string;
}

export interface KnowledgeBaseDialogOptions {
  isEdit: boolean;
  formData: KnowledgeBaseFormData;
  title?: string;
  width?: number | string;
  height?: number | string;
  draggable?: boolean;
  resizable?: boolean;
  onConfirm: (data: KnowledgeBaseFormData) => void | Promise<void>;
  onCancel?: () => void;
}

export function createEmptyKnowledgeBaseForm(): KnowledgeBaseFormData {
  return {
    name: '',
    description: '',
    tags: [],
    embeddingModel: 'text-embedding-3-small'
  };
}
