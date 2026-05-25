/**
 * Flow 工具栏组件
 *
 * 提供画布操作工具栏，包括缩放、适应视图等操作 外观由 .flow-toolbar + --flow-toolbar-*（在 FlowCanvas 上注入）控制
 */

import { type PropType, computed, defineComponent } from 'vue';
import type { FlowViewport } from '../types';

/** FlowToolbar 组件属性 */
export interface FlowToolbarProps {
  /** 视口状态 */
  viewport: FlowViewport;
  /** 最小缩放 */
  minZoom?: number;
  /** 最大缩放 */
  maxZoom?: number;
  /** 缩放步长 */
  zoomStep?: number;
  /** 工具栏位置 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 是否显示 */
  visible?: boolean;
  /** 自定义样式（布局覆盖，勿写死颜色） */
  style?: Record<string, unknown>;
  /** CSS 类名 */
  class?: string;
  /** 缩放变化事件 */
  onZoomChange?: (zoom: number) => void;
  /** 适应视图事件 */
  onFitView?: () => void;
  /** 重置视图事件 */
  onResetView?: () => void;
}

/** Flow 工具栏组件 */
export default defineComponent({
  name: 'FlowToolbar',
  props: {
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    minZoom: {
      type: Number,
      default: 0.1
    },
    maxZoom: {
      type: Number,
      default: 4
    },
    zoomStep: {
      type: Number,
      default: 0.1
    },
    position: {
      type: String as PropType<'top' | 'bottom' | 'left' | 'right'>,
      default: 'top'
    },
    visible: {
      type: Boolean,
      default: true
    },
    style: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({})
    },
    class: {
      type: String,
      default: ''
    },
    onZoomChange: {
      type: Function as PropType<(zoom: number) => void>,
      default: undefined
    },
    onFitView: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    onResetView: {
      type: Function as PropType<() => void>,
      default: undefined
    }
  },
  setup(props) {
    const zoomPercent = computed(() => Math.round(props.viewport.zoom * 100));

    const toolbarClass = computed(() =>
      `flow-toolbar flow-toolbar--${props.position} ${props.class}`.trim()
    );

    const handleZoomIn = () => {
      const newZoom = Math.min(props.maxZoom, props.viewport.zoom + props.zoomStep);
      props.onZoomChange?.(newZoom);
    };

    const handleZoomOut = () => {
      const newZoom = Math.max(props.minZoom, props.viewport.zoom - props.zoomStep);
      props.onZoomChange?.(newZoom);
    };

    return () => {
      if (!props.visible) {
        return null;
      }

      return (
        <div class={toolbarClass.value} style={props.style}>
          <button
            class="flow-toolbar-button"
            type="button"
            onClick={handleZoomOut}
            disabled={props.viewport.zoom <= props.minZoom}
          >
            −
          </button>

          <div class="flow-toolbar-zoom">{zoomPercent.value}%</div>

          <button
            class="flow-toolbar-button"
            type="button"
            onClick={handleZoomIn}
            disabled={props.viewport.zoom >= props.maxZoom}
          >
            +
          </button>

          {props.onFitView && (
            <button
              class="flow-toolbar-button flow-toolbar-button--spaced"
              type="button"
              onClick={props.onFitView}
            >
              适应
            </button>
          )}

          {props.onResetView && (
            <button class="flow-toolbar-button" type="button" onClick={props.onResetView}>
              重置
            </button>
          )}
        </div>
      );
    };
  }
});
