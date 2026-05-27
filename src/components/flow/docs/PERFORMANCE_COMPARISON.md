# Flow 组件 vs Vue-Flow 性能对比分析

> 本文档区分 **可复现的基准数据**（本仓库 vitest）与 **机制对比**（架构差异）。  
> 旧版中的端到端百分比（如「1000 节点提升 73%」）已移除，因当时未安装 `@vue-flow/core` 做同场景对照。

## 如何复现

| 命令                                                                           | 说明                                                            |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `pnpm bench:compare`                                                           | 视口查询：Flow R-Tree / 线性 filter / Vue-Flow `getNodesInside` |
| `pnpm vitest run src/components/flow/__tests__/flow-vs-vueflow.timing.test.ts` | 200 次循环耗时（控制台输出）                                    |
| `pnpm test:flow-compare`                                                       | happy-dom 下轻量节点挂载耗时                                    |

测试数据与转换见 [`__tests__/benchmark-data.ts`](../__tests__/benchmark-data.ts)。  
环境：Vitest 4 + happy-dom，轻量 `div` 节点，Flow 开启视口裁剪，Vue-Flow 开启 `onlyRenderVisibleElements`。

---

## 实测结果（本机 vitest，供参考）

### 视口查询（200 次循环，视口 1000×1000）

| 节点数 | Flow R-Tree | 线性 filter | Vue-Flow `getNodesInside` |
| ------ | ----------- | ----------- | ------------------------- |
| 1000   | ~0.7ms      | ~2.1ms      | ~146ms                    |
| 10000  | ~0.3ms      | ~14.8ms     | ~1186ms                   |

说明：

- Flow 大规模场景下 R-Tree 相对线性 filter 约 **3×（1k）～50×（10k）**。
- Vue-Flow 的 `getNodesInside` 含 `nodeToRect`、重叠面积等逻辑，**不等于**简单 AABB filter；在纯查询微基准上反而更慢。XYFlow 上游亦指出：相交检测通常只占毫秒级，**DOM 挂载/卸载才是主瓶颈**（[xyflow#4239](https://github.com/xyflow/xyflow/issues/4239)）。

### 初始挂载（happy-dom，含 mount + 2× nextTick）

| 场景                                          | Flow  | Vue-Flow |
| --------------------------------------------- | ----- | -------- |
| 100 节点 / 50 边                              | ~22ms | ~18ms    |
| 1000 节点 / 200 边（Flow 开裁剪 + Canvas 边） | ~28ms | ~42ms    |

说明：happy-dom 与真实 Chrome 存在差异；结果随机器波动。1000 节点时 Flow 视口裁剪显著减少 DOM 节点数，故挂载更快。真实业务节点更重时，两者都会变慢，需用实际节点组件复测。

---

## 机制对比总览

| 优化项                | Flow 组件                                | Vue-Flow                    |
| --------------------- | ---------------------------------------- | --------------------------- |
| **空间索引**          | R-Tree（rbush），节点 > 阈值自动启用     | O(n) `getNodesInside`       |
| **视口裁剪**          | `useViewportCulling` + 可选 SpatialIndex | `onlyRenderVisibleElements` |
| **增量更新**          | `incremental-update-utils` 保持节点引用  | Vue 响应式 + store          |
| **RAF 节流**          | `useRafThrottle`、拖拽/连接统一节流      | d3-zoom + 依赖追踪优化      |
| **边渲染**            | SVG / Canvas 自动切换（可配置阈值）      | 以 SVG 为主                 |
| **事件委托**          | `createEventDelegation` 容器级           | 每节点/边组件绑定           |
| **对象池 / 命令模式** | 内置                                     | 无对等内置                  |
| **生态**              | 项目内自维护                             | `@vue-flow/*` 官方插件      |

---

## Flow 独有优化（代码位置）

### 1. 空间索引（R-Tree）

- 实现：[`SpatialIndex.ts`](../core/performance/SpatialIndex.ts)
- Hook：[`useSpatialIndex`](../hooks/useSpatialIndex.ts)、[`useViewportCulling`](../hooks/useViewportCulling.ts)

### 2. 视口裁剪

- 平移时可暂停裁剪更新（`isPanning`）
- 与 R-Tree 组合用于大规模图

### 3. 增量更新

- [`incremental-update-utils.ts`](../core/state/utils/incremental-update-utils.ts)

### 4. Canvas 边渲染

- [`FlowEdges.tsx`](../components/FlowEdges.tsx)：`enableCanvasRendering` + `canvasThreshold`

### 5. 事件委托

- [`event-utils.ts`](../utils/event-utils.ts)

### 6. 对象池与命令模式

- [`ObjectPool.ts`](../core/performance/ObjectPool.ts)、[`CommandManager.ts`](../core/commands/CommandManager.ts)

---

## 代码质量对比（摘要）

| 维度 | Flow | Vue-Flow |
| --- | --- | --- |
| 可定制 / 性能调参 | 高（配置项丰富） | 中（props + 插件） |
| 维护成本 | ~2.2 万行自研核心 | 社区维护 |
| 类型与校验 | Zod + 完整 TS | 官方 TS 类型 |
| 测试 | 算法 bench + 对比测试（本目录 `__tests__`） | 需自行集成验证 |
| 架构债 | 已通过 `useFlowCanvasCore` 拆分 `FlowCanvas`，主链路职责更清晰 | — |

---

## 选型建议

**继续用 Flow：**

- 常态数百～上千节点/边，且已依赖 R-Tree、Canvas 边、命令撤销等能力。
- 团队可维护 `src/components/flow`。

**考虑 Vue-Flow：**

- 多数画布 < 100 节点，优先交付速度与 Minimap/Controls 等插件。
- 节点 UI 极重时，应先优化节点组件本身，换库收益有限。

---

## 性能监控

```tsx
<FlowPerformanceMonitor
  :totalNodes="nodes.length"
  :visibleNodes="visibleNodes.length"
  :totalEdges="edges.length"
  :visibleEdges="visibleEdges.length"
/>
```

---

## 变更记录

- **2025-05**：新增 `pnpm bench:compare`、`test:flow-compare`；用实测数据替换未验证的端到端百分比；补充方法论与 XYFlow 上游结论引用。
