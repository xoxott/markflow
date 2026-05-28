/** Model Profile HTTP API — dev 环境走 mock */

export { mockModelProfileApi as modelProfileApi } from './model-profile-mock';

export function fetchModelProfileList(params: Api.AgentManagement.ModelProfileListParams) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchModelProfileList(params)
  );
}

export function fetchModelProfileDetail(id: string) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchModelProfileDetail(id)
  );
}

export function fetchCreateModelProfile(data: Api.AgentManagement.CreateModelProfileRequest) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchCreateModelProfile(data)
  );
}

export function fetchUpdateModelProfile(
  id: string,
  data: Api.AgentManagement.UpdateModelProfileRequest
) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchUpdateModelProfile(id, data)
  );
}

export function fetchDeleteModelProfile(id: string) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchDeleteModelProfile(id)
  );
}

export function fetchSaveModelCredential(
  id: string,
  data: Api.AgentManagement.SaveModelCredentialRequest
) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchSaveModelCredential(id, data)
  );
}

export function fetchTestModelConnection(id: string) {
  return import('./model-profile-mock').then(m =>
    m.mockModelProfileApi.fetchTestModelConnection(id)
  );
}
