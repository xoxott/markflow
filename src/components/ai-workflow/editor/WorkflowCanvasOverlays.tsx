/** 工作流画布浮层（须在 FlowCanvas 默认插槽内渲染，以使用 inject 上下文） */

import { type PropType, computed, defineComponent } from 'vue';
import { FlowMinimap, FlowToolbar, useFlowCanvasContext } from '@/components/flow';

export default defineComponent({
  name: 'WorkflowCanvasOverlays',
  props: {
    onFitView: {
      type: Function as PropType<() => void>,
      default: undefined
    }
  },
  setup(props) {
    const ctx = useFlowCanvasContext();
    const toolbarViewport = computed(() => {
      const vp = ctx.viewport.value;
      if (vp && typeof vp.zoom === 'number') return vp;
      return { x: 0, y: 0, zoom: 1 };
    });
    const dragSnapGuides = computed(() => {
      const canvas = ctx.config.value.canvas;
      return Boolean(canvas?.snapToGrid || canvas?.snapToGuides || canvas?.snapToAlignment);
    });

    return () => (
      <>
        <FlowToolbar
          viewport={toolbarViewport.value}
          position="bottom"
          layoutLocked={ctx.layoutLocked.value}
          onLayoutLockChange={ctx.setLayoutLocked}
          showRuler={Boolean(ctx.config.value.canvas?.showRuler)}
          onShowRulerChange={ctx.setShowRuler}
          dragSnapGuides={dragSnapGuides.value}
          onDragSnapGuidesChange={ctx.setDragSnapGuidesEnabled}
          onZoomChange={zoom => ctx.setViewport({ zoom })}
          onFitView={props.onFitView}
          onResetView={() => ctx.setViewport({ x: 0, y: 0, zoom: 1 })}
        />
        <FlowMinimap position="bottom-right" visible />
      </>
    );
  }
});
