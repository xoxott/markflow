import { request } from '@/service/request';

const API_PREFIX = '/api/admin/workflow';

/** 获取工作流列表 */
export function fetchWorkflowList(params: Api.Workflow.WorkflowListParams) {
  return request<Api.ListData<Api.Workflow.Workflow>>({
    url: API_PREFIX,
    method: 'get',
    params
  });
}

/** 获取工作流详情 */
export function fetchWorkflowDetail(id: number) {
  return request<Api.Workflow.Workflow>({
    url: `${API_PREFIX}/${id}`,
    method: 'get'
  });
}

/** 创建工作流 */
export function fetchCreateWorkflow(data: Api.Workflow.CreateWorkflowRequest) {
  return request<Api.Workflow.Workflow>({
    url: API_PREFIX,
    method: 'post',
    data
  });
}

/** 更新工作流 */
export function fetchUpdateWorkflow(id: number, data: Api.Workflow.UpdateWorkflowRequest) {
  return request<Api.Workflow.Workflow>({
    url: `${API_PREFIX}/${id}`,
    method: 'patch',
    data
  });
}

/** 删除工作流 */
export function fetchDeleteWorkflow(id: number) {
  return request<null>({
    url: `${API_PREFIX}/${id}`,
    method: 'delete'
  });
}

/** 发布工作流 */
export function fetchPublishWorkflow(id: number) {
  return request<Api.Workflow.Workflow>({
    url: `${API_PREFIX}/${id}/publish`,
    method: 'post'
  });
}

/** 归档工作流 */
export function fetchArchiveWorkflow(id: number) {
  return request<Api.Workflow.Workflow>({
    url: `${API_PREFIX}/${id}/archive`,
    method: 'post'
  });
}

/** 执行工作流 */
export function fetchExecuteWorkflow(id: number, params?: Api.Workflow.ExecutionParams) {
  return request<Api.Workflow.Execution>({
    url: `${API_PREFIX}/${id}/execute`,
    method: 'post',
    data: params
  });
}

/** 获取工作流执行历史 */
export function fetchExecutionHistory(
  workflowId: number,
  params?: Omit<Api.Workflow.ExecutionHistoryParams, 'workflowId'>
) {
  return request<Api.ListData<Api.Workflow.Execution>>({
    url: `${API_PREFIX}/${workflowId}/executions`,
    method: 'get',
    params
  });
}

/** 获取执行详情 */
export function fetchExecutionDetail(executionId: number) {
  return request<Api.Workflow.ExecutionDetail>({
    url: `${API_PREFIX}/executions/${executionId}`,
    method: 'get'
  });
}

/** 取消执行 */
export function fetchCancelExecution(executionId: number) {
  return request<Api.Workflow.Execution>({
    url: `${API_PREFIX}/executions/${executionId}/cancel`,
    method: 'post'
  });
}
