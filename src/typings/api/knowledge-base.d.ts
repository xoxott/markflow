// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace KnowledgeBase {
    type IndexStatus = 'pending' | 'indexing' | 'ready' | 'failed';
    type DocumentStatus = 'uploaded' | 'processing' | 'indexed' | 'failed';
    type QuickAccessKey = 'all' | 'recent' | 'failed' | 'processing';
    type FileTypeKey = 'documents' | 'images' | 'videos' | 'archives' | 'other';

    interface SidebarItem {
      id: string;
      label: string;
      path: string;
      icon: string;
      count?: number;
    }

    interface SidebarTreeNode {
      key: string;
      label: string;
      children?: SidebarTreeNode[];
    }

    interface SidebarNavigation {
      quickAccess: SidebarItem[];
      fileTypes: SidebarItem[];
      folderTree: SidebarTreeNode[];
    }

    interface DocumentListQuery {
      path?: string;
      quickAccess?: QuickAccessKey;
      fileType?: FileTypeKey;
    }

    interface KnowledgeBase {
      id: string;
      name: string;
      description?: string;
      documentCount: number;
      chunkCount: number;
      indexStatus: IndexStatus;
      embeddingModel?: string;
      tags?: string[];
      createdAt: string;
      updatedAt: string;
    }

    interface Document {
      id: string;
      knowledgeBaseId: string;
      name: string;
      path: string;
      isDirectory: boolean;
      mimeType?: string;
      size: number;
      status: DocumentStatus;
      chunkCount: number;
      error?: string | null;
      indexedAt?: string | null;
      createdAt: string;
      updatedAt: string;
    }

    interface Chunk {
      id: string;
      documentId: string;
      content: string;
      tokenCount: number;
      position: number;
      metadata?: Record<string, unknown>;
    }

    interface SearchResult {
      chunk: Chunk;
      document: Pick<Document, 'id' | 'name' | 'path'>;
      score: number;
      highlights?: string[];
    }

    interface KnowledgeBaseListParams {
      page?: number;
      limit?: number;
      search?: string;
    }

    interface DocumentListParams {
      knowledgeBaseId: string;
      path?: string;
      page?: number;
      pageSize?: number;
      search?: string;
      status?: DocumentStatus;
      quickAccess?: QuickAccessKey;
      fileType?: FileTypeKey;
    }

    interface SearchParams {
      knowledgeBaseId: string;
      query: string;
      topK?: number;
      minScore?: number;
    }

    interface CreateKnowledgeBaseRequest {
      name: string;
      description?: string;
      tags?: string[];
      embeddingModel?: string;
    }

    interface UpdateKnowledgeBaseRequest {
      name?: string;
      description?: string;
      tags?: string[];
      embeddingModel?: string;
    }

    interface UploadDocumentRequest {
      knowledgeBaseId: string;
      path: string;
      fileName: string;
      size: number;
      mimeType?: string;
      content?: string;
    }

    interface CreateFolderRequest {
      knowledgeBaseId: string;
      path: string;
      name: string;
    }

    interface RenameDocumentRequest {
      knowledgeBaseId: string;
      path: string;
      newName: string;
    }

    interface DeleteDocumentRequest {
      knowledgeBaseId: string;
      path: string;
    }

    interface ReadDocumentContentRequest {
      knowledgeBaseId: string;
      path: string;
    }
  }
}
