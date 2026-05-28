/** DefaultHistoryManager 撤销/重做与自动历史记录 */

import { describe, expect, it } from 'vitest';
import { DefaultHistoryManager } from '../core/state/stores/DefaultHistoryManager';
import { DefaultStateStore } from '../core/state/stores/DefaultStateStore';
import type { FlowNode } from '../types/flow-node';

const baseNode = (id: string, x: number): FlowNode => ({
  id,
  type: 'default',
  position: { x, y: 0 },
  size: { width: 150, height: 60 },
  data: { label: id }
});

describe('DefaultHistoryManager', () => {
  it('undo restores previous state and keeps redo available', () => {
    const store = new DefaultStateStore({ nodes: [baseNode('a', 0)] });
    const history = new DefaultHistoryManager(store);

    store.addNode(baseNode('b', 100));
    history.pushHistory();

    expect(store.getNodes()).toHaveLength(2);
    expect(history.canUndo()).toBe(true);

    history.undo();

    expect(store.getNodes()).toHaveLength(1);
    expect(store.getNodes()[0].id).toBe('a');
    expect(history.canRedo()).toBe(true);
  });

  it('undo does not grow history stack when restore triggers store subscribe', () => {
    const store = new DefaultStateStore({ nodes: [baseNode('a', 0)] });
    const history = new DefaultHistoryManager(store);

    store.subscribe(changeType => {
      if (changeType === 'nodes' && !history.isRestoring()) {
        history.pushHistory();
      }
    });

    store.addNode(baseNode('b', 100));

    const sizeBeforeUndo = history.getHistorySize();
    history.undo();

    expect(store.getNodes()).toHaveLength(1);
    expect(history.getHistorySize()).toBe(sizeBeforeUndo);
    expect(history.canRedo()).toBe(true);

    history.redo();
    expect(store.getNodes()).toHaveLength(2);
  });

  it('reports isRestoring during restoreSnapshot', () => {
    const store = new DefaultStateStore({ nodes: [baseNode('a', 0)] });
    const history = new DefaultHistoryManager(store);
    const snapshot = history.createSnapshot();

    let restoringDuringSetNodes = false;
    store.subscribe(() => {
      if (history.isRestoring()) {
        restoringDuringSetNodes = true;
      }
    });

    history.restoreSnapshot(snapshot);
    expect(restoringDuringSetNodes).toBe(true);
    expect(history.isRestoring()).toBe(false);
  });
});
