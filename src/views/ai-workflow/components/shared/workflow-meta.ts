import type { FormRules } from 'naive-ui';

/** 工作流元信息表单（名称 / 描述 / 标签 / 状态） */
export interface WorkflowMetaForm {
  name: string;
  description: string;
  tags: string[];
  status: Api.Workflow.WorkflowStatus;
}

export const WORKFLOW_STATUS_OPTIONS: {
  label: string;
  value: Api.Workflow.WorkflowStatus;
}[] = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' }
];

export function createEmptyWorkflowMetaForm(): WorkflowMetaForm {
  return {
    name: '',
    description: '',
    tags: [],
    status: 'draft'
  };
}

export function workflowToMetaForm(workflow: Api.Workflow.Workflow): WorkflowMetaForm {
  return {
    name: workflow.name,
    description: workflow.description ?? '',
    tags: [...(workflow.tags ?? [])],
    status: workflow.status
  };
}

export function cloneWorkflowMetaForm(form: WorkflowMetaForm): WorkflowMetaForm {
  return {
    name: form.name,
    description: form.description,
    tags: [...form.tags],
    status: form.status
  };
}

export function isWorkflowMetaEqual(a: WorkflowMetaForm, b: WorkflowMetaForm): boolean {
  if (a.name !== b.name || a.description !== b.description || a.status !== b.status) {
    return false;
  }
  if (a.tags.length !== b.tags.length) return false;
  return a.tags.every((tag, index) => tag === b.tags[index]);
}

export function createWorkflowMetaRules(): FormRules {
  return {
    name: [
      { required: true, message: '请输入工作流名称', trigger: 'blur' },
      { max: 100, message: '名称不能超过 100 个字符', trigger: 'blur' }
    ],
    description: [{ max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }]
  };
}

export function getWorkflowStatusHint(status: Api.Workflow.WorkflowStatus): string | null {
  if (status === 'published') {
    return '发布后仍可编辑画布；Mock 阶段仅更新状态字段。';
  }
  if (status === 'archived') {
    return '归档后建议只读；若需再编辑可先改回草稿。';
  }
  return null;
}
