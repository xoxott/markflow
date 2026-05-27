import {
  CSSProperties,
  Fragment,
  type PropType,
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref
} from 'vue';
import type { FlowConfig, FlowPosition, FlowViewport } from '../types';
import type { FlowGuideAxis } from '../types/flow-guide';
import {
  type RulerTick,
  computeRulerTicks,
  flowToScreen,
  formatRulerLabel
} from '../utils/ruler-utils';

export interface FlowRulerProps {
  viewport: FlowViewport;
  config?: Readonly<FlowConfig>;
  /** 拖拽吸附时的参考位置（高亮刻度） */
  snapGuide?: FlowPosition | null;
  /** 从刻度尺拖出辅助线 */
  onRulerPointerDown?: (axis: FlowGuideAxis, event: MouseEvent) => void;
}

export default defineComponent({
  name: 'FlowRuler',
  props: {
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    config: {
      type: Object as PropType<Readonly<FlowConfig>>,
      default: undefined
    },
    snapGuide: {
      type: Object as PropType<FlowPosition | null>,
      default: null
    },
    onRulerPointerDown: {
      type: Function as PropType<(axis: FlowGuideAxis, event: MouseEvent) => void>,
      default: undefined
    }
  },
  setup(props) {
    const hostRef = ref<HTMLElement | null>(null);
    const width = ref(0);
    const height = ref(0);
    let observer: ResizeObserver | null = null;

    onMounted(() => {
      const host = hostRef.value?.parentElement;
      if (!host) {
        return;
      }
      const updateSize = () => {
        width.value = host.clientWidth;
        height.value = host.clientHeight;
      };
      updateSize();
      observer = new ResizeObserver(updateSize);
      observer.observe(host);
    });

    onUnmounted(() => {
      observer?.disconnect();
    });

    const rulerSize = computed(() => props.config?.canvas?.rulerSize ?? 24);
    const gridSize = computed(() => props.config?.canvas?.gridSize ?? 20);

    const horizontalTicks = computed(() =>
      computeRulerTicks({
        viewport: props.viewport,
        canvasSize: width.value,
        rulerSize: rulerSize.value,
        axis: 'horizontal',
        gridSize: gridSize.value
      })
    );

    const verticalTicks = computed(() =>
      computeRulerTicks({
        viewport: props.viewport,
        canvasSize: height.value,
        rulerSize: rulerSize.value,
        axis: 'vertical',
        gridSize: gridSize.value
      })
    );

    const snapScreen = computed(() => {
      if (!props.snapGuide) {
        return null;
      }
      return {
        x: flowToScreen(props.snapGuide.x, props.viewport.x, props.viewport.zoom),
        y: flowToScreen(props.snapGuide.y, props.viewport.y, props.viewport.zoom)
      };
    });

    /** 刻度线的物理长度（像素） */
    const tickLength = (level: RulerTick['level'], rulerThickness: number): number => {
      const ratio = level === 'major' ? 0.55 : level === 'medium' ? 0.42 : 0.28;
      return Math.round(rulerThickness * ratio);
    };

    /**
     * 渲染单条刻度（CSS 绝对定位）
     *
     * - 横向：从顶端向下延伸 tickLength
     * - 纵向：从左端向右延伸 tickLength
     */
    const renderTick = (
      tick: RulerTick,
      axis: 'horizontal' | 'vertical',
      rulerThickness: number
    ) => {
      const length = tickLength(tick.level, rulerThickness);
      const isHorizontal = axis === 'horizontal';

      /** 与吸附锚点共用 Math.round 取整：确保刻度线和吸附线落在同一像素上 */
      const pixel = Math.round(tick.screenCoord);

      const tickStyle: CSSProperties = isHorizontal
        ? {
            left: `${pixel}px`,
            bottom: '0',
            width: '1px',
            height: `${length}px`
          }
        : {
            top: `${pixel}px`,
            right: '0',
            height: '1px',
            width: `${length}px`
          };

      const labelStyle: CSSProperties | undefined = tick.isMajor
        ? isHorizontal
          ? {
              left: `${pixel}px`,
              top: '1px',
              transform: 'translateX(-50%)'
            }
          : {
              top: `${pixel}px`,
              left: '2px',
              transform: 'translateY(-50%)'
            }
        : undefined;

      return (
        <Fragment>
          <div
            class="flow-ruler__tick"
            data-level={tick.level}
            data-major={tick.isMajor ? 'true' : undefined}
            style={tickStyle}
          />
          {tick.isMajor && tick.label && (
            <div class="flow-ruler__label" style={labelStyle}>
              {tick.label}
            </div>
          )}
        </Fragment>
      );
    };

    /**
     * 吸附锚点：宽度 0 的容器
     *
     * - 吸附线与数字徽标都是它的子元素，相对它定位
     * - 锚点本身用 `left: snapScreen.x` 放在精确像素上
     * - 这样徽标和线**只能**绑定到同一个像素，理论上无法错位
     */
    const renderSnapAnchor = (axis: 'horizontal' | 'vertical') => {
      const snap = snapScreen.value;
      if (!snap || !props.snapGuide) {
        return null;
      }

      const isHorizontal = axis === 'horizontal';
      const screenCoord = isHorizontal ? snap.x : snap.y;
      const size = rulerSize.value;
      const limit = isHorizontal ? width.value : height.value;

      if (screenCoord < size - 0.5 || screenCoord > limit + 0.5) {
        return null;
      }

      /** 整数像素：与刻度线使用同样的 Math.round 规则，保证视觉重合 */
      const pixel = Math.round(screenCoord);

      const anchorStyle: CSSProperties = isHorizontal
        ? {
            left: `${pixel}px`,
            top: '0',
            height: `${size}px`,
            width: '0'
          }
        : {
            top: `${pixel}px`,
            left: '0',
            width: `${size}px`,
            height: '0'
          };

      const flowValue = isHorizontal ? props.snapGuide.x : props.snapGuide.y;

      return (
        <div
          class={[
            'flow-ruler__snap-anchor',
            isHorizontal
              ? 'flow-ruler__snap-anchor--horizontal'
              : 'flow-ruler__snap-anchor--vertical'
          ]}
          style={anchorStyle}
        >
          <div
            class={[
              'flow-ruler__snap-line',
              isHorizontal ? 'flow-ruler__snap-line--vertical' : 'flow-ruler__snap-line--horizontal'
            ]}
          />
          <div
            class={[
              'flow-ruler__snap-chip',
              isHorizontal ? 'flow-ruler__snap-chip--horizontal' : 'flow-ruler__snap-chip--vertical'
            ]}
          >
            {formatRulerLabel(flowValue)}
          </div>
        </div>
      );
    };

    /** 渲染一条轴（横向或纵向） */
    const renderAxis = (
      axis: 'horizontal' | 'vertical',
      ticks: RulerTick[],
      rulerThickness: number
    ) => {
      const isHorizontal = axis === 'horizontal';
      return (
        <div
          class={[
            'flow-ruler__axis',
            isHorizontal ? 'flow-ruler__axis--horizontal' : 'flow-ruler__axis--vertical'
          ]}
        >
          {ticks.map(tick => (
            <Fragment key={`${axis}-${tick.flowCoord}`}>
              {renderTick(tick, axis, rulerThickness)}
            </Fragment>
          ))}
          {renderSnapAnchor(axis)}
        </div>
      );
    };

    return () => {
      const size = rulerSize.value;
      if (width.value <= 0 || height.value <= 0) {
        return <div ref={hostRef} class="flow-ruler" style={{ display: 'none' }} />;
      }

      return (
        <div ref={hostRef} class="flow-ruler" style={{ '--flow-ruler-size': `${size}px` }}>
          <div class="flow-ruler__corner" />
          <div
            class="flow-ruler__hit flow-ruler__hit--horizontal"
            onMousedown={event => props.onRulerPointerDown?.('horizontal', event)}
          />
          <div
            class="flow-ruler__hit flow-ruler__hit--vertical"
            onMousedown={event => props.onRulerPointerDown?.('vertical', event)}
          />
          {renderAxis('horizontal', horizontalTicks.value, size)}
          {renderAxis('vertical', verticalTicks.value, size)}
        </div>
      );
    };
  }
});
