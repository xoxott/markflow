/**
 * 连接线 Canvas 渲染器组件
 *
 * 负责使用 Canvas 渲染大量连接线，提供更好的性能
 */

import { type PropType, computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRafThrottle } from '../../hooks/useRafThrottle';
import type { FlowEdge, FlowViewport } from '../../types';
import type { EdgePositions } from '../../hooks/useEdgePositions';
import { drawEdgesOnCanvas, ensureCanvasLayoutSize } from '../../utils/edge-canvas-draw';

/** EdgeCanvasRenderer 组件属性 */
export interface EdgeCanvasRendererProps {
  visibleEdges: FlowEdge[];
  getEdgePositions: (edge: FlowEdge) => EdgePositions | null;
  selectedEdgeIdsSet: Set<string>;
  viewport: FlowViewport;
  zIndex?: number;
}

export default defineComponent({
  name: 'EdgeCanvasRenderer',
  props: {
    visibleEdges: {
      type: Array as PropType<FlowEdge[]>,
      required: true
    },
    getEdgePositions: {
      type: Function as PropType<(edge: FlowEdge) => EdgePositions | null>,
      required: true
    },
    selectedEdgeIdsSet: {
      type: Object as PropType<Set<string>>,
      required: true
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    zIndex: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    let resizeObserver: ResizeObserver | null = null;

    const visibleEdgeIdsKey = computed(() => props.visibleEdges.map(e => e.id).join(','));

    const selectedIdsKey = computed(() => Array.from(props.selectedEdgeIdsSet).sort().join(','));

    const renderCanvas = () => {
      const canvas = canvasRef.value;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d', { desynchronized: true });
      if (!ctx) {
        return;
      }

      const { width, height } = ensureCanvasLayoutSize(canvas, ctx);
      const themeRoot = canvas.closest('.flow-canvas') as HTMLElement | null;

      drawEdgesOnCanvas(ctx, {
        edges: props.visibleEdges,
        getEdgePositions: props.getEdgePositions,
        viewport: props.viewport,
        selectedEdgeIds: props.selectedEdgeIdsSet,
        clearWidth: width,
        clearHeight: height,
        themeRoot
      });
    };

    const { throttled: scheduleRender } = useRafThrottle(renderCanvas);

    onMounted(() => {
      scheduleRender();

      const container = canvasRef.value?.parentElement;
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          scheduleRender();
        });
        resizeObserver.observe(container);
      }
    });

    onUnmounted(() => {
      resizeObserver?.disconnect();
      resizeObserver = null;
    });

    watch(
      [
        visibleEdgeIdsKey,
        selectedIdsKey,
        () => props.viewport.zoom,
        () => props.viewport.x,
        () => props.viewport.y
      ],
      () => {
        scheduleRender();
      }
    );

    return () => (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: props.zIndex
        }}
      />
    );
  }
});
