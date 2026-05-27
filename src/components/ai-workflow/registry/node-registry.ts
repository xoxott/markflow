/**
 * AI 工作流节点类型注册表
 *
 * 扩展新节点：在此注册元数据，并在 NodeConfigPanel 增加配置表单
 */

import type { Component } from 'vue';
import StartNode from '../nodes/StartNode';
import EndNode from '../nodes/EndNode';
import AINode from '../nodes/AINode';
import HttpNode from '../nodes/HttpNode';
import DatabaseNode from '../nodes/DatabaseNode';
import ConditionNode from '../nodes/ConditionNode';
import TransformNode from '../nodes/TransformNode';
import FileNode from '../nodes/FileNode';

export type WorkflowNodeCategory = 'control' | 'ai' | 'data' | 'integration';

export interface WorkflowNodeTypeConfig {
  /** 旧版画布组件（兼容 CanvasNodes） */
  component?: Component;
  label: string;
  icon: string;
  color: string;
  description: string;
  category: WorkflowNodeCategory;
  defaultPorts?: {
    inputs?: Api.Workflow.Port[];
    outputs?: Api.Workflow.Port[];
  };
}

export const WORKFLOW_NODE_REGISTRY: Record<Api.Workflow.NodeType, WorkflowNodeTypeConfig> = {
  start: {
    component: StartNode,
    label: '开始',
    icon: 'mdi:play-circle',
    color: '#18a058',
    description: '工作流起始节点',
    category: 'control',
    defaultPorts: {
      outputs: [{ id: 'output', type: 'output', label: '输出' }]
    }
  },
  end: {
    component: EndNode,
    label: '结束',
    icon: 'mdi:stop-circle',
    color: '#d03050',
    description: '工作流结束节点',
    category: 'control',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }]
    }
  },
  ai: {
    component: AINode,
    label: 'AI 对话',
    icon: 'mdi:robot',
    color: '#2080f0',
    description: '调用 AI 模型进行对话或推理',
    category: 'ai',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }],
      outputs: [{ id: 'output', type: 'output', label: '输出' }]
    }
  },
  http: {
    component: HttpNode,
    label: 'HTTP 请求',
    icon: 'mdi:web',
    color: '#f0a020',
    description: '发送 HTTP 请求',
    category: 'integration',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }],
      outputs: [
        { id: 'success', type: 'output', label: '成功' },
        { id: 'error', type: 'output', label: '失败' }
      ]
    }
  },
  database: {
    component: DatabaseNode,
    label: '数据库',
    icon: 'mdi:database',
    color: '#7c3aed',
    description: '执行数据库查询或写入',
    category: 'data',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }],
      outputs: [{ id: 'output', type: 'output', label: '输出' }]
    }
  },
  condition: {
    component: ConditionNode,
    label: '条件判断',
    icon: 'mdi:source-branch',
    color: '#f59e0b',
    description: '根据表达式分支执行',
    category: 'control',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }],
      outputs: [
        { id: 'true', type: 'output', label: '真' },
        { id: 'false', type: 'output', label: '假' }
      ]
    }
  },
  transform: {
    component: TransformNode,
    label: '数据转换',
    icon: 'mdi:code-braces',
    color: '#10b981',
    description: '使用脚本转换数据',
    category: 'data',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }],
      outputs: [{ id: 'output', type: 'output', label: '输出' }]
    }
  },
  file: {
    component: FileNode,
    label: '文件操作',
    icon: 'mdi:file-document',
    color: '#6366f1',
    description: '读取或写入文件',
    category: 'data',
    defaultPorts: {
      inputs: [{ id: 'input', type: 'input', label: '输入' }],
      outputs: [{ id: 'output', type: 'output', label: '输出' }]
    }
  }
};

export function getNodeTypeConfig(type: Api.Workflow.NodeType): WorkflowNodeTypeConfig {
  return WORKFLOW_NODE_REGISTRY[type];
}

export function getNodesByCategory(): Record<
  WorkflowNodeCategory,
  Array<{ type: Api.Workflow.NodeType; config: WorkflowNodeTypeConfig }>
> {
  const categories: Record<
    WorkflowNodeCategory,
    Array<{ type: Api.Workflow.NodeType; config: WorkflowNodeTypeConfig }>
  > = {
    control: [],
    ai: [],
    data: [],
    integration: []
  };

  (
    Object.entries(WORKFLOW_NODE_REGISTRY) as [Api.Workflow.NodeType, WorkflowNodeTypeConfig][]
  ).forEach(([type, config]) => {
    categories[config.category].push({ type, config });
  });

  return categories;
}

export function createDefaultNodeData(
  type: Api.Workflow.NodeType
): Partial<Api.Workflow.WorkflowNode> {
  const config = getNodeTypeConfig(type);
  return {
    type,
    name: config.label,
    description: config.description,
    inputs: config.defaultPorts?.inputs ?? [],
    outputs: config.defaultPorts?.outputs ?? [],
    config: {}
  };
}
