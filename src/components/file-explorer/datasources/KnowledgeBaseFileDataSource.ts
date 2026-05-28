import type { KnowledgeBaseApi } from '@/service/api/knowledge-base-mock';
import type { FileItem } from '../types/file-explorer';
import type { IFileDataSource, PaginationParams, PaginationResult } from './types';

export interface KnowledgeBaseFileDataSourceConfig {
  knowledgeBaseId: string;
  api: KnowledgeBaseApi;
  getListQuery?: () => Api.KnowledgeBase.DocumentListQuery;
}

/** 知识库文档数据源 — 将 KB Mock/HTTP API 适配为 IFileDataSource */
export class KnowledgeBaseFileDataSource implements IFileDataSource {
  readonly type = 'server' as const;

  readonly rootPath = '/';

  private readonly knowledgeBaseId: string;

  private readonly api: KnowledgeBaseApi;

  private readonly getListQuery?: () => Api.KnowledgeBase.DocumentListQuery;

  constructor(config: KnowledgeBaseFileDataSourceConfig) {
    this.knowledgeBaseId = config.knowledgeBaseId;
    this.api = config.api;
    this.getListQuery = config.getListQuery;
  }

  private buildListParams(path?: string, page?: number, pageSize?: number) {
    const query = this.getListQuery?.() ?? {};
    return {
      knowledgeBaseId: this.knowledgeBaseId,
      path: query.path ?? path ?? '/',
      page,
      pageSize,
      quickAccess: query.quickAccess,
      fileType: query.fileType
    };
  }

  hasRootHandle(): boolean {
    return true;
  }

  async openFolder(): Promise<FileSystemDirectoryHandle | null> {
    return null;
  }

  async listFiles(path = '/'): Promise<FileItem[]> {
    const result = await this.api.fetchDocumentList({
      ...this.buildListParams(path, 1, 500)
    });
    return result.data.lists.map(doc => this.api.documentToFileItem(doc));
  }

  async listFilesWithPagination(params: PaginationParams): Promise<PaginationResult> {
    const result = await this.api.fetchDocumentList(
      this.buildListParams(params.path, params.page, params.pageSize)
    );

    return {
      items: result.data.lists.map(doc => this.api.documentToFileItem(doc)),
      total: result.data.meta.total,
      page: result.data.meta.page,
      pageSize: result.data.meta.limit
    };
  }

  async readFile(path: string): Promise<string | Blob> {
    const result = await this.api.fetchReadDocumentContent({
      knowledgeBaseId: this.knowledgeBaseId,
      path
    });
    return result.data;
  }

  async writeFile(path: string, content: string | Blob): Promise<void> {
    const text = typeof content === 'string' ? content : await content.text();
    const fileName = path.split('/').filter(Boolean).pop();
    if (!fileName) throw new Error('无效路径');

    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    await this.api.fetchUploadDocument({
      knowledgeBaseId: this.knowledgeBaseId,
      path: parentPath,
      fileName,
      size: text.length,
      mimeType: 'text/plain',
      content: text
    });
  }

  async createFolder(path: string, name: string): Promise<FileItem> {
    const result = await this.api.fetchCreateFolder({
      knowledgeBaseId: this.knowledgeBaseId,
      path,
      name
    });
    return this.api.documentToFileItem(result.data);
  }

  async deleteFile(path: string): Promise<void> {
    await this.api.fetchDeleteDocument({
      knowledgeBaseId: this.knowledgeBaseId,
      path
    });
  }

  async renameFile(path: string, newName: string): Promise<void> {
    await this.api.fetchRenameDocument({
      knowledgeBaseId: this.knowledgeBaseId,
      path,
      newName
    });
  }

  async copyFile(): Promise<void> {
    throw new Error('知识库暂不支持复制文件');
  }

  async moveFile(): Promise<void> {
    throw new Error('知识库暂不支持移动文件');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.api.fetchDocumentDetail(this.knowledgeBaseId, path);
      return true;
    } catch {
      return false;
    }
  }

  async getFileInfo(path: string): Promise<FileItem | null> {
    try {
      const result = await this.api.fetchDocumentDetail(this.knowledgeBaseId, path);
      return this.api.documentToFileItem(result.data);
    } catch {
      return null;
    }
  }
}
