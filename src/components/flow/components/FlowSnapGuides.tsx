/**
 * 拖拽吸附对齐参考线（网格 / 辅助线吸附指示）
 */

import { type PropType, computed, defineComponent } from 'vue';
import type { FlowPosition, FlowViewport } from '../types';
import { flowPointToScreen } from '../utils/ruler-utils';

export interface FlowSnapGuidesProps {
  viewport: FlowViewport;
  snapGuide: FlowPosition | null;
  visible?: boolean;
  /** 使用 canvas 绝对坐标（与刻度尺一致），默认 true */
  canvasAbsolute?: boolean;
}

export default defineComponent({
  name: 'FlowSnapGuides',
  props: {
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    snapGuide: {
      type: Object as PropType<FlowPosition | null>,
      default: null
    },
    visible: {
      type: Boolean,
      default: true
    },
    canvasAbsolute: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    /** 与刻度尺使用相同的 Math.round 整像素：保证画布吸附线和刻度尺吸附线落在同一像素 */
    const screenPoint = computed(() => {
      if (!props.visible || !props.snapGuide) {
        return null;
      }
      const raw = props.canvasAbsolute
        ? flowPointToScreen(props.snapGuide, props.viewport)
        : (() => {
            const zoom = Math.max(props.viewport.zoom, 0.01);
            return {
              x: props.snapGuide.x * zoom,
              y: props.snapGuide.y * zoom
            };
          })();
      return {
        x: Math.round(raw.x),
        y: Math.round(raw.y)
      };
    });

    return () => {
      const point = screenPoint.value;
      if (!point) {
        return null;
      }

      const rootClass = props.canvasAbsolute
        ? 'flow-snap-guides flow-snap-guides--canvas'
        : 'flow-snap-guides flow-snap-guides--viewport';

      return (
        <div class={rootClass}>
          <div
            class="flow-snap-guides__line flow-snap-guides__line--vertical"
            style={{ left: `${point.x}px` }}
          />
          <div
            class="flow-snap-guides__line flow-snap-guides__line--horizontal"
            style={{ top: `${point.y}px` }}
          />
          <div
            class="flow-snap-guides__crosshair"
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`
            }}
          />
        </div>
      );
    };
  }
});
