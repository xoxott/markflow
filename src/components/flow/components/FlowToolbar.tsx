/**
 * Flow 工具栏组件
 *
 * 提供画布操作工具栏，包括缩放、适应视图等操作 外观由 .flow-toolbar + --flow-toolbar-*（在 FlowCanvas 上注入）控制
 */

import { type CSSProperties, type PropType, computed, defineComponent } from 'vue';
import { NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { useFlowI18n } from '../hooks/useFlowI18n';
import type { FlowLocale, FlowViewport } from '../types';

type ToolbarTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface ToolbarIconButtonOptions {
  icon: string;
  ariaLabel: string;
  tooltip?: string;
  placement: ToolbarTooltipPlacement;
  active?: boolean;
  disabled?: boolean;
  ariaPressed?: boolean;
  onClick: () => void;
}

function renderToolbarIconButton({
  icon,
  ariaLabel,
  tooltip,
  placement,
  active,
  disabled,
  ariaPressed,
  onClick
}: ToolbarIconButtonOptions) {
  const className = ['flow-toolbar-button', active && 'flow-toolbar-button--active']
    .filter(Boolean)
    .join(' ');

  const button = (
    <button
      class={className}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon icon={icon} class="flow-toolbar-button__icon" />
    </button>
  );

  return (
    <NTooltip placement={placement}>
      {{
        trigger: () => (disabled ? <span class="flow-toolbar-button-wrap">{button}</span> : button),
        default: () => tooltip ?? ariaLabel
      }}
    </NTooltip>
  );
}

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
  /** 是否显示刻度尺 */
  showRuler?: boolean;
  /** 是否显示刻度尺开关 */
  showRulerToggle?: boolean;
  /** 刻度尺显示状态变化 */
  onShowRulerChange?: (show: boolean) => void;
  /** 拖拽对齐参考线是否开启 */
  dragSnapGuides?: boolean;
  /** 是否显示对齐线开关 */
  showDragSnapGuidesToggle?: boolean;
  /** 拖拽对齐参考线状态变化 */
  onDragSnapGuidesChange?: (enabled: boolean) => void;
  /** 覆盖 config 中的 locale */
  locale?: FlowLocale;
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
    },
    showRuler: {
      type: Boolean,
      default: false
    },
    showRulerToggle: {
      type: Boolean,
      default: true
    },
    onShowRulerChange: {
      type: Function as PropType<(show: boolean) => void>,
      default: undefined
    },
    dragSnapGuides: {
      type: Boolean,
      default: false
    },
    showDragSnapGuidesToggle: {
      type: Boolean,
      default: true
    },
    onDragSnapGuidesChange: {
      type: Function as PropType<(enabled: boolean) => void>,
      default: undefined
    },
    locale: {
      type: String as PropType<FlowLocale>,
      default: undefined
    }
  },
  setup(props) {
    const { t } = useFlowI18n({ locale: props.locale });
    const safeViewport = computed<FlowViewport>(() => {
      const vp = props.viewport;
      if (vp && typeof vp.zoom === 'number') return vp;
      return { x: 0, y: 0, zoom: 1 };
    });

    const zoomPercent = computed(() => Math.round(safeViewport.value.zoom * 100));

    const toolbarClass = computed(() =>
      `flow-toolbar flow-toolbar--${props.position} ${props.class}`.trim()
    );

    const tooltipPlacement = computed<ToolbarTooltipPlacement>(() => {
      switch (props.position) {
        case 'bottom':
          return 'top';
        case 'left':
          return 'right';
        case 'right':
          return 'left';
        default:
          return 'bottom';
      }
    });

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

    const handleToggleShowRuler = () => {
      props.onShowRulerChange?.(!props.showRuler);
    };

    const handleToggleDragSnapGuides = () => {
      props.onDragSnapGuidesChange?.(!props.dragSnapGuides);
    };

    return () => {
      if (!props.visible) {
        return null;
      }

      return (
        <div class={toolbarClass.value} style={props.style}>
          {renderToolbarIconButton({
            icon: 'mdi:minus',
            ariaLabel: t('toolbar.zoomOut'),
            placement: tooltipPlacement.value,
            disabled: safeViewport.value.zoom <= props.minZoom,
            onClick: handleZoomOut
          })}

          <div class="flow-toolbar-zoom">{zoomPercent.value}%</div>

          {renderToolbarIconButton({
            icon: 'mdi:plus',
            ariaLabel: t('toolbar.zoomIn'),
            placement: tooltipPlacement.value,
            disabled: safeViewport.value.zoom >= props.maxZoom,
            onClick: handleZoomIn
          })}

          {props.showLayoutLock &&
            props.onLayoutLockChange &&
            renderToolbarIconButton({
              icon: props.layoutLocked ? 'mdi:lock' : 'mdi:lock-open-variant-outline',
              ariaLabel: props.layoutLocked ? t('toolbar.layoutUnlock') : t('toolbar.layoutLock'),
              tooltip: props.layoutLocked
                ? t('toolbar.layoutUnlockTitle')
                : t('toolbar.layoutLockTitle'),
              placement: tooltipPlacement.value,
              active: props.layoutLocked,
              onClick: handleToggleLayoutLock
            })}

          {props.showRulerToggle &&
            props.onShowRulerChange &&
            renderToolbarIconButton({
              icon: 'mdi:ruler-square',
              ariaLabel: props.showRuler
                ? t('toolbar.rulerHideTitle')
                : t('toolbar.rulerShowTitle'),
              tooltip: props.showRuler ? t('toolbar.rulerHideTitle') : t('toolbar.rulerShowTitle'),
              placement: tooltipPlacement.value,
              active: props.showRuler,
              ariaPressed: props.showRuler,
              onClick: handleToggleShowRuler
            })}

          {props.showDragSnapGuidesToggle &&
            props.onDragSnapGuidesChange &&
            renderToolbarIconButton({
              icon: 'mdi:vector-line',
              ariaLabel: props.dragSnapGuides
                ? t('toolbar.dragSnapGuidesDisableTitle')
                : t('toolbar.dragSnapGuidesEnableTitle'),
              tooltip: props.dragSnapGuides
                ? t('toolbar.dragSnapGuidesDisableTitle')
                : t('toolbar.dragSnapGuidesEnableTitle'),
              placement: tooltipPlacement.value,
              active: props.dragSnapGuides,
              ariaPressed: props.dragSnapGuides,
              onClick: handleToggleDragSnapGuides
            })}

          {props.onFitView &&
            renderToolbarIconButton({
              icon: 'mdi:fit-to-screen-outline',
              ariaLabel: t('toolbar.fitView'),
              placement: tooltipPlacement.value,
              onClick: props.onFitView
            })}

          {props.onResetView &&
            renderToolbarIconButton({
              icon: 'mdi:restore',
              ariaLabel: t('toolbar.resetView'),
              placement: tooltipPlacement.value,
              onClick: props.onResetView
            })}
        </div>
      );
    };
  }
});
