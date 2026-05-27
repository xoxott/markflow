/**
 * Flow 工具栏组件
 *
 * 提供画布操作工具栏，包括缩放、适应视图等操作 外观由 .flow-toolbar + --flow-toolbar-*（在 FlowCanvas 上注入）控制
 */

import { type CSSProperties, type PropType, computed, defineComponent } from 'vue';
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
  style?: CSSProperties;
  /** CSS 类名 */
  class?: string;
  /** 缩放变化事件 */
  onZoomChange?: (zoom: number) => void;
  /** 适应视图事件 */
  onFitView?: () => void;
  /** 重置视图事件 */
  onResetView?: () => void;
  /** 布局是否锁定（锁定后仅可平移/缩放画布） */
  layoutLocked?: boolean;
  /** 是否显示布局锁定按钮 */
  showLayoutLock?: boolean;
  /** 布局锁定状态变化 */
  onLayoutLockChange?: (locked: boolean) => void;
}

/** Flow 工具栏组件 */
export default defineComponent({
  name: 'FlowToolbar',
  props: {
    viewport: {
      type: Object as PropType<FlowViewport>,
      default: () => ({ x: 0, y: 0, zoom: 1 })
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
      type: Object as PropType<CSSProperties>,
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
    },
    layoutLocked: {
      type: Boolean,
      default: false
    },
    showLayoutLock: {
      type: Boolean,
      default: true
    },
    onLayoutLockChange: {
      type: Function as PropType<(locked: boolean) => void>,
      default: undefined
    }
  },
  setup(props) {
    const safeViewport = computed<FlowViewport>(() => {
      const vp = props.viewport;
      if (vp && typeof vp.zoom === 'number') return vp;
      return { x: 0, y: 0, zoom: 1 };
    });

    const zoomPercent = computed(() => Math.round(safeViewport.value.zoom * 100));

    const toolbarClass = computed(() =>
      `flow-toolbar flow-toolbar--${props.position} ${props.class}`.trim()
    );

    const handleZoomIn = () => {
      const newZoom = Math.min(props.maxZoom, safeViewport.value.zoom + props.zoomStep);
      props.onZoomChange?.(newZoom);
    };

    const handleZoomOut = () => {
      const newZoom = Math.max(props.minZoom, safeViewport.value.zoom - props.zoomStep);
      props.onZoomChange?.(newZoom);
    };

    const handleToggleLayoutLock = () => {
      props.onLayoutLockChange?.(!props.layoutLocked);
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
            disabled={safeViewport.value.zoom <= props.minZoom}
          >
            −
          </button>

          <div class="flow-toolbar-zoom">{zoomPercent.value}%</div>

          <button
            class="flow-toolbar-button"
            type="button"
            onClick={handleZoomIn}
            disabled={safeViewport.value.zoom >= props.maxZoom}
          >
            +
          </button>

          {props.showLayoutLock && props.onLayoutLockChange && (
            <button
              class={[
                'flow-toolbar-button',
                'flow-toolbar-button--spaced',
                props.layoutLocked && 'flow-toolbar-button--active'
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              title={props.layoutLocked ? '解锁节点布局，可拖拽节点' : '锁定节点布局，仅可拖动画布'}
              onClick={handleToggleLayoutLock}
            >
              {props.layoutLocked ? '解锁' : '锁定'}
            </button>
          )}

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
