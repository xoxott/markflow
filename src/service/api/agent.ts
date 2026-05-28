/** Agent Management HTTP API — dev 环境走 mock */

export { mockAgentApi as agentApi, getAgentStore, type AgentMockApi } from './agent-mock';

export function fetchAgentList(params: Api.AgentManagement.AgentListParams) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchAgentList(params));
}

export function fetchPublishedAgents() {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchPublishedAgents());
}

export function fetchAgentDetail(id: string) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchAgentDetail(id));
}

export function fetchCreateAgent(data: Api.AgentManagement.CreateAgentRequest) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchCreateAgent(data));
}

export function fetchUpdateAgent(id: string, data: Api.AgentManagement.UpdateAgentRequest) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchUpdateAgent(id, data));
}

export function fetchDeleteAgent(id: string) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchDeleteAgent(id));
}

export function fetchPublishAgent(id: string) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchPublishAgent(id));
}

export function fetchDisableAgent(id: string) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchDisableAgent(id));
}

export function fetchCopyAgent(id: string, data?: Api.AgentManagement.CopyAgentRequest) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchCopyAgent(id, data));
}

export function fetchExportAgent(id: string, format?: Api.AgentManagement.ExportFormat) {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchExportAgent(id, format));
}

export function fetchReloadRegistry() {
  return import('./agent-mock').then(m => m.mockAgentApi.fetchReloadRegistry());
}
