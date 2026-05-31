/**
 * 连接线选中态删除按钮（SVG）
 *
 * 渲染在路径中点，点击后触发 onDelete；样式由 .flow-edge-delete-button + CSS 变量控制。
 */

import { computed, defineComponent } from 'vue';
import { EDGE_CLASS_NAMES } from '../../constants/edge-constants';
import { useFlowI18n } from '../../hooks/useFlowI18n';

export default defineComponent({
  name: 'EdgeDeleteButton',
  props: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    size: {
      type: Number,
      default: 20
    },
    /** 覆盖默认无障碍文案 */
    ariaLabel: {
      type: String,
      default: undefined
    }
  },
  emits: ['delete'],
  setup(props, { emit }) {
    const { t } = useFlowI18n();
    const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('contextMenu.deleteEdge'));

    const handlePointerDown = (event: MouseEvent) => {
      event.stopPropagation();
    };

    const handleClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      emit('delete', event);
    };

    return () => {
      const { size } = props;
      const half = size / 2;
      const iconInset = size * 0.28;

      return (
        <g
          class={EDGE_CLASS_NAMES.DELETE_BUTTON}
          transform={`translate(${props.x - half}, ${props.y - half})`}
          pointer-events="all"
          onMousedown={handlePointerDown}
          onClick={handleClick}
        >
          <title>{resolvedAriaLabel.value}</title>
          <circle class={`${EDGE_CLASS_NAMES.DELETE_BUTTON}__bg`} cx={half} cy={half} r={half} />
          <path
            class={`${EDGE_CLASS_NAMES.DELETE_BUTTON}__icon`}
            d={`M ${iconInset} ${iconInset} L ${size - iconInset} ${size - iconInset} M ${size - iconInset} ${iconInset} L ${iconInset} ${size - iconInset}`}
          />
        </g>
      );
    };
  }
});
