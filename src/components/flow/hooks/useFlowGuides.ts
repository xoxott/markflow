/**
 * 辅助线：从刻度尺拖出、移动、删除
 */

import { type Ref, ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import type { FlowConfig, FlowViewport } from '../types';
import type { FlowGuideAxis, FlowGuideDraft, FlowGuideLine } from '../types/flow-guide';
import {
  applyFlowSnap,
  createGuideId,
  getFlowPointFromClient,
  getGuideFlowPosition,
  isGuidePlacementValid,
  shouldRemoveGuideOnRelease
} from '../utils/guide-utils';

export interface UseFlowGuidesOptions {
  config: Ref<Readonly<FlowConfig>>;
  viewport: Ref<FlowViewport>;
  canvasRef: Ref<HTMLElement | null>;
  initialGuides?: FlowGuideLine[];
  onGuidesChange?: (guides: FlowGuideLine[]) => void;
}

export interface UseFlowGuidesReturn {
  guides: Ref<FlowGuideLine[]>;
  draftGuide: Ref<FlowGuideDraft | null>;
  setGuides: (next: FlowGuideLine[]) => void;
  clearGuides: () => void;
  removeGuide: (guideId: string) => void;
  handleRulerPointerDown: (axis: FlowGuideAxis, event: MouseEvent) => void;
  handleGuidePointerDown: (guide: FlowGuideLine, event: MouseEvent) => void;
  handleGuideDoubleClick: (guide: FlowGuideLine, event: MouseEvent) => void;
}

export function useFlowGuides(options: UseFlowGuidesOptions): UseFlowGuidesReturn {
  const { config, viewport, canvasRef, onGuidesChange } = options;

  const guides = ref<FlowGuideLine[]>(options.initialGuides ? [...options.initialGuides] : []);
  const draftGuide = ref<FlowGuideDraft | null>(null);

  let activeDraft: FlowGuideDraft | null = null;

  const emitChange = () => {
    onGuidesChange?.([...guides.value]);
  };

  const setGuides = (next: FlowGuideLine[]) => {
    guides.value = [...next];
    emitChange();
  };

  const clearGuides = () => {
    guides.value = [];
    emitChange();
  };

  const removeGuide = (guideId: string) => {
    guides.value = guides.value.filter(guide => guide.id !== guideId);
    emitChange();
  };

  const guidesEnabled = () => {
    const canvas = config.value.canvas;
    return Boolean(canvas?.showRuler) && canvas?.enableGuides !== false;
  };

  const getCanvasRect = () => canvasRef.value?.getBoundingClientRect();

  const resolveGuidePosition = (
    axis: FlowGuideAxis,
    clientX: number,
    clientY: number,
    excludeGuideId?: string
  ): number => {
    const rect = getCanvasRect();
    if (!rect) {
      return 0;
    }
    const point = getFlowPointFromClient(clientX, clientY, rect, viewport.value);
    const canvas = config.value.canvas;
    const snapped = applyFlowSnap(point, {
      snapToGuides: false,
      snapToGrid: canvas?.snapToGrid !== false,
      gridSize: canvas?.gridSize,
      excludeGuideId
    });
    return getGuideFlowPosition(axis, snapped);
  };

  const finishDraft = (event: MouseEvent) => {
    if (!activeDraft) {
      return;
    }

    const rect = getCanvasRect();
    const rulerSize = config.value.canvas?.rulerSize ?? 24;
    const draft = activeDraft;
    activeDraft = null;
    draftGuide.value = null;

    if (!rect) {
      return;
    }

    if (draft.mode === 'create') {
      if (!isGuidePlacementValid(draft.axis, event.clientX, event.clientY, rect, rulerSize)) {
        return;
      }
      guides.value = [
        ...guides.value,
        {
          id: createGuideId(),
          axis: draft.axis,
          position: draft.position
        }
      ];
      emitChange();
      return;
    }

    if (!draft.guideId) {
      return;
    }

    if (shouldRemoveGuideOnRelease(draft.axis, event.clientX, event.clientY, rect, rulerSize)) {
      removeGuide(draft.guideId);
      return;
    }

    guides.value = guides.value.map(guide =>
      guide.id === draft.guideId ? { ...guide, position: draft.position } : guide
    );
    emitChange();
  };

  const handlePointerMove = (event: MouseEvent) => {
    if (!activeDraft) {
      return;
    }
    activeDraft = {
      ...activeDraft,
      position: resolveGuidePosition(
        activeDraft.axis,
        event.clientX,
        event.clientY,
        activeDraft.mode === 'move' ? activeDraft.guideId : undefined
      )
    };
    draftGuide.value = { ...activeDraft };
  };

  const handlePointerUp = (event: MouseEvent) => {
    if (!activeDraft) {
      return;
    }
    finishDraft(event);
  };

  useEventListener(document, 'mousemove', handlePointerMove);
  useEventListener(document, 'mouseup', handlePointerUp);

  const startDraft = (draft: FlowGuideDraft, event: MouseEvent) => {
    if (!guidesEnabled()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    activeDraft = {
      ...draft,
      position: resolveGuidePosition(draft.axis, event.clientX, event.clientY, draft.guideId)
    };
    draftGuide.value = { ...activeDraft };
  };

  const handleRulerPointerDown = (axis: FlowGuideAxis, event: MouseEvent) => {
    if (event.button !== 0 || !guidesEnabled()) {
      return;
    }
    startDraft({ mode: 'create', axis, position: 0 }, event);
  };

  const handleGuidePointerDown = (guide: FlowGuideLine, event: MouseEvent) => {
    if (event.button !== 0 || !guidesEnabled()) {
      return;
    }
    startDraft(
      {
        mode: 'move',
        axis: guide.axis,
        position: guide.position,
        guideId: guide.id
      },
      event
    );
  };

  const handleGuideDoubleClick = (guide: FlowGuideLine, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeGuide(guide.id);
  };

  return {
    guides,
    draftGuide,
    setGuides,
    clearGuides,
    removeGuide,
    handleRulerPointerDown,
    handleGuidePointerDown,
    handleGuideDoubleClick
  };
}
