/** Agent Run / Team / Session HTTP API — dev 环境走 mock */

export { mockAgentRunApi as agentRunApi } from './agent-run-mock';

export function fetchAgentTeamList(params: Api.AgentManagement.AgentTeamListParams) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchAgentTeamList(params));
}

export function fetchAgentTeamDetail(id: string) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchAgentTeamDetail(id));
}

export function fetchCreateAgentTeam(data: Api.AgentManagement.CreateAgentTeamRequest) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchCreateAgentTeam(data));
}

export function fetchUpdateAgentTeam(id: string, data: Api.AgentManagement.UpdateAgentTeamRequest) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchUpdateAgentTeam(id, data));
}

export function fetchDeleteAgentTeam(id: string) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchDeleteAgentTeam(id));
}

export function fetchStartAgentTeam(id: string) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchStartAgentTeam(id));
}

export function fetchStopAgentTeam(id: string) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchStopAgentTeam(id));
}

export function fetchAgentSessionList(params: Api.AgentManagement.AgentSessionListParams) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchAgentSessionList(params));
}

export function fetchUpdateAgentSession(
  sessionId: string,
  data: Api.AgentManagement.UpdateSessionRequest
) {
  return import('./agent-run-mock').then(m =>
    m.mockAgentRunApi.fetchUpdateAgentSession(sessionId, data)
  );
}

export function fetchStopAgentSession(sessionId: string) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchStopAgentSession(sessionId));
}

export function fetchAgentRunList(params: Api.AgentManagement.AgentRunListParams) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchAgentRunList(params));
}

export function fetchAgentRunEvents(runId: string) {
  return import('./agent-run-mock').then(m => m.mockAgentRunApi.fetchAgentRunEvents(runId));
}
