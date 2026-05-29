# Flow API 迁移指南

本文说明从旧版 Flow 包结构迁移到当前 **public / internal** 边界的方式。面向升级 `markflow` 内嵌 Flow 或 fork 本库的维护者。

## 导入边界

| 场景                             | 推荐导入                            |
| -------------------------------- | ----------------------------------- |
| 业务页面、示例、AI Workflow 宿主 | `from '@/components/flow'`          |
| Flow 样式（应用入口一次）        | `from '@/components/flow/styles'`   |
| 单测、playground、深度扩展       | `from '@/components/flow/internal'` |

**不要**从 `hooks/*`、`core/*`、`utils/*` 等业务路径 deep import；ESLint 会对宿主代码给出 warning。

## 已移除 / 搬迁

| 旧路径 / API                    | 现状                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| `core/commands/CommandManager`  | 已移除；撤销/重做走 `DefaultHistoryManager` + `undo`/`redo` expose |
| `hooks/useSelection.ts`         | 已移除；选区在 orchestrator + `FlowSelectionHandler`               |
| `hooks/useFlowTheme.ts`         | 已移除；使用 `useFlowCanvasTheme` + `flowDarkModeKey`              |
| `examples/*`                    | 迁至 `playground/*`，**不**从 `index.ts` 导出                      |
| `VirtualScroller`               | 已移除；视口裁剪用 `useViewportCulling`                            |
| `utils/flow-config-warnings.ts` | 已移除；校验合并进 `FlowConfigValidator`                           |

## 受控 Props（Phase 5）

`FlowCanvas` 支持受控数据，优先级高于 `initial*`：

```tsx
<FlowCanvas nodes={nodes} edges={edges} viewport={viewport} selection={{ nodeIds, edgeIds }} />
```

外部更新 `nodes` / `edges` 数组（含清空为 `[]`）会同步到内部 `IStateStore`。非受控模式仍可使用 `initialNodes` / `initialEdges`。

## 序列化（Phase 5.3）

```ts
const snapshot = canvasRef.value?.exportJSON({ includeViewport: true });
canvasRef.value?.importJSON(snapshot, { replace: true, includeViewport: true });
```

底层类型为 `FlowSnapshot`（`serialization-utils`），经 **internal** 也可直接 `toJSON` / `fromJSON` 单测。

剪贴板：`copySelection` / `cutSelection` / `pasteClipboard`（Ctrl+C/X/V），与 `exportJSON` 独立。

## 交互配置更名

| 配置项                             | 默认      | 说明                 |
| ---------------------------------- | --------- | -------------------- |
| `interaction.enableBoxSelection`   | `true`    | Shift + 空白拖拽框选 |
| `interaction.boxSelectionKey`      | `'shift'` | 修饰键               |
| `interaction.enableMultiSelection` | `true`    | Ctrl/Cmd 多选        |
| `edges.reconnectable`              | `true`    | 拖端点重连           |

## Expose API 收敛

`FlowCanvas` ref 暴露高频 API（节点/边 CRUD、视口、选择、历史、序列化、布局锁）。低频能力请：

- `inject(flowCanvasContextKey)` — `selection`、`viewportActions`、`eventEmitter`
- `useFlowConfig(id)` — 运行时 `updateConfig`
- `useFlowState` — 与画布 id 绑定的状态 hook

## Orchestrator 结构

画布逻辑已收拢到 `hooks/orchestrator/`：

- `useFlowCanvasOrchestrator` — 主入口
- `useFlowCanvasState` — 状态 + 选区 handler
- `useFlowCanvasShortcuts` — 键盘、剪贴板、import/export
- `useFlowCanvasViewport` — 视口与 fitView

自定义键盘行为请扩展 `useFlowCanvasKeyboard` 注册项，而非复制 orchestrator。

## 主题

- 默认 `syncAppTheme={true}`，跟随 Naive `html.dark`
- 覆盖暗色来源：`provide(flowDarkModeKey, ref(boolean))`
- CSS 变量见 `styles/README.md`

## 测试命令

```bash
pnpm vitest run src/components/flow/__tests__/
```

新增挂载测：`controlled-props`、`node-types-render`；序列化单测：`clipboard-serialize`（`toJSON`/`fromJSON`）。

## 检查清单

- [ ] 业务 import 仅 `@/components/flow` + `styles`
- [ ] 删除对 `CommandManager`、`useSelection` 的引用
- [ ] playground 引用路径改为 `playground/`
- [ ] 需要持久化时使用 `exportJSON` / `importJSON`，勿手写裸数组赋值（除非受控模式）
