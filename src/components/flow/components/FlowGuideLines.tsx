/** 用户辅助线（从刻度尺拖出，可移动 / 双击删除） */

import { type PropType, computed, defineComponent } from 'vue';
import type { FlowGuideDraft, FlowGuideLine } from '../types/flow-guide';
import type { FlowViewport } from '../types';

const GUIDE_SPAN = 200000;

export interface FlowGuideLinesProps {
  viewport: FlowViewport;
  guides: FlowGuideLine[];
  draftGuide?: FlowGuideDraft | null;
  onGuidePointerDown?: (guide: FlowGuideLine, event: MouseEvent) => void;
  onGuideDoubleClick?: (guide: FlowGuideLine, event: MouseEvent) => void;
}

export default defineComponent({
  name: 'FlowGuideLines',
  props: {
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    guides: {
      type: Array as PropType<FlowGuideLine[]>,
      default: () => []
    },
    draftGuide: {
      type: Object as PropType<FlowGuideDraft | null>,
      default: null
    },
    onGuidePointerDown: {
      type: Function as PropType<(guide: FlowGuideLine, event: MouseEvent) => void>,
      default: undefined
    },
    onGuideDoubleClick: {
      type: Function as PropType<(guide: FlowGuideLine, event: MouseEvent) => void>,
      default: undefined
    }
  },
  setup(props) {
    const zoom = computed(() => Math.max(props.viewport.zoom, 0.01));

    const renderGuide = (guide: FlowGuideLine, isDraft = false) => {
      const isHorizontal = guide.axis === 'horizontal';
      const flowPos = guide.position * zoom.value;
      const className = [
        'flow-guide-lines__hit',
        isHorizontal ? 'flow-guide-lines__hit--horizontal' : 'flow-guide-lines__hit--vertical',
        isDraft && 'flow-guide-lines__hit--draft'
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div
          key={isDraft ? `draft-${guide.axis}` : guide.id}
          class={className}
          style={
            isHorizontal
              ? {
                  top: `${flowPos}px`,
                  left: `${-GUIDE_SPAN / 2}px`,
                  width: `${GUIDE_SPAN}px`
                }
              : {
                  left: `${flowPos}px`,
                  top: `${-GUIDE_SPAN / 2}px`,
                  height: `${GUIDE_SPAN}px`
                }
          }
          onMousedown={event => {
            if (!isDraft) {
              props.onGuidePointerDown?.(guide, event);
            }
          }}
          onDblclick={event => {
            if (!isDraft) {
              props.onGuideDoubleClick?.(guide, event);
            }
          }}
        >
          <div class="flow-guide-lines__line" />
        </div>
      );
    };

    return () => {
      const draft = props.draftGuide;
      const movingGuideId = draft?.mode === 'move' ? draft.guideId : undefined;

      return (
        <div class="flow-guide-lines">
          {props.guides
            .filter(guide => guide.id !== movingGuideId)
            .map(guide => renderGuide(guide))}
          {draft &&
            renderGuide(
              {
                id: draft.guideId ?? 'draft',
                axis: draft.axis,
                position: draft.position
              },
              true
            )}
        </div>
      );
    };
  }
});
