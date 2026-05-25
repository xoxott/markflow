# Flow 组件测试说明

## 浏览器交互与功能对照

见 [`INTERACTION_AND_FEATURES.md`](./INTERACTION_AND_FEATURES.md)。  
本地示例：`pnpm dev` → `/component` → 流程图组件（含基础 / 完整功能 / 贝塞尔 / 性能压测）。

## 单元 / 组件测试

```bash
pnpm vitest run src/components/flow/__tests__/
```

覆盖：SpatialIndex、视口裁剪、边位置缓存、ConnectionPreview、FlowEdges 挂载、与 Vue-Flow 对比等。

## 性能基准

```bash
pnpm bench:flow
pnpm bench:compare
```

## `setup.ts` 与 RAF

测试环境将 `requestAnimationFrame` **同步执行**（立即调用回调），因此：

- 状态 flush、视口裁剪节流等行为与真实浏览器帧调度不同；
- 拖拽/平移的帧率结论请以浏览器手动验证为准。

## 浏览器帧率抽检（可选，非 CI 门禁）

在本地启动应用后，于 DevTools Performance 中录制大图 pan 操作，或使用 Playwright 脚本采样 `performance.measure`（示例命令，需自行安装 Playwright）：

```bash
pnpm dev
# 另开终端（若项目已配置 Playwright）
# npx playwright test e2e/flow-pan.perf.spec.ts
```

建议场景：`views/component` 中 Flow 演示页，节点数 500+ 时观察 Main 线程 Scripting 时长。
