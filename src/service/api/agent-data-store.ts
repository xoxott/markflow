/** 共享内存 Store — 避免 agent-mock 与 model-profile-mock 循环依赖 */

type AgentTemplate = Api.AgentManagement.AgentTemplate;
type ModelProfile = Api.AgentManagement.ModelProfile;

export const agentDataStore = {
  agents: [] as AgentTemplate[],
  modelProfiles: [] as ModelProfile[],
  agentsSeeded: false,
  profilesSeeded: false
};

export function getModelProfileById(id: string): ModelProfile | undefined {
  return agentDataStore.modelProfiles.find(p => p.id === id);
}
