/** Mock data for Knowledge Base — 用于前端功能演示，后续替换为真实 API */

import { v4 as uuidv4 } from 'uuid';

type KB = Api.KnowledgeBase.KnowledgeBase;
type Doc = Api.KnowledgeBase.Document;
type Chunk = Api.KnowledgeBase.Chunk;

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const createMockResponse = <T>(data: T) => ({
  data,
  error: null,
  response: {} as Record<string, unknown>
});

function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function joinPath(parent: string, name: string): string {
  const base = normalizePath(parent);
  return base === '/' ? `/${name}` : `${base}/${name}`;
}

function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';
  const parts = normalized.split('/').filter(Boolean);
  parts.pop();
  return parts.length === 0 ? '/' : `/${parts.join('/')}`;
}

function listChildren(docs: Doc[], dirPath: string): Doc[] {
  const normalized = normalizePath(dirPath);
  return docs.filter(doc => {
    if (normalizePath(doc.path) === normalized) return false;
    return getParentPath(doc.path) === normalized;
  });
}

const QUICK_ACCESS_PREFIX = '@quick:';
const FILE_TYPE_PREFIX = '@type:';

function isVirtualSidebarPath(path: string): boolean {
  return path.startsWith(QUICK_ACCESS_PREFIX) || path.startsWith(FILE_TYPE_PREFIX);
}

function parseQuickAccess(path: string): Api.KnowledgeBase.QuickAccessKey | undefined {
  if (!path.startsWith(QUICK_ACCESS_PREFIX)) return undefined;
  return path.slice(QUICK_ACCESS_PREFIX.length) as Api.KnowledgeBase.QuickAccessKey;
}

function parseFileType(path: string): Api.KnowledgeBase.FileTypeKey | undefined {
  if (!path.startsWith(FILE_TYPE_PREFIX)) return undefined;
  return path.slice(FILE_TYPE_PREFIX.length) as Api.KnowledgeBase.FileTypeKey;
}

function generateMockChunks(documentId: string, fileName: string, content?: string): Chunk[] {
  const baseContent =
    content ||
    `# ${fileName}\n\n这是 ${fileName} 的 Mock 文档内容，用于演示知识库分块与检索功能。\n\n## 概述\n\n本文档包含产品说明、使用指南与常见问题。\n\n## 详细内容\n\n在实际接入后端后，此处将展示真实的文档切片结果。`;
  const paragraphs = baseContent.split(/\n\n+/).filter(Boolean);
  const count = Math.min(Math.max(paragraphs.length, 3), 8);

  return Array.from({ length: count }, (_, index) => {
    const chunkContent = paragraphs[index] ?? `分块 ${index + 1}：${fileName} 相关内容片段。`;
    return {
      id: uuidv4(),
      documentId,
      content: chunkContent,
      tokenCount: Math.ceil(chunkContent.length / 2),
      position: index + 1,
      metadata: { source: fileName }
    };
  });
}

const mockKnowledgeBases: KB[] = [
  {
    id: 'kb-1',
    name: '产品文档库',
    description: '存放产品手册、FAQ 与内部规范，供客服与 AI 工作流引用。',
    documentCount: 4,
    chunkCount: 18,
    indexStatus: 'ready',
    embeddingModel: 'text-embedding-3-small',
    tags: ['产品', 'FAQ'],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'kb-2',
    name: '技术知识库',
    description: 'API 文档、架构说明与开发指南。',
    documentCount: 2,
    chunkCount: 8,
    indexStatus: 'ready',
    embeddingModel: 'text-embedding-3-small',
    tags: ['技术', 'API'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

const mockDocuments: Doc[] = [
  {
    id: 'doc-folder-1',
    knowledgeBaseId: 'kb-1',
    name: 'guides',
    path: '/guides',
    isDirectory: true,
    size: 0,
    status: 'indexed',
    chunkCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'doc-1',
    knowledgeBaseId: 'kb-1',
    name: 'getting-started.md',
    path: '/guides/getting-started.md',
    isDirectory: false,
    mimeType: 'text/markdown',
    size: 4096,
    status: 'indexed',
    chunkCount: 5,
    indexedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'doc-2',
    knowledgeBaseId: 'kb-1',
    name: 'faq.md',
    path: '/faq.md',
    isDirectory: false,
    mimeType: 'text/markdown',
    size: 8192,
    status: 'indexed',
    chunkCount: 6,
    indexedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'doc-3',
    knowledgeBaseId: 'kb-1',
    name: 'policy.pdf',
    path: '/policy.pdf',
    isDirectory: false,
    mimeType: 'application/pdf',
    size: 204800,
    status: 'indexed',
    chunkCount: 7,
    indexedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'doc-4',
    knowledgeBaseId: 'kb-1',
    name: 'draft-fail.docx',
    path: '/draft-fail.docx',
    isDirectory: false,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 15360,
    status: 'failed',
    chunkCount: 0,
    error: 'Mock 索引失败：文件名包含 fail',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'doc-5',
    knowledgeBaseId: 'kb-2',
    name: 'api-reference.md',
    path: '/api-reference.md',
    isDirectory: false,
    mimeType: 'text/markdown',
    size: 12288,
    status: 'indexed',
    chunkCount: 5,
    indexedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'doc-6',
    knowledgeBaseId: 'kb-2',
    name: 'architecture.md',
    path: '/architecture.md',
    isDirectory: false,
    mimeType: 'text/markdown',
    size: 6144,
    status: 'indexed',
    chunkCount: 3,
    indexedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const mockChunks = new Map<string, Chunk[]>();
mockDocuments
  .filter(doc => !doc.isDirectory && doc.status === 'indexed')
  .forEach(doc => {
    mockChunks.set(doc.id, generateMockChunks(doc.id, doc.name));
  });

const mockFileContents = new Map<string, string>([
  [
    '/guides/getting-started.md',
    '# 快速开始\n\n欢迎使用墨流 AI 管理后台。\n\n## 第一步\n\n创建知识库并上传文档。\n\n## 第二步\n\n等待索引完成后即可进行检索测试。'
  ],
  [
    '/faq.md',
    '# 常见问题\n\n## 如何上传文档？\n\n点击上传按钮或拖拽文件到列表区域。\n\n## 索引失败怎么办？\n\n可尝试重新索引或检查文件格式。'
  ],
  ['/policy.pdf', '[PDF Mock Content] 隐私政策与数据使用说明文档。'],
  [
    '/api-reference.md',
    '# API 参考\n\n## 认证\n\n所有请求需携带 Bearer Token。\n\n## 知识库接口\n\nGET /api/admin/knowledge-bases'
  ],
  [
    '/architecture.md',
    '# 系统架构\n\n前端基于 Vue 3 + Naive UI，后端提供 REST API 与向量检索服务。'
  ]
]);

function getKbDocuments(kbId: string): Doc[] {
  return mockDocuments.filter(doc => doc.knowledgeBaseId === kbId);
}

function getFileTypeKey(doc: Doc): Api.KnowledgeBase.FileTypeKey {
  const ext = doc.name.includes('.') ? doc.name.split('.').pop()?.toLowerCase() : '';
  const mime = doc.mimeType?.toLowerCase() ?? '';

  if (
    ['md', 'txt', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext || '') ||
    mime.includes('text/') ||
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('sheet')
  ) {
    return 'documents';
  }
  if (
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '') ||
    mime.startsWith('image/')
  ) {
    return 'images';
  }
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '') || mime.startsWith('video/')) {
    return 'videos';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '') || mime.includes('zip')) {
    return 'archives';
  }
  return 'other';
}

function filterDocumentsByQuery(docs: Doc[], params: Api.KnowledgeBase.DocumentListParams): Doc[] {
  if (params.quickAccess) {
    const files = docs.filter(doc => !doc.isDirectory);
    switch (params.quickAccess) {
      case 'all':
        return files;
      case 'recent': {
        const weekAgo = Date.now() - 7 * 86400000;
        return files.filter(doc => new Date(doc.updatedAt).getTime() >= weekAgo);
      }
      case 'failed':
        return files.filter(doc => doc.status === 'failed');
      case 'processing':
        return files.filter(doc => doc.status === 'processing' || doc.status === 'uploaded');
      default:
        return files;
    }
  }

  if (params.fileType) {
    return docs.filter(doc => !doc.isDirectory && getFileTypeKey(doc) === params.fileType);
  }

  return listChildren(docs, params.path || '/');
}

function buildFolderTree(kbId: string): Api.KnowledgeBase.SidebarTreeNode[] {
  const folders = getKbDocuments(kbId)
    .filter(doc => doc.isDirectory)
    .sort((a, b) => a.path.localeCompare(b.path));

  const nodeMap = new Map<string, Api.KnowledgeBase.SidebarTreeNode>();
  const roots: Api.KnowledgeBase.SidebarTreeNode[] = [];

  folders.forEach(folder => {
    nodeMap.set(folder.path, { key: folder.path, label: folder.name, children: [] });
  });

  folders.forEach(folder => {
    const node = nodeMap.get(folder.path)!;
    const parentPath = getParentPath(folder.path);
    if (parentPath === '/') {
      roots.push(node);
      return;
    }
    const parent = nodeMap.get(parentPath);
    if (parent) {
      parent.children ??= [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const pruneEmptyChildren = (nodes: Api.KnowledgeBase.SidebarTreeNode[]) => {
    nodes.forEach(node => {
      if (node.children?.length) {
        pruneEmptyChildren(node.children);
      } else {
        delete node.children;
      }
    });
  };
  pruneEmptyChildren(roots);
  return roots;
}

function recalcKnowledgeBaseStats(kbId: string) {
  const kb = mockKnowledgeBases.find(item => item.id === kbId);
  if (!kb) return;

  const docs = mockDocuments.filter(doc => doc.knowledgeBaseId === kbId && !doc.isDirectory);
  kb.documentCount = docs.length;
  kb.chunkCount = docs.reduce((sum, doc) => sum + doc.chunkCount, 0);
  kb.updatedAt = new Date().toISOString();
}

function scheduleDocumentIndexing(doc: Doc, content?: string) {
  doc.status = 'processing';
  doc.error = null;

  setTimeout(() => {
    const shouldFail = doc.name.includes('fail');
    if (shouldFail) {
      doc.status = 'failed';
      doc.error = 'Mock 索引失败：文件名包含 fail';
      doc.chunkCount = 0;
      mockChunks.set(doc.id, []);
    } else {
      const chunks = generateMockChunks(doc.id, doc.name, content);
      mockChunks.set(doc.id, chunks);
      doc.status = 'indexed';
      doc.chunkCount = chunks.length;
      doc.indexedAt = new Date().toISOString();
    }
    recalcKnowledgeBaseStats(doc.knowledgeBaseId);
  }, 1200);
}

function findDocument(kbId: string, path: string): Doc | undefined {
  const normalized = normalizePath(path);
  return mockDocuments.find(
    doc => doc.knowledgeBaseId === kbId && normalizePath(doc.path) === normalized
  );
}

function documentToFileItem(
  doc: Doc
): import('@/components/file-explorer/types/file-explorer').FileItem {
  const extension = doc.isDirectory
    ? undefined
    : doc.name.includes('.')
      ? doc.name.split('.').pop()
      : undefined;

  return {
    id: doc.id,
    name: doc.name,
    type: doc.isDirectory ? 'folder' : 'file',
    size: doc.size,
    path: doc.path,
    extension,
    mimeType: doc.mimeType,
    modifiedAt: new Date(doc.updatedAt),
    createdAt: new Date(doc.createdAt),
    metadata: {
      status: doc.status,
      chunkCount: doc.chunkCount,
      error: doc.error,
      indexedAt: doc.indexedAt,
      knowledgeBaseId: doc.knowledgeBaseId
    }
  };
}

export const mockKnowledgeBaseApi = {
  async fetchKnowledgeBaseList(params: Api.KnowledgeBase.KnowledgeBaseListParams) {
    await delay(300);

    let filtered = [...mockKnowledgeBases];
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        kb =>
          kb.name.toLowerCase().includes(search) || kb.description?.toLowerCase().includes(search)
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return createMockResponse({
      lists: paged,
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
        hasPrevPage: page > 1,
        hasNextPage: start + limit < filtered.length
      }
    });
  },

  async fetchKnowledgeBaseDetail(id: string) {
    await delay(200);
    const kb = mockKnowledgeBases.find(item => item.id === id);
    if (!kb) throw new Error('知识库不存在');
    return createMockResponse(kb);
  },

  async fetchCreateKnowledgeBase(data: Api.KnowledgeBase.CreateKnowledgeBaseRequest) {
    await delay(300);
    const kb: KB = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      documentCount: 0,
      chunkCount: 0,
      indexStatus: 'ready',
      embeddingModel: data.embeddingModel || 'text-embedding-3-small',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockKnowledgeBases.unshift(kb);
    return createMockResponse(kb);
  },

  async fetchUpdateKnowledgeBase(id: string, data: Api.KnowledgeBase.UpdateKnowledgeBaseRequest) {
    await delay(300);
    const kb = mockKnowledgeBases.find(item => item.id === id);
    if (!kb) throw new Error('知识库不存在');
    if (data.name !== undefined) kb.name = data.name;
    if (data.description !== undefined) kb.description = data.description;
    if (data.tags !== undefined) kb.tags = data.tags;
    if (data.embeddingModel !== undefined) kb.embeddingModel = data.embeddingModel;
    kb.updatedAt = new Date().toISOString();
    return createMockResponse(kb);
  },

  async fetchDeleteKnowledgeBase(id: string) {
    await delay(300);
    const index = mockKnowledgeBases.findIndex(item => item.id === id);
    if (index === -1) throw new Error('知识库不存在');

    const docIds = mockDocuments.filter(doc => doc.knowledgeBaseId === id).map(doc => doc.id);
    docIds.forEach(docId => mockChunks.delete(docId));

    for (let i = mockDocuments.length - 1; i >= 0; i -= 1) {
      if (mockDocuments[i].knowledgeBaseId === id) {
        mockDocuments.splice(i, 1);
      }
    }
    mockKnowledgeBases.splice(index, 1);
    return createMockResponse(null);
  },

  async fetchReindexKnowledgeBase(id: string) {
    await delay(200);
    const kb = mockKnowledgeBases.find(item => item.id === id);
    if (!kb) throw new Error('知识库不存在');

    kb.indexStatus = 'indexing';
    kb.updatedAt = new Date().toISOString();

    setTimeout(() => {
      const docs = mockDocuments.filter(doc => doc.knowledgeBaseId === id && !doc.isDirectory);
      docs.forEach(doc => scheduleDocumentIndexing(doc));
      kb.indexStatus = 'ready';
      recalcKnowledgeBaseStats(id);
    }, 1500);

    return createMockResponse(kb);
  },

  async fetchDocumentList(params: Api.KnowledgeBase.DocumentListParams) {
    await delay(250);

    const kbDocs = getKbDocuments(params.knowledgeBaseId);
    let children = filterDocumentsByQuery(kbDocs, params);

    if (params.search) {
      const search = params.search.toLowerCase();
      children = children.filter(doc => doc.name.toLowerCase().includes(search));
    }
    if (params.status) {
      children = children.filter(doc => doc.status === params.status);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const start = (page - 1) * pageSize;
    const paged = children.slice(start, start + pageSize);

    return createMockResponse({
      lists: paged,
      meta: {
        page,
        limit: pageSize,
        total: children.length,
        totalPages: Math.ceil(children.length / pageSize),
        hasPrevPage: page > 1,
        hasNextPage: start + pageSize < children.length
      }
    });
  },

  async fetchDocumentDetail(knowledgeBaseId: string, path: string) {
    await delay(200);
    const doc = findDocument(knowledgeBaseId, path);
    if (!doc) throw new Error('文档不存在');
    return createMockResponse(doc);
  },

  async fetchDocumentChunks(documentId: string) {
    await delay(200);
    return createMockResponse(mockChunks.get(documentId) ?? []);
  },

  async fetchUploadDocument(data: Api.KnowledgeBase.UploadDocumentRequest) {
    await delay(300);

    const filePath = joinPath(data.path, data.fileName);
    if (findDocument(data.knowledgeBaseId, filePath)) {
      throw new Error('同名文件已存在');
    }

    const doc: Doc = {
      id: uuidv4(),
      knowledgeBaseId: data.knowledgeBaseId,
      name: data.fileName,
      path: filePath,
      isDirectory: false,
      mimeType: data.mimeType,
      size: data.size,
      status: 'uploaded',
      chunkCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockDocuments.push(doc);
    if (data.content) {
      mockFileContents.set(filePath, data.content);
    }
    recalcKnowledgeBaseStats(data.knowledgeBaseId);
    scheduleDocumentIndexing(doc, data.content);

    return createMockResponse(doc);
  },

  async fetchCreateFolder(data: Api.KnowledgeBase.CreateFolderRequest) {
    await delay(250);

    const folderPath = joinPath(data.path, data.name);
    if (findDocument(data.knowledgeBaseId, folderPath)) {
      throw new Error('同名文件夹已存在');
    }

    const doc: Doc = {
      id: uuidv4(),
      knowledgeBaseId: data.knowledgeBaseId,
      name: data.name,
      path: folderPath,
      isDirectory: true,
      size: 0,
      status: 'indexed',
      chunkCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockDocuments.push(doc);
    recalcKnowledgeBaseStats(data.knowledgeBaseId);
    return createMockResponse(doc);
  },

  async fetchRenameDocument(data: Api.KnowledgeBase.RenameDocumentRequest) {
    await delay(250);

    const doc = findDocument(data.knowledgeBaseId, data.path);
    if (!doc) throw new Error('文档不存在');

    const parent = getParentPath(data.path);
    const newPath = joinPath(parent, data.newName);
    if (findDocument(data.knowledgeBaseId, newPath)) {
      throw new Error('目标名称已存在');
    }

    const oldPath = doc.path;
    doc.name = data.newName;
    doc.path = newPath;
    doc.updatedAt = new Date().toISOString();

    if (doc.isDirectory) {
      mockDocuments.forEach(item => {
        if (item.knowledgeBaseId === data.knowledgeBaseId && item.path.startsWith(`${oldPath}/`)) {
          item.path = item.path.replace(oldPath, newPath);
        }
      });
    } else {
      const content = mockFileContents.get(oldPath);
      if (content) {
        mockFileContents.delete(oldPath);
        mockFileContents.set(newPath, content);
      }
    }

    return createMockResponse(doc);
  },

  async fetchDeleteDocument(data: Api.KnowledgeBase.DeleteDocumentRequest) {
    await delay(250);

    const doc = findDocument(data.knowledgeBaseId, data.path);
    if (!doc) throw new Error('文档不存在');

    const normalized = normalizePath(data.path);
    const toRemove = mockDocuments.filter(item => {
      if (item.knowledgeBaseId !== data.knowledgeBaseId) return false;
      const itemPath = normalizePath(item.path);
      return itemPath === normalized || itemPath.startsWith(`${normalized}/`);
    });

    toRemove.forEach(item => {
      mockChunks.delete(item.id);
      mockFileContents.delete(item.path);
      const index = mockDocuments.findIndex(d => d.id === item.id);
      if (index >= 0) mockDocuments.splice(index, 1);
    });

    recalcKnowledgeBaseStats(data.knowledgeBaseId);
    return createMockResponse(null);
  },

  async fetchReindexDocument(knowledgeBaseId: string, path: string) {
    await delay(200);
    const doc = findDocument(knowledgeBaseId, path);
    if (!doc || doc.isDirectory) throw new Error('文档不存在');

    scheduleDocumentIndexing(doc, mockFileContents.get(path));
    doc.updatedAt = new Date().toISOString();
    return createMockResponse(doc);
  },

  async fetchReadDocumentContent(params: Api.KnowledgeBase.ReadDocumentContentRequest) {
    await delay(200);
    const doc = findDocument(params.knowledgeBaseId, params.path);
    if (!doc || doc.isDirectory) throw new Error('无法读取该路径');

    const content =
      mockFileContents.get(normalizePath(params.path)) ??
      `# ${doc.name}\n\n这是 ${doc.name} 的 Mock 内容。`;

    return createMockResponse(content);
  },

  async fetchSearch(params: Api.KnowledgeBase.SearchParams) {
    await delay(400);

    const query = params.query.trim().toLowerCase();
    if (!query) return createMockResponse([]);

    const topK = params.topK ?? 5;
    const minScore = params.minScore ?? 0.5;
    const docs = mockDocuments.filter(
      doc => doc.knowledgeBaseId === params.knowledgeBaseId && !doc.isDirectory
    );

    const results: Api.KnowledgeBase.SearchResult[] = [];

    docs.forEach(doc => {
      const chunks = mockChunks.get(doc.id) ?? [];
      chunks.forEach(chunk => {
        const contentLower = chunk.content.toLowerCase();
        if (!contentLower.includes(query)) return;

        const index = contentLower.indexOf(query);
        const highlightStart = Math.max(0, index - 20);
        const highlightEnd = Math.min(chunk.content.length, index + query.length + 40);
        const highlight = chunk.content.slice(highlightStart, highlightEnd);
        const score = Math.min(0.99, 0.72 + query.length * 0.03 + chunk.position * 0.01);

        if (score >= minScore) {
          results.push({
            chunk,
            document: { id: doc.id, name: doc.name, path: doc.path },
            score,
            highlights: [`...${highlight}...`]
          });
        }
      });
    });

    results.sort((a, b) => b.score - a.score);
    return createMockResponse(results.slice(0, topK));
  },

  async fetchSidebarNavigation(knowledgeBaseId: string) {
    await delay(200);

    const kbDocs = getKbDocuments(knowledgeBaseId);
    const files = kbDocs.filter(doc => !doc.isDirectory);
    const weekAgo = Date.now() - 7 * 86400000;

    const navigation: Api.KnowledgeBase.SidebarNavigation = {
      quickAccess: [
        {
          id: 'all',
          label: '全部文档',
          path: `${QUICK_ACCESS_PREFIX}all`,
          icon: 'files',
          count: files.length
        },
        {
          id: 'recent',
          label: '最近更新',
          path: `${QUICK_ACCESS_PREFIX}recent`,
          icon: 'clock',
          count: files.filter(doc => new Date(doc.updatedAt).getTime() >= weekAgo).length
        },
        {
          id: 'failed',
          label: '索引失败',
          path: `${QUICK_ACCESS_PREFIX}failed`,
          icon: 'alert-triangle',
          count: files.filter(doc => doc.status === 'failed').length
        },
        {
          id: 'processing',
          label: '索引中',
          path: `${QUICK_ACCESS_PREFIX}processing`,
          icon: 'loader',
          count: files.filter(doc => doc.status === 'processing' || doc.status === 'uploaded')
            .length
        }
      ],
      fileTypes: [
        {
          id: 'documents',
          label: '文档',
          path: `${FILE_TYPE_PREFIX}documents`,
          icon: 'file-text',
          count: files.filter(doc => getFileTypeKey(doc) === 'documents').length
        },
        {
          id: 'images',
          label: '图片',
          path: `${FILE_TYPE_PREFIX}images`,
          icon: 'photo',
          count: files.filter(doc => getFileTypeKey(doc) === 'images').length
        },
        {
          id: 'videos',
          label: '视频',
          path: `${FILE_TYPE_PREFIX}videos`,
          icon: 'video',
          count: files.filter(doc => getFileTypeKey(doc) === 'videos').length
        },
        {
          id: 'archives',
          label: '压缩包',
          path: `${FILE_TYPE_PREFIX}archives`,
          icon: 'archive',
          count: files.filter(doc => getFileTypeKey(doc) === 'archives').length
        },
        {
          id: 'other',
          label: '其他',
          path: `${FILE_TYPE_PREFIX}other`,
          icon: 'file',
          count: files.filter(doc => getFileTypeKey(doc) === 'other').length
        }
      ],
      folderTree: buildFolderTree(knowledgeBaseId)
    };

    return createMockResponse(navigation);
  },

  /** 供 KnowledgeBaseFileDataSource 使用的文件列表转换 */
  documentToFileItem,
  isVirtualSidebarPath,
  parseQuickAccess,
  parseFileType
};

export type KnowledgeBaseApi = typeof mockKnowledgeBaseApi;
