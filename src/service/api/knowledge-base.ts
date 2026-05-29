import { request } from '../request';
import { isVirtualSidebarPath, parseFileType, parseQuickAccess } from './knowledge-base-sidebar';

const API_PREFIX = '/api/admin/files/knowledge-bases';

export function fetchKnowledgeBaseList(params: Api.KnowledgeBase.KnowledgeBaseListParams) {
  return request<Api.ListData<Api.KnowledgeBase.KnowledgeBase>>({
    url: `${API_PREFIX}/list`,
    method: 'get',
    params
  });
}

export function fetchKnowledgeBaseDetail(id: string) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: `${API_PREFIX}/${id}`,
    method: 'get'
  });
}

export function fetchCreateKnowledgeBase(data: Api.KnowledgeBase.CreateKnowledgeBaseRequest) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: API_PREFIX,
    method: 'post',
    data
  });
}

export function fetchUpdateKnowledgeBase(
  id: string,
  data: Api.KnowledgeBase.UpdateKnowledgeBaseRequest
) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: `${API_PREFIX}/${id}`,
    method: 'post',
    data
  });
}

export function fetchDeleteKnowledgeBase(id: string) {
  return request<null>({
    url: `${API_PREFIX}/${id}`,
    method: 'delete'
  });
}

export function fetchReindexKnowledgeBase(id: string) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: `${API_PREFIX}/${id}/reindex`,
    method: 'post'
  });
}

export function fetchDocumentList(params: Api.KnowledgeBase.DocumentListParams) {
  return request<Api.ListData<Api.KnowledgeBase.Document>>({
    url: `${API_PREFIX}/${params.knowledgeBaseId}/documents`,
    method: 'get',
    params
  });
}

export function fetchDocumentDetail(knowledgeBaseId: string, path: string) {
  return request<Api.KnowledgeBase.Document>({
    url: `${API_PREFIX}/${knowledgeBaseId}/documents/detail`,
    method: 'get',
    params: { path }
  });
}

export function fetchDocumentChunks(documentId: string) {
  return request<Api.KnowledgeBase.Chunk[]>({
    url: `${API_PREFIX}/documents/${documentId}/chunks`,
    method: 'get'
  });
}

export function fetchUploadDocument(data: Api.KnowledgeBase.UploadDocumentRequest) {
  return request<Api.KnowledgeBase.Document>({
    url: `${API_PREFIX}/${data.knowledgeBaseId}/documents/upload`,
    method: 'post',
    data
  });
}

export function fetchCreateFolder(data: Api.KnowledgeBase.CreateFolderRequest) {
  return request<Api.KnowledgeBase.Document>({
    url: `${API_PREFIX}/${data.knowledgeBaseId}/documents/folder`,
    method: 'post',
    data
  });
}

export function fetchRenameDocument(data: Api.KnowledgeBase.RenameDocumentRequest) {
  return request<Api.KnowledgeBase.Document>({
    url: `${API_PREFIX}/${data.knowledgeBaseId}/documents/rename`,
    method: 'post',
    data
  });
}

export function fetchDeleteDocument(data: Api.KnowledgeBase.DeleteDocumentRequest) {
  return request<null>({
    url: `${API_PREFIX}/${data.knowledgeBaseId}/documents`,
    method: 'delete',
    data
  });
}

export function fetchReindexDocument(knowledgeBaseId: string, path: string) {
  return request<Api.KnowledgeBase.Document>({
    url: `${API_PREFIX}/${knowledgeBaseId}/documents/reindex`,
    method: 'post',
    data: { path }
  });
}

export function fetchReadDocumentContent(params: Api.KnowledgeBase.ReadDocumentContentRequest) {
  return request<string>({
    url: `${API_PREFIX}/${params.knowledgeBaseId}/documents/content`,
    method: 'get',
    params: { path: params.path }
  });
}

export function fetchSearch(params: Api.KnowledgeBase.SearchParams) {
  return request<Api.KnowledgeBase.SearchResult[]>({
    url: `${API_PREFIX}/${params.knowledgeBaseId}/search`,
    method: 'post',
    data: params
  });
}

export function fetchSidebarNavigation(knowledgeBaseId: string) {
  return request<Api.KnowledgeBase.SidebarNavigation>({
    url: `${API_PREFIX}/${knowledgeBaseId}/sidebar`,
    method: 'get'
  });
}

/** 与页面层一致的 API 门面类型 */
export type KnowledgeBaseApi = {
  fetchKnowledgeBaseList: typeof fetchKnowledgeBaseList;
  fetchKnowledgeBaseDetail: typeof fetchKnowledgeBaseDetail;
  fetchCreateKnowledgeBase: typeof fetchCreateKnowledgeBase;
  fetchUpdateKnowledgeBase: typeof fetchUpdateKnowledgeBase;
  fetchDeleteKnowledgeBase: typeof fetchDeleteKnowledgeBase;
  fetchReindexKnowledgeBase: typeof fetchReindexKnowledgeBase;
  fetchDocumentList: typeof fetchDocumentList;
  fetchDocumentDetail: typeof fetchDocumentDetail;
  fetchDocumentChunks: typeof fetchDocumentChunks;
  fetchUploadDocument: typeof fetchUploadDocument;
  fetchCreateFolder: typeof fetchCreateFolder;
  fetchRenameDocument: typeof fetchRenameDocument;
  fetchDeleteDocument: typeof fetchDeleteDocument;
  fetchReindexDocument: typeof fetchReindexDocument;
  fetchReadDocumentContent: typeof fetchReadDocumentContent;
  fetchSearch: typeof fetchSearch;
  fetchSidebarNavigation: typeof fetchSidebarNavigation;
  isVirtualSidebarPath: typeof isVirtualSidebarPath;
  parseQuickAccess: typeof parseQuickAccess;
  parseFileType: typeof parseFileType;
};

/** 真实 API 聚合导出（对接 ai-server /api/admin/files/knowledge-bases） */
export const knowledgeBaseApi: KnowledgeBaseApi = {
  fetchKnowledgeBaseList,
  fetchKnowledgeBaseDetail,
  fetchCreateKnowledgeBase,
  fetchUpdateKnowledgeBase,
  fetchDeleteKnowledgeBase,
  fetchReindexKnowledgeBase,
  fetchDocumentList,
  fetchDocumentDetail,
  fetchDocumentChunks,
  fetchUploadDocument,
  fetchCreateFolder,
  fetchRenameDocument,
  fetchDeleteDocument,
  fetchReindexDocument,
  fetchReadDocumentContent,
  fetchSearch,
  fetchSidebarNavigation,
  isVirtualSidebarPath,
  parseQuickAccess,
  parseFileType
};
