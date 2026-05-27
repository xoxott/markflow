/**
 * 连接线标签（路径中点描述文本）
 *
 * 通过 edge.label + config.edges 默认样式配置；复杂内容请用 edgeTypes 自定义边组件。
 */

import { type CSSProperties, type PropType, computed, defineComponent } from 'vue';
import type { FlowConfig } from '../../types/flow-config';
import type { FlowEdge } from '../../types/flow-edge';
import { EDGE_CLASS_NAMES, LABEL_STYLES } from '../../constants/edge-constants';
import { estimateEdgeLabelWidth, resolveEdgeLabelStyle } from '../../utils/edge-label-utils';

export default defineComponent({
  name: 'EdgeLabel',
  props: {
    edge: {
      type: Object as PropType<FlowEdge>,
      required: true
    },
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    config: {
      type: Object as PropType<Readonly<FlowConfig>>,
      default: undefined
    }
  },
  setup(props) {
    const labelText = computed(() => props.edge.label?.trim() ?? '');

    const resolved = computed(() => resolveEdgeLabelStyle(props.edge, props.config));

    const textWidth = computed(() =>
      estimateEdgeLabelWidth(labelText.value, resolved.value.fontSize)
    );

    return () => {
      const text = labelText.value;
      if (!text) {
        return null;
      }

      const style = resolved.value;
      const width = textWidth.value + style.padding * 2;
      const lineHeight = style.fontSize * 1.25;
      const height = lineHeight + style.padding * 2;
      const textStyle = {
        fontSize: `${style.fontSize}px`,
        fontWeight: '500',
        fill: style.fill,
        pointerEvents: 'none',
        userSelect: 'none',
        ...style.textStyle
      } as CSSProperties;

      return (
        <g class={EDGE_CLASS_NAMES.LABEL} pointer-events="none">
          {style.showBackground && (
            <rect
              class={`${EDGE_CLASS_NAMES.LABEL}__bg`}
              x={props.x - width / 2}
              y={props.y - height / 2}
              width={width}
              height={height}
              rx={style.borderRadius}
              ry={style.borderRadius}
              fill={style.backgroundFill}
              stroke="var(--flow-edge-label-border, rgba(148, 163, 184, 0.45))"
              stroke-width={1}
              style={style.backgroundStyle}
            />
          )}
          <text
            class={`${EDGE_CLASS_NAMES.LABEL}__text`}
            x={props.x}
            y={props.y}
            text-anchor={LABEL_STYLES.TEXT_ANCHOR}
            dominant-baseline={LABEL_STYLES.DOMINANT_BASELINE}
            stroke="var(--flow-edge-label-halo, var(--flow-edge-label-bg, #ffffff))"
            stroke-width={style.showBackground ? 0 : Math.max(2.5, style.fontSize * 0.22)}
            paint-order="stroke fill"
            style={textStyle}
          >
            {text}
          </text>
        </g>
      );
    };
  }
});
