# Flow 交互测试与 Vue Flow 功能对照

> 算法基准见 [`PERFORMANCE_COMPARISON.md`](./PERFORMANCE_COMPARISON.md)（`pnpm bench:compare`）。  
> 本文面向 **浏览器里的绘制、拖拽、缩放** 与 **产品功能缺口**。

## 示例页入口

本地 `pnpm dev` → `/component` → **流程图组件**：

| 示例             | 用途                               |
| ---------------- | ---------------------------------- |
| **交互测试说明** | 操作 checklist + 控制台监控命令    |
| **基础使用**     | 小图：点击、拉线连接               |
| **状态管理**     | expose API：增删节点/边、撤销重做  |
| **空状态**       | `FlowEmptyState` 插槽              |
| **框选**         | Shift + 拖拽，24 节点批量选中      |
| **自定义节点**   | `nodeTypes` 注册表 + `v-slot:node` |
| **序列化**       | `exportJSON` / `importJSON` 按钮   |
| **连接线标签**   | 边 `label`、样式配置               |
| **配置**         | `useFlowConfig`、校验              |
| **完整功能**     | 小地图、工具栏、fitView            |
| **贝塞尔弧度**   | `bezierControlOffset`              |
| **性能测试**     | 大规模节点、FPS 面板               |

## 前端交互验收（建议 CPU 4× 限速）

Chrome DevTools → Performance → 齿轮 → **CPU: 4× slowdown**。

### 场景与及格线（业务图编辑器参考）

| #   | 操作           | 推荐规模         | 观察项                   | 参考及格线    |
| --- | -------------- | ---------------- | ------------------------ | ------------- |
| 1   | 画布平移       | 500–2000 节点    | 节点/边跟手、无分离      | 最低 FPS ≥ 30 |
| 2   | 拖单个节点     | 同上，穿过多条边 | 边端点贴端口；对齐参考线 | 最低 FPS ≥ 45 |
| 3   | 滚轮缩放       | 同上             | 以指针为中心、无连续长帧 | 无明显顿挫    |
| 4   | 端口拉线       | 小图即可         | 预览线、松手建边         | 功能正确      |
| 5   | Ctrl 多选 + 拖 | 10+ 节点         | 不误触画布平移           | 选择态正确    |
| 6   | Shift 框选     | 20+ 节点         | 框选矩形、选中集合       | 功能正确      |
| 7   | 剪贴板         | 若干节点         | Ctrl+C/X/V 复制移动      | 功能正确      |
| 8   | 边端点重连     | 有连线           | 拖端点到新端口           | 功能正确      |

### 绘制分层（Profiling 时对照）

```
FlowCanvas
├── FlowBackground（网格，平移时可能略滞后）
├── FlowViewportContainer（节点，CSS transform，跟手）
├── FlowEdges（SVG / Canvas，屏幕坐标 + 平移补偿层）
├── FlowSelectionBox（框选矩形）
├── FlowAlignmentGuides / FlowSnapGuides（吸附提示）
└── ConnectionPreview（拉线预览）
```

Performance 面板 Main 线程：关注 **Scripting**（边位置、裁剪、`stateFlush`）vs **Paint/Composite**。

### 内置性能监控（控制台）

```js
window.__flowPerformanceMonitor__.enable();
// 执行：平移 5s、拖节点 5s
window.__flowPerformanceMonitor__.printReport();
window.__flowPerformanceMonitor__.getSlowOperations(5, 20);
```

### 与 bench 的分工

| 工具                                             | 测什么                           | 不测什么           |
| ------------------------------------------------ | -------------------------------- | ------------------ |
| `pnpm bench:compare`                             | 视口内节点查询（R-Tree vs 线性） | DOM、SVG、拖拽 FPS |
| 本页 checklist + Performance                     | 绘制、拖拽、缩放体验             | 纯算法 μs 级差异   |
| `pnpm vitest run src/components/flow/__tests__/` | 回归、挂载、裁剪、序列化         | 真实帧率           |

---

## Vue Flow 功能对照（务实）

状态图例：**有** = 主路径可用 · **部分** = 有代码/API 未统一 · **无** = 尚未对标

### 画布与视口

| 能力            | Flow                     | Vue Flow               |
| --------------- | ------------------------ | ---------------------- |
| 平移 / 滚轮缩放 | 有                       | 有                     |
| 网格背景        | 有 `FlowBackground`      | `@vue-flow/background` |
| fitView         | 部分（expose `fitView`） | `fitView()` 内置       |
| Controls 按钮条 | 部分 `FlowToolbar`       | `@vue-flow/controls`   |
| 小地图          | 有 `FlowMinimap`         | `@vue-flow/minimap`    |
| 触摸 / pinch    | 配置项有，需实机测       | 较成熟                 |

### 节点

| 能力             | Flow                        | Vue Flow                 |
| ---------------- | --------------------------- | ------------------------ |
| 拖拽             | 有                          | 有                       |
| 多选 / 框选      | 有（Ctrl / Shift）          | 有                       |
| 自定义节点类型   | 有（`nodeTypes` + `#node`） | 有                       |
| 节点缩放 Resizer | 无                          | `@vue-flow/node-resizer` |
| 分组 / Parent    | 无                          | 有                       |

### 边与连接

| 能力                 | Flow                               | Vue Flow       |
| -------------------- | ---------------------------------- | -------------- |
| bezier / straight 等 | 有                                 | 有             |
| SVG + Canvas 大量边  | 有（阈值切换）                     | 以 SVG 为主    |
| 边 hover / 选中样式  | 有                                 | 有             |
| 边更新（拖端点重连） | 有（`reconnectable`）              | `onEdgeUpdate` |
| `isValidConnection`  | 有 `interaction.isValidConnection` | 内置 hook      |
| 边标签               | 部分（静态 label + 样式）          | 灵活           |

### 状态与生态

| 能力               | Flow   | Vue Flow     |
| ------------------ | ------ | ------------ |
| 撤销/重做          | 有     | 需插件或自研 |
| 剪贴板 / 序列化    | 有     | 需自研       |
| 受控 nodes/edges   | 有     | 有           |
| 自动布局 dagre/elk | 无内置 | 文档示例多   |
| DevTools           | 无     | 社区         |

### 建议补齐优先级

1. **P0**：`FlowExamples` 全场景可点测（框选、自定义节点、序列化已覆盖）
2. **P1**：Toolbar 折叠；触摸优化
3. **P2**：分组节点、布局插件

---

## 小地图（`FlowMinimap`）

```
minimap/minimap-math.ts   # 纯函数（可单测）
minimap/useFlowMinimap.ts # 布局 / 视口 / 拖拽
components/FlowMinimap.tsx
```

- **主题**：`syncAppTheme` + `--flow-*`；`flowDarkModeKey` 可覆盖暗色来源
- inject：`nodes`、`viewport`、`canvasRef`、`setViewport`（小地图勿传 `nodes={arr.value}` 破坏 inject）
- 拖节点时关闭红框过渡（`draggingNodeId`）

---

## 回归记录模板（可复制到 PR）

```markdown
### 环境

- 浏览器：Chrome \_\_\_
- 机器：\_\_\_
- CPU 限速：无 / 4×
- 节点/边：**_ / _**

### 交互

- [ ] 平移跟手
- [ ] 拖节点 + 边贴合 + 对齐线
- [ ] 缩放
- [ ] 拉线连接
- [ ] Shift 框选
- [ ] Ctrl+C/V 剪贴板
- [ ] 边端点重连
- [ ] bench:compare 无劣化

### 备注
```
