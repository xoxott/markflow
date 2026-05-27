/** Flow 流程图组件示例集合 — 交互实验室 + 性能压测 */
import { defineComponent } from 'vue';
import {
  FlowBasicExample,
  FlowBezierExample,
  FlowBoxSelectionExample,
  FlowConfigExample,
  FlowCustomNodeExample,
  FlowEdgeLabelExample,
  FlowEmptyExample,
  FlowFullFeatureExample,
  FlowInteractionGuide,
  FlowPerformanceExample,
  FlowPersistenceExample,
  FlowStateExample
} from './index';

export const FlowExamples = defineComponent({
  name: 'FlowExamples',
  setup() {
    return () => (
      <div class="space-y-6">
        <FlowInteractionGuide />

        <FlowBasicExample />

        <FlowStateExample />

        <FlowEmptyExample />

        <FlowBoxSelectionExample />

        <FlowCustomNodeExample />

        <FlowPersistenceExample />

        <FlowEdgeLabelExample />

        <FlowConfigExample />

        <FlowFullFeatureExample />

        <FlowBezierExample />

        <FlowPerformanceExample />
      </div>
    );
  }
});
