# Flow 扩展点（Extension Points）

本文档列出 Flow 组件库提供的所有公共扩展点，便于在不修改库源码的前提下定制：节点、连接线、网格、路径、布局/槽位、键盘快捷键。

> 内部 API 不在此列。如确需深度扩展请使用 `@/components/flow/internal`，并注意其稳定性约束（不向后兼容）。

---

## 1. 自定义节点（nodeTypes）

`config.nodes.nodeTypes` 是节点类型 -> 组件 / 注册项的映射。FlowNodes 渲染顺序：

1. `<FlowCanvas v-slot:node="{ node, selected, locked, dragging }">` —— 最高优先级，逐节点完全自定义
2. `config.nodes.nodeTypes[node.type]` —— 注册表（可附 `defaultConfig`，addNode 时自动合并）
3. `BaseNode` —— 兜底默认渲染

```ts
import { useFlowConfig, type FlowConfig } from '@/components/flow';
import MyAINode from '@/components/MyAINode';

const { config, updateConfig } = useFlowConfig({ id: 'editor' });

updateConfig({
  nodes: {
    nodeTypes: {
      'ai.assistant': {
        name: 'AI Assistant',
        component: MyAINode,
        defaultConfig: {
          size: { width: 240, height: 120 },
          data: { color: 'purple' }
        }
      }
    }
  }
});
```

调用 `addNode({ id, type: 'ai.assistant', position, data: { ... } })` 时，`defaultConfig` 会与传入 node 浅合并；`data` / `style` 子对象再额外合并。

---

## 2. 自定义连接线路径（edgePathGenerators）

```ts
import type { FlowEdgePathGenerator } from '@/components/flow';

const sCurveGenerator: FlowEdgePathGenerator = params => {
  const { sourceX, sourceY, targetX, targetY } = params;
  const midX = (sourceX + targetX) / 2;
  return `M ${sourceX},${sourceY} Q ${midX},${sourceY} ${midX},${targetY} T ${targetX},${targetY}`;
};

updateConfig({
  edges: {
    defaultType: 'bezier',
    edgePathGenerators: {
      's-curve': sCurveGenerator
    }
  }
});

// 在 edge 数据上指定 type
addEdge({ id: 'e1', source: 'a', target: 'b', type: 's-curve' });
```

> Tip: 注册自定义路径生成器后，调用 `BaseEdge` 时也会自动使用，无需额外配置。

---

## 3. 自定义网格（registerGridGenerator）

`FlowBackground` 内部基于 `GridPatternGenerator` 接口生成 SVG `<pattern>`。

```ts
import { registerGridGenerator, type GridPatternGenerator } from '@/components/flow';

const hexagonGen: GridPatternGenerator = {
  generate({ size, color, opacity }) {
    return {
      patternId: `flow-hexagon-grid-${size}`,
      patternProps: { width: size * 1.732, height: size },
      children: `<polygon points="..." fill="${color}" opacity="${opacity}" />`
    };
  }
};

registerGridGenerator('hexagon', hexagonGen);
updateConfig({ canvas: { gridType: 'hexagon' as never } });
```

---

## 4. FlowCanvas 槽位（Slots）

| 名字         | 作用                                    | 参数（scoped）                                                 |
| ------------ | --------------------------------------- | -------------------------------------------------------------- |
| `background` | 替换默认网格背景                        | `{ viewport }`                                                 |
| `node`       | 自定义单个节点渲染                      | `{ node, selected, locked, dragging }`                         |
| `toolbar`    | 工具栏槽位（按需放置 FlowToolbar/自研） | `{ viewport, canUndo, canRedo, undo, redo, fitView }`          |
| `minimap`    | 小地图槽位                              | `{ nodes, viewport }`                                          |
| `overlays`   | 自由叠加层（高亮、提示、debug 信息）    | `{ viewport, nodes, edges, selectedNodeIds, selectedEdgeIds }` |
| `emptyState` | 空状态（无节点 / 无边时显示）           | —                                                              |
| `default`    | 兜底插槽，渲染在画布最后                | —                                                              |

```vue
<FlowCanvas :config="cfg" v-model:nodes="nodes" v-model:edges="edges">
  <template #node="{ node, selected, dragging }">
    <MyNode :node="node" :selected="selected" :dragging="dragging" />
  </template>
  <template #toolbar="{ canUndo, undo }">
    <NSpace>
      <NButton @click="undo" :disabled="!canUndo">Undo</NButton>
    </NSpace>
  </template>
  <template #emptyState>
    <div class="empty">点击右上角添加节点</div>
  </template>
</FlowCanvas>
```

---

## 5. FlowCanvasContext（inject）

子组件 / 自定义节点可以注入画布上下文，避免 prop 钻穿：

```ts
import { inject } from 'vue';
import { flowCanvasContextKey, type FlowCanvasContextValue } from '@/components/flow';

const ctx = inject<FlowCanvasContextValue>(flowCanvasContextKey)!;
// 读取
console.log(ctx.viewport.value, ctx.selection.selectedNodeIds.value);
// 写入
ctx.viewportActions.zoomViewport(1.2);
ctx.selection.selectNode('node-1');
```

---

## 6. 主题（flowDarkModeKey）

宿主自定义暗色模式来源：

```ts
import { provide } from 'vue';
import { flowDarkModeKey } from '@/components/flow';
import { useThemeStore } from '@/store/modules/theme';
import { storeToRefs } from 'pinia';

const themeStore = useThemeStore();
const { darkMode } = storeToRefs(themeStore);

provide(flowDarkModeKey, darkMode);
```

如果不显式 `provide`，Flow 会回退到 OS 偏好。

---

## 7. 插件（FlowPlugin）

```ts
import { FlowPluginLoader, type FlowPlugin } from '@/components/flow';

const myPlugin: FlowPlugin = {
  name: 'logger',
  setup(ctx) {
    ctx.events.on('onConnect', edge => console.log('connect', edge));
    return () => {
      /* dispose */
    };
  }
};

const loader = new FlowPluginLoader();
loader.load(myPlugin, context);
```

---

## 8. 自定义验证（isValidConnection）

```ts
updateConfig({
  interaction: {
    isValidConnection: async connection => {
      const { source, target } = connection;
      if (source === target) return false;
      return await checkServerCompatibility(source, target);
    }
  }
});
```

当 `isValidConnection` 返回 `false`，FlowCanvas 会 `emit('connect-reject', info)`，可监听后给出提示：

```vue
<FlowCanvas @connect-reject="onReject" />
```

---

## 9. 自定义边删除/标签等

- `config.edges.showDeleteButtonOnSelect` 控制是否在选中边时显示删除按钮
- `edge.label` 走默认 `EdgeLabel`，可通过 `edge.labelStyle` / `edge.labelBackgroundStyle` 覆盖样式
- 想完全替换边渲染：注册 `edgePathGenerators[type]`（路径层）或在 `slots.overlays` 中自绘 SVG

---

## 10. 关于深 import（deep import）

- 业务/宿主代码：仅使用 `from '@/components/flow'`（public API） + `from '@/components/flow/styles'`
- 测试 / 示例 / 包内：允许 `from '@/components/flow/internal'`
- ESLint 配置（`eslint.config.js`）会对宿主代码中的非法 deep import 给出 warning
