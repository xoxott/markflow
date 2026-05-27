/** Flow 流程图组件示例集合 — 交互实验室 + 性能压测 */
import { defineComponent } from 'vue';
import {
  FlowBasicExample,
  FlowBezierExample,
  FlowConfigExample,
  FlowEdgeLabelExample,
  FlowFullFeatureExample,
  FlowInteractionGuide,
  FlowPerformanceExample
} from './index';

export const FlowExamples = defineComponent({
  name: 'FlowExamples',
  setup() {
    return () => (
      <div class="space-y-6">
        <FlowInteractionGuide />

        <FlowBasicExample />

        <FlowEdgeLabelExample />

        <FlowConfigExample />

        <FlowFullFeatureExample />

        <FlowBezierExample />

        <FlowPerformanceExample />
      </div>
    );
  }
});
