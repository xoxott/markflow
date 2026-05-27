/** 拖拽时节点对齐参考线（相对其他节点左/右/中、上/下/中） */

import { type PropType, computed, defineComponent } from 'vue';
import type { FlowViewport } from '../types';
import type { AlignmentGuideLines } from '../utils/alignment-utils';
import { flowPointToScreen } from '../utils/ruler-utils';

export interface FlowAlignmentGuidesProps {
  viewport: FlowViewport;
  guides: AlignmentGuideLines;
  visible?: boolean;
}

export default defineComponent({
  name: 'FlowAlignmentGuides',
  props: {
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    guides: {
      type: Object as PropType<AlignmentGuideLines>,
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const screenLines = computed(() => {
      if (!props.visible) {
        return { vertical: [] as number[], horizontal: [] as number[] };
      }
      const toScreenX = (flowX: number) =>
        Math.round(flowPointToScreen({ x: flowX, y: 0 }, props.viewport).x);
      const toScreenY = (flowY: number) =>
        Math.round(flowPointToScreen({ x: 0, y: flowY }, props.viewport).y);

      return {
        vertical: props.guides.vertical.map(toScreenX),
        horizontal: props.guides.horizontal.map(toScreenY)
      };
    });

    return () => {
      const lines = screenLines.value;
      if (lines.vertical.length === 0 && lines.horizontal.length === 0) {
        return null;
      }

      return (
        <div class="flow-alignment-guides flow-alignment-guides--canvas">
          {lines.vertical.map(x => (
            <div
              key={`v-${x}`}
              class="flow-alignment-guides__line flow-alignment-guides__line--vertical"
              style={{ left: `${x}px` }}
            />
          ))}
          {lines.horizontal.map(y => (
            <div
              key={`h-${y}`}
              class="flow-alignment-guides__line flow-alignment-guides__line--horizontal"
              style={{ top: `${y}px` }}
            />
          ))}
        </div>
      );
    };
  }
});
