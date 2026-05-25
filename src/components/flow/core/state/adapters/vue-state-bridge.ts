/** Vue 响应式桥接：DefaultStateStore → shallowRef / ref */

import type { Ref } from 'vue';
import { ref, shallowRef } from 'vue';
import type { DefaultStateStore } from '../stores/DefaultStateStore';
import { safeUpdateRef } from '../../../utils/ref-utils';
import { performanceMonitor } from '../../../utils/performance-monitor';
import type { FlowEdge } from '../../../types/flow-edge';
import type { FlowNode } from '../../../types/flow-node';
import type { FlowViewport } from '../../../types/flow-config';

export interface VueStateRefs {
  nodes: Ref<FlowNode[]>;
  edges: Ref<FlowEdge[]>;
  viewport: Ref<FlowViewport>;
  selectedNodeIds: Ref<string[]>;
  selectedEdgeIds: Ref<string[]>;
}

export interface VueStateBridge {
  refs: VueStateRefs;
  /** 取消 store 订阅并清理 RAF */
  dispose: () => void;
}

/** 将 DefaultStateStore 同步到 Vue refs（RAF 批量 flush） */
export function createVueStateBridge(store: DefaultStateStore): VueStateBridge {
  const refs: VueStateRefs = {
    nodes: shallowRef(store.getNodes()),
    edges: shallowRef(store.getEdges()),
    viewport: ref(store.getViewport()),
    selectedNodeIds: shallowRef(store.getSelectedNodeIds()),
    selectedEdgeIds: shallowRef(store.getSelectedEdgeIds())
  };

  const pendingUpdates = new Set<string>();
  let updateScheduled = false;
  let rafId: number | null = null;

  const flushUpdates = () => {
    const perfStart = performance.now();

    if (pendingUpdates.size === 0) {
      updateScheduled = false;
      rafId = null;
      return;
    }

    const updateTypes = Array.from(pendingUpdates);
    const nodesStart = performance.now();

    if (pendingUpdates.has('nodes') || pendingUpdates.has('all')) {
      safeUpdateRef(refs.nodes, store.getNodes());
    }

    if (pendingUpdates.has('edges') || pendingUpdates.has('all')) {
      safeUpdateRef(refs.edges, store.getEdges());
    }

    const viewportStart = performance.now();
    if (pendingUpdates.has('viewport') || pendingUpdates.has('all')) {
      const next = store.getViewport();
      refs.viewport.value = { x: next.x, y: next.y, zoom: next.zoom };
    }
    const viewportTime = performance.now() - viewportStart;

    if (pendingUpdates.has('selectedNodeIds') || pendingUpdates.has('all')) {
      safeUpdateRef(refs.selectedNodeIds, store.getSelectedNodeIds());
    }

    if (pendingUpdates.has('selectedEdgeIds') || pendingUpdates.has('all')) {
      safeUpdateRef(refs.selectedEdgeIds, store.getSelectedEdgeIds());
    }

    pendingUpdates.clear();
    updateScheduled = false;
    rafId = null;

    performanceMonitor.record('stateFlush', performance.now() - perfStart, {
      updateTypes,
      nodesTime: viewportStart - nodesStart,
      viewportTime
    });
  };

  const unsubscribe = store.subscribe(changeType => {
    if (changeType === 'viewport' || changeType === 'nodes') {
      if (changeType === 'viewport') {
        const next = store.getViewport();
        refs.viewport.value = { x: next.x, y: next.y, zoom: next.zoom };
      } else {
        safeUpdateRef(refs.nodes, store.getNodes());
      }
      return;
    }

    pendingUpdates.add(changeType);
    if (!updateScheduled) {
      updateScheduled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        flushUpdates();
      });
    }
  });

  const dispose = () => {
    unsubscribe();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingUpdates.clear();
    updateScheduled = false;
  };

  return { refs, dispose };
}
