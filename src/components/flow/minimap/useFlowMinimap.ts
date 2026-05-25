/** Flow 小地图 composable：布局、视口同步、拖拽导航 */

import { computed, onMounted, onUnmounted, ref, shallowRef, watchEffect } from 'vue';
import { useEventListener } from '@vueuse/core';
import { useFlowCanvasContextOptional } from '../hooks/useFlowCanvasContext';
import { useFlowMinimapTheme } from '../hooks/useFlowMinimapTheme';
import type { FlowNode, FlowViewport } from '../types';
import {
  clampToMinimap,
  computeMinimapBounds,
  computeMinimapScale,
  computeMinimapViewportRect,
  getNodeDimensions,
  viewportCenterFromMinimapPoint,
  worldToMinimap
} from './minimap-math';
import type {
  MinimapLayoutOptions,
  MinimapNodeLayout,
  MinimapPosition,
  MinimapSize,
  MinimapTheme,
  ResolveMinimapNodeColor
} from './types';
import { DEFAULT_MINIMAP_LAYOUT, MINIMAP_POSITION_OFFSET } from './types';

const DEFAULT_VIEWPORT: FlowViewport = { x: 0, y: 0, zoom: 1 };

export interface UseFlowMinimapProps {
  nodes?: FlowNode[];
  viewport?: FlowViewport;
  position?: MinimapPosition;
  size?: MinimapSize;
  padding?: number;
  maxScale?: number;
  visible?: boolean;
  style?: Record<string, unknown>;
  theme?: Partial<MinimapTheme>;
  /** 跟随应用 Naive 主题（默认 true） */
  syncAppTheme?: boolean;
  resolveNodeColor?: ResolveMinimapNodeColor;
  onViewportChange?: (viewport: FlowViewport) => void;
}

export function useFlowMinimap(props: UseFlowMinimapProps) {
  const canvasCtx = useFlowCanvasContextOptional();
  const minimapSurfaceRef = ref<HTMLElement | null>(null);
  const isDragging = ref(false);
  const canvasSize = shallowRef<MinimapSize>({ width: 800, height: 600 });
  let resizeObserver: ResizeObserver | null = null;

  const layoutOptions = computed(
    (): MinimapLayoutOptions => ({
      ...DEFAULT_MINIMAP_LAYOUT,
      padding: props.padding ?? DEFAULT_MINIMAP_LAYOUT.padding,
      maxScale: props.maxScale ?? DEFAULT_MINIMAP_LAYOUT.maxScale
    })
  );

  const {
    cssVars,
    resolvedTheme: theme,
    themeClass
  } = useFlowMinimapTheme({
    syncAppTheme: props.syncAppTheme ?? true,
    overrides: props.theme
  });

  const minimapSize = computed(() => props.size ?? { width: 200, height: 150 });

  const nodes = computed(() => canvasCtx?.nodes.value ?? props.nodes ?? []);

  const syncViewport = ref<FlowViewport>({ ...DEFAULT_VIEWPORT });

  watchEffect(() => {
    const vp = canvasCtx?.viewport.value ?? props.viewport;
    if (vp) {
      syncViewport.value = {
        x: vp.x,
        y: vp.y,
        zoom: vp.zoom ?? 1
      };
    }
  });

  const isCanvasPanning = computed(() => canvasCtx?.isPanning.value ?? false);
  const isNodeDragging = computed(() => Boolean(canvasCtx?.draggingNodeId.value));

  const bounds = computed(() => computeMinimapBounds(nodes.value, layoutOptions.value));

  const scale = computed(() =>
    computeMinimapScale(bounds.value, minimapSize.value, layoutOptions.value.maxScale)
  );

  const viewportRect = computed(() =>
    computeMinimapViewportRect(syncViewport.value, canvasSize.value, bounds.value, scale.value)
  );

  const nodeLayouts = computed((): MinimapNodeLayout[] => {
    const layout = layoutOptions.value;
    const s = scale.value;
    const resolveColor = props.resolveNodeColor ?? (() => theme.value.nodeFill);

    return nodes.value.map(node => {
      const { width, height } = getNodeDimensions(node, layout);
      const pos = worldToMinimap(node.position.x, node.position.y, bounds.value, s);
      return {
        id: node.id,
        x: pos.x,
        y: pos.y,
        width: Math.max(width * s, layout.minNodeSize),
        height: Math.max(height * s, layout.minNodeSize),
        color: resolveColor(node)
      };
    });
  });

  const applyViewportXY = (x: number, y: number) => {
    const vp: FlowViewport = { ...syncViewport.value, x, y };
    if (canvasCtx?.setViewport) {
      canvasCtx.setViewport(vp);
    } else {
      props.onViewportChange?.(vp);
    }
  };

  const updateViewportFromPointer = (clientX: number, clientY: number) => {
    const el = minimapSurfaceRef.value;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const { x: mx, y: my } = clampToMinimap(
      clientX - rect.left,
      clientY - rect.top,
      minimapSize.value
    );

    const { x, y } = viewportCenterFromMinimapPoint(
      mx,
      my,
      bounds.value,
      scale.value,
      canvasSize.value,
      syncViewport.value.zoom || 1
    );
    applyViewportXY(x, y);
  };

  const endDrag = () => {
    isDragging.value = false;
  };

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateViewportFromPointer(e.clientX, e.clientY);
  };

  useEventListener(document, 'pointermove', (e: PointerEvent) => {
    if (!isDragging.value) return;
    updateViewportFromPointer(e.clientX, e.clientY);
  });
  useEventListener(document, 'pointerup', endDrag);
  useEventListener(document, 'pointercancel', endDrag);

  const positionStyle = computed(() => {
    const base: Record<string, string | number> = {
      position: 'absolute',
      zIndex: 10,
      ...(props.style as Record<string, string | number>)
    };

    const offset = MINIMAP_POSITION_OFFSET;
    switch (props.position ?? 'bottom-right') {
      case 'top-left':
        base.top = offset;
        base.left = offset;
        break;
      case 'top-right':
        base.top = offset;
        base.right = offset;
        break;
      case 'bottom-left':
        base.bottom = offset;
        base.left = offset;
        break;
      case 'bottom-right':
      default:
        base.bottom = offset;
        base.right = offset;
        break;
    }

    return base;
  });

  const shouldAnimateViewport = computed(
    () => !isDragging.value && !isCanvasPanning.value && !isNodeDragging.value
  );

  const observeCanvasSize = () => {
    const root = canvasCtx?.canvasRef.value;
    if (!root) return;

    const update = () => {
      const rect = root.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvasSize.value = { width: rect.width, height: rect.height };
      }
    };

    update();
    resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(root);
  };

  onMounted(observeCanvasSize);
  onUnmounted(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  const isReady = computed(() => nodes.value.length > 0 && canvasSize.value.width > 0);

  return {
    minimapSurfaceRef,
    isDragging,
    isReady,
    nodes,
    minimapSize,
    theme,
    cssVars,
    themeClass,
    positionStyle,
    nodeLayouts,
    viewportRect,
    shouldAnimateViewport,
    handlePointerDown
  };
}
