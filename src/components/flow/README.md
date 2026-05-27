# Flow 组件维护指南

`src/components/flow` 是项目内自维护的流程图组件，基于 Vue 3 + TypeScript + JSX。

## Public vs Internal

| 入口                         | 用途                                      | 稳定性             |
| ---------------------------- | ----------------------------------------- | ------------------ |
| `@/components/flow`          | 业务集成：组件、类型、配置、扩展点注册    | 尽量 semver 友好   |
| `@/components/flow/styles`   | 全局样式与 CSS 变量                       | 随主题文档演进     |
| `@/components/flow/internal` | 单测、playground、插件作者                | **不保证**向后兼容 |
| `playground/`                | 开发参考脚本（Pinia store、自定义网格等） | 不导出、不发布     |

详见 [`docs/MIGRATION.md`](./docs/MIGRATION.md)。

## 当前能力（Public）

- **画布**：平移、滚轮缩放、网格背景、刻度尺、辅助线吸附、对齐参考线
- **节点**：拖拽、多选、Shift 框选、自定义 `nodeTypes` / `#node` 插槽
- **边**：bezier / straight / step、SVG+Canvas 大量边、标签、选中删除、端点重连
- **状态**：内置 store、撤销/重做、`nodes`/`edges` 受控 props
- **序列化**：`exportJSON()` / `importJSON()`；剪贴板 copy/cut/paste
- **周边**：`FlowMinimap`、`FlowToolbar`、`FlowEmptyState`、i18n（`useFlowI18n`）
- **主题**：`syncAppTheme` + `--flow-*` CSS 变量

## 维护优先阅读

- 功能与交互验收：[`docs/INTERACTION_AND_FEATURES.md`](./docs/INTERACTION_AND_FEATURES.md)
- 扩展点：[`docs/EXTENSION_POINTS.md`](./docs/EXTENSION_POINTS.md)
- API 迁移：[`docs/MIGRATION.md`](./docs/MIGRATION.md)
- 性能测试与对照：[`docs/PERFORMANCE_COMPARISON.md`](./docs/PERFORMANCE_COMPARISON.md)
- 测试命令：[`docs/TESTING.md`](./docs/TESTING.md)
- 主题与样式变量：[`styles/README.md`](./styles/README.md)

## 目录说明

- `components/`：画布、节点、连线、背景、小地图等 UI
- `hooks/orchestrator/`：画布编排（状态、快捷键、视口）
- `hooks/`：其余用户级与底层 hooks
- `core/`：状态、交互、性能（不整体 export）
- `utils/`：路径、对齐、剪贴板、序列化等
- `types/`、`i18n/`：类型与文案
- `playground/`：非发布的参考代码
- `__tests__/`：单测与基准

## 示例页（宿主应用）

`pnpm dev` → `/component` → **流程图组件**（`src/views/component/examples/FlowExamples.tsx`）：

基础、状态、空画布、框选、自定义节点、序列化、边标签、配置、全功能、贝塞尔、性能等。

## 本地开发与验证

```bash
pnpm dev
pnpm vitest run src/components/flow/__tests__/
pnpm bench:compare
```

## 维护约定

- 交互或渲染链路调整后，同步更新 `docs/INTERACTION_AND_FEATURES.md`。
- Public API 破坏性变更时更新 `docs/MIGRATION.md`。
- 基准方法、测试入口变更后，同步更新 `docs/TESTING.md`。
- 新增主题变量时，同时更新 `styles/variables.scss` 与 `styles/README.md`。
