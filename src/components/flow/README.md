# Flow 组件维护指南

`src/components/flow` 是项目内自维护的流程图组件，基于 Vue 3 + TypeScript。

## 维护优先阅读

- 功能与交互验收：`docs/INTERACTION_AND_FEATURES.md`
- 性能测试与对照：`docs/PERFORMANCE_COMPARISON.md`
- 测试命令与注意事项：`docs/TESTING.md`
- 主题与样式变量：`styles/README.md`

## 目录说明

- `components/`：画布、节点、连线、背景、小地图等 UI 组件
- `hooks/`：画布核心状态、交互、性能和主题相关 hooks
- `core/`：与框架解耦的状态、命令、性能与交互能力
- `utils/`：路径、布局、事件、样式、缓存等通用工具
- `types/`：公共类型定义
- `__tests__/`：单测与基准测试

## 本地开发与验证

```bash
pnpm dev
pnpm vitest run src/components/flow/__tests__/
pnpm bench:compare
```

## 维护约定

- 交互或渲染链路调整后，同步更新 `docs/INTERACTION_AND_FEATURES.md`。
- 基准方法、测试入口变更后，同步更新 `docs/TESTING.md`。
- 新增主题变量时，同时更新 `styles/variables.scss` 与 `styles/README.md`。
