/** Flow 小地图（UI 层；逻辑见 minimap/useFlowMinimap） */

import type { CSSProperties, PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import {
  DEFAULT_MINIMAP_SIZE,
  type MinimapPosition,
  type MinimapSize,
  type MinimapTheme,
  type ResolveMinimapNodeColor,
  useFlowMinimap
} from '../minimap';
import type { FlowNode, FlowViewport } from '../types';

export type { MinimapPosition, MinimapSize, MinimapTheme, ResolveMinimapNodeColor };

export interface FlowMinimapProps {
  /** FlowCanvas 内可省略，走 inject nodes */
  nodes?: FlowNode[];
  viewport?: FlowViewport;
  position?: MinimapPosition;
  size?: MinimapSize;
  padding?: number;
  maxScale?: number;
  /** 覆盖主题 token（在 syncAppTheme 合并之后） */
  theme?: Partial<MinimapTheme>;
  /** 跟随应用 Naive / themeStore 主题色（默认 true） */
  syncAppTheme?: boolean;
  resolveNodeColor?: ResolveMinimapNodeColor;
  visible?: boolean;
  style?: Record<string, unknown>;
  class?: string;
  onViewportChange?: (viewport: FlowViewport) => void;
}

export default defineComponent({
  name: 'FlowMinimap',
  props: {
    nodes: {
      type: Array as PropType<FlowNode[]>,
      default: undefined
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      default: undefined
    },
    position: {
      type: String as PropType<MinimapPosition>,
      default: 'bottom-right'
    },
    size: {
      type: Object as PropType<MinimapSize>,
      default: () => ({ ...DEFAULT_MINIMAP_SIZE })
    },
    padding: {
      type: Number,
      default: undefined
    },
    maxScale: {
      type: Number,
      default: undefined
    },
    theme: {
      type: Object as PropType<Partial<MinimapTheme>>,
      default: undefined
    },
    syncAppTheme: {
      type: Boolean,
      default: true
    },
    resolveNodeColor: {
      type: Function as PropType<ResolveMinimapNodeColor>,
      default: undefined
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
    onViewportChange: {
      type: Function as PropType<(viewport: FlowViewport) => void>,
      default: undefined
    }
  },
  setup(props, { slots }) {
    const mm = useFlowMinimap(props);

    const rootStyle = computed(() => ({
      ...mm.cssVars.value,
      ...mm.positionStyle.value
    }));

    return () => {
      if (!props.visible || !mm.isReady.value) {
        return null;
      }

      const { width, height } = mm.minimapSize.value;
      const vr = mm.viewportRect.value;
      const dragging = mm.isDragging.value;

      return (
        <div
          class={[
            'flow-minimap',
            mm.themeClass.value,
            dragging && 'flow-minimap--dragging',
            props.class
          ]}
          style={rootStyle.value as CSSProperties}
        >
          <div
            ref={mm.minimapSurfaceRef}
            class="flow-minimap__surface relative select-none"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              pointerEvents: 'auto'
            }}
            onPointerdown={mm.handlePointerDown}
          >
            {mm.nodeLayouts.value.map(layout => {
              const flowNode = mm.nodes.value.find(n => n.id === layout.id);

              if (slots.node && flowNode) {
                return slots.node({ node: flowNode, layout });
              }

              return (
                <div
                  key={layout.id}
                  class="flow-minimap__node absolute"
                  style={{
                    left: `${layout.x}px`,
                    top: `${layout.y}px`,
                    width: `${layout.width}px`,
                    height: `${layout.height}px`,
                    background: layout.color
                  }}
                />
              );
            })}

            <div
              class={[
                'flow-minimap__viewport absolute',
                mm.shouldAnimateViewport.value && 'flow-minimap__viewport--animate'
              ]}
              style={{
                left: `${vr.x}px`,
                top: `${vr.y}px`,
                width: `${vr.width}px`,
                height: `${vr.height}px`
              }}
            />
          </div>
        </div>
      );
    };
  }
});
