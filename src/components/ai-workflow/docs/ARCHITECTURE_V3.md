# AI 工作流架构（Flow 画布版）

## 分层

```
views/ai-workflow/          # 列表页、编辑器页（路由）
components/ai-workflow/
  adapters/                 # Api.Workflow ↔ FlowNode/FlowEdge
  registry/                 # 节点类型元数据（可扩展）
  validation/               # 图校验（纯函数）
  hooks/useWorkflowEditor   # 编辑器编排（不实现画布）
  editor/                   # WorkflowEditorCanvas + Toolbar
  panels/                   # 节点库、配置面板
  dialogs/                  # 表单、执行详情、版本历史
```

画布能力全部委托给 `src/components/flow`（缩放、连线、撤销、框选、小地图等）。

## 扩展新节点类型

1. 在 `registry/node-registry.ts` 注册元数据与默认端口
2. 在 `typings/api/workflow.d.ts` 增加 `NodeType` 与配置类型
3. 在 `panels/NodeConfigPanel.tsx` 增加配置表单区块
4. （可选）保留 `nodes/XxxNode.tsx` 供旧版画布兼容

## 数据流

- 持久化：`Api.Workflow.WorkflowDefinition`（nodes + connections + viewport）
- 运行时：`FlowNode.data` 使用 `WorkflowNodeFlowData`
- 保存：`flowStateToDefinition(canvas.nodes, canvas.edges, viewport)`
