/** Flow 交互测试说明（操作 checklist + 文档入口） */

import { defineComponent } from 'vue';
import { NAlert, NCard, NH3, NLi, NOl, NText, NUl } from 'naive-ui';

export default defineComponent({
  name: 'FlowInteractionGuide',
  setup() {
    return () => (
      <NCard bordered class="border-purple-200 bg-purple-50/30">
        <NH3 class="border-b border-purple-200 pb-2 text-lg text-purple-900 font-semibold">
          交互与绘制测试说明
        </NH3>
        <NText class="mb-3 block text-sm text-gray-600">
          算法基准请用 <code class="rounded bg-white px-1">pnpm bench:compare</code>
          ；下方示例用于在浏览器里验证
          <strong>绘制、平移、拖节点、拉线、连接线标签、选中/删除连接线</strong>
          。高配 Mac 建议 Chrome Performance 里开 <strong>CPU 4×</strong> 再测。
        </NText>
        <NAlert type="info" class="mb-3" title="控制台性能采样">
          {{
            default: () => (
              <code class="text-xs">
                window.__flowPerformanceMonitor__.enable() → 操作画布 → printReport()
              </code>
            )
          }}
        </NAlert>
        <NOl class="mb-3 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <NLi>画布空白处平移 5s：节点与边是否跟手</NLi>
          <NLi>拖动一个节点穿过多条边：端点是否贴合端口</NLi>
          <NLi>滚轮缩放、从端口拖出连接线</NLi>
          <NLi>
            「画布背景 / 网格 / 刻度尺」：从刻度尺拖出橙色辅助线；拖动节点时是否吸附到辅助线 / 网格
          </NLi>
          <NLi>
            「连接线标签」示例：分支边上是否显示 <code class="rounded bg-white px-1">是/否</code>{' '}
            标签；切换背景/字号按钮是否生效
          </NLi>
          <NLi>
            点击连接线选中 → 点击线上的 <strong>× 删除按钮</strong> 移除（或按 Delete /
            Backspace，需先点击画布获得焦点）
          </NLi>
          <NLi>性能页将节点调到 500–2000 重复 1–2</NLi>
        </NOl>
        <NUl class="text-sm text-gray-600">
          <NLi>
            完整对照表：
            <code class="rounded bg-white px-1">
              src/components/flow/docs/INTERACTION_AND_FEATURES.md
            </code>
          </NLi>
          <NLi>单元测试：pnpm vitest run src/components/flow/__tests__/</NLi>
        </NUl>
      </NCard>
    );
  }
});
