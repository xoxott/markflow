import { request } from '../request';

/** 知识库真实 API 骨架，后续替换 mockKnowledgeBaseApi */
export function fetchKnowledgeBaseList(params: Api.KnowledgeBase.KnowledgeBaseListParams) {
  return request<Api.ListData<Api.KnowledgeBase.KnowledgeBase>>({
    url: '/api/admin/knowledge-bases',
    method: 'get',
    params
  });
}

export function fetchKnowledgeBaseDetail(id: string) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: `/api/admin/knowledge-bases/${id}`,
    method: 'get'
  });
}

export function fetchCreateKnowledgeBase(data: Api.KnowledgeBase.CreateKnowledgeBaseRequest) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: '/api/admin/knowledge-bases',
    method: 'post',
    data
  });
}

export function fetchUpdateKnowledgeBase(
  id: string,
  data: Api.KnowledgeBase.UpdateKnowledgeBaseRequest
) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: `/api/admin/knowledge-bases/${id}`,
    method: 'put',
    data
  });
}

export function fetchDeleteKnowledgeBase(id: string) {
  return request<null>({
    url: `/api/admin/knowledge-bases/${id}`,
    method: 'delete'
  });
}

export function fetchReindexKnowledgeBase(id: string) {
  return request<Api.KnowledgeBase.KnowledgeBase>({
    url: `/api/admin/knowledge-bases/${id}/reindex`,
    method: 'post'
  });
}

export function fetchDocumentList(params: Api.KnowledgeBase.DocumentListParams) {
  return request<Api.ListData<Api.KnowledgeBase.Document>>({
    url: `/api/admin/knowledge-bases/${params.knowledgeBaseId}/documents`,
    method: 'get',
    params
  });
}

export function fetchDocumentDetail(knowledgeBaseId: string, path: string) {
  return request<Api.KnowledgeBase.Document>({
    url: `/api/admin/knowledge-bases/${knowledgeBaseId}/documents/detail`,
    method: 'get',
    params: { path }
  });
}

export function fetchDocumentChunks(documentId: string) {
  return request<Api.KnowledgeBase.Chunk[]>({
    url: `/api/admin/knowledge-bases/documents/${documentId}/chunks`,
    method: 'get'
  });
}

export function fetchUploadDocument(data: Api.KnowledgeBase.UploadDocumentRequest) {
  return request<Api.KnowledgeBase.Document>({
    url: `/api/admin/knowledge-bases/${data.knowledgeBaseId}/documents/upload`,
    method: 'post',
    data
  });
}

export function fetchCreateFolder(data: Api.KnowledgeBase.CreateFolderRequest) {
  return request<Api.KnowledgeBase.Document>({
    url: `/api/admin/knowledge-bases/${data.knowledgeBaseId}/documents/folder`,
    method: 'post',
    data
  });
}

export function fetchRenameDocument(data: Api.KnowledgeBase.RenameDocumentRequest) {
  return request<Api.KnowledgeBase.Document>({
    url: `/api/admin/knowledge-bases/${data.knowledgeBaseId}/documents/rename`,
    method: 'post',
    data
  });
}

export function fetchDeleteDocument(data: Api.KnowledgeBase.DeleteDocumentRequest) {
  return request<null>({
    url: `/api/admin/knowledge-bases/${data.knowledgeBaseId}/documents`,
    method: 'delete',
    data
  });
}

export function fetchReindexDocument(knowledgeBaseId: string, path: string) {
  return request<Api.KnowledgeBase.Document>({
    url: `/api/admin/knowledge-bases/${knowledgeBaseId}/documents/reindex`,
    method: 'post',
    data: { path }
  });
}

export function fetchReadDocumentContent(params: Api.KnowledgeBase.ReadDocumentContentRequest) {
  return request<string>({
    url: `/api/admin/knowledge-bases/${params.knowledgeBaseId}/documents/content`,
    method: 'get',
    params: { path: params.path }
  });
}

export function fetchSearch(params: Api.KnowledgeBase.SearchParams) {
  return request<Api.KnowledgeBase.SearchResult[]>({
    url: `/api/admin/knowledge-bases/${params.knowledgeBaseId}/search`,
    method: 'post',
    data: params
  });
}

export function fetchSidebarNavigation(knowledgeBaseId: string) {
  return request<Api.KnowledgeBase.SidebarNavigation>({
    url: `/api/admin/knowledge-bases/${knowledgeBaseId}/sidebar`,
    method: 'get'
  });
}
