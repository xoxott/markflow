/**
 * workflow-mock (P1)
 *
 * 注意：仅用于「未接入后端接口」的能力占位（例如版本历史）。 已接入接口的主链路严禁引用此文件。
 */
import type { FlatResponseData } from '@suga/axios';

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

function ok<T>(data: T): FlatResponseData<T> {
  // 项目里 request 返回的是 FlatResponseData；这里用最小字段满足调用方
  return { data } as FlatResponseData<T>;
}

const mockVersions: Record<number, Api.Workflow.WorkflowVersion[]> = {
  1: [
    {
      version: 1,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      createdBy: 'mock',
      changes: '初始化工作流配置',
      config: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    },
    {
      version: 2,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdBy: 'mock',
      changes: '调整 LLM 节点参数',
      config: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    }
  ]
};

export const workflowP1MockApi = {
  async fetchWorkflowVersions(workflowId: number) {
    await delay(200);
    return ok(mockVersions[workflowId] ?? []);
  }
};
