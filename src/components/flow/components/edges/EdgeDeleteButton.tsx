/**
 * 连接线选中态删除按钮（SVG）
 *
 * 渲染在路径中点，点击后触发 onDelete；样式由 .flow-edge-delete-button + CSS 变量控制。
 */

import { defineComponent } from 'vue';
import { EDGE_CLASS_NAMES } from '../../constants/edge-constants';

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
    ariaLabel: {
      type: String,
      default: '删除连接线'
    }
  },
  emits: ['delete'],
  setup(props, { emit }) {
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
          <title>{props.ariaLabel}</title>
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
