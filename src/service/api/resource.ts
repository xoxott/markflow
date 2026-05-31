import { request } from '../request';

/** Get resource list */
export function fetchResourceList(params?: Api.ResourceManagement.ResourceListParams) {
  return request<Api.ResourceManagement.ResourceListResponse>({
    url: '/api/admin/resources',
    method: 'get',
    params
  });
}

/** Get resource detail */
export function fetchResourceDetail(id: number) {
  return request<Api.ResourceManagement.ResourceDetailResponse>({
    url: `/api/admin/resources/${id}`,
    method: 'get'
  });
}

/** Create resource */
export function fetchCreateResource(data: Api.ResourceManagement.CreateResourceRequest) {
  return request<Api.ResourceManagement.CreateResourceResponse>({
    url: '/api/admin/resources',
    method: 'post',
    data
  });
}

/** Update resource */
export function fetchUpdateResource(
  id: number,
  data: Api.ResourceManagement.UpdateResourceRequest
) {
  return request<Api.ResourceManagement.UpdateResourceResponse>({
    url: `/api/admin/resources/${id}`,
    method: 'put',
    data
  });
}

/** Delete resource */
export function fetchDeleteResource(id: number) {
  return request<null>({
    url: `/api/admin/resources/${id}`,
    method: 'delete'
  });
}

/** Resource options for selects */
export function fetchResourceOptions(params?: Api.AdminReference.OptionsBaseQuery) {
  return request<Api.AdminReference.PermissionFacetOptionListData>({
    url: '/api/admin/resources/options',
    method: 'get',
    params
  });
}
