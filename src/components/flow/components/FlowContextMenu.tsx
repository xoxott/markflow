/** Flow 画布右键菜单（节点 / 连接线 / 空白区域） */

import type { PropType, Ref } from 'vue';
import { computed, defineComponent, nextTick, ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import { NDropdown } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import { useFlowI18n } from '../hooks/useFlowI18n';
import type { FlowConfig, FlowEdge, FlowNode } from '../types';
import { isEdgeDeletable, isNodeDeletable } from '../utils/edge-interaction-utils';

type ContextTarget =
  | { type: 'node'; nodeId: string }
  | { type: 'edge'; edgeId: string }
  | { type: 'pane' };

export interface FlowContextMenuProps {
  enabled?: boolean;
  canvasRef: Ref<HTMLElement | null>;
  config: Ref<Readonly<FlowConfig>>;
  nodes: Ref<FlowNode[]>;
  edges: Ref<FlowEdge[]>;
  selectedNodeIds: Ref<string[]>;
  selectedEdgeIds: Ref<string[]>;
  getNodeById: (nodeId: string) => FlowNode | undefined;
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  selectEdge: (edgeId: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  copySelection?: () => boolean | Promise<boolean>;
  cutSelection?: () => boolean | Promise<boolean>;
  pasteClipboard?: () => unknown | Promise<unknown>;
}

const IGNORE_SELECTORS = [
  '.flow-toolbar',
  '.flow-minimap',
  '.n-dropdown-menu',
  '.flow-edge-delete-button',
  '.flow-edge-endpoint-handle'
];

function shouldIgnoreContextTarget(target: HTMLElement): boolean {
  return IGNORE_SELECTORS.some(selector => Boolean(target.closest(selector)));
}

function resolveContextTarget(
  target: HTMLElement,
  getNodeById: (nodeId: string) => FlowNode | undefined,
  edges: FlowEdge[]
): ContextTarget | null {
  const edgeEl = target.closest('[data-edge-id]');
  if (edgeEl) {
    const edgeId = edgeEl.getAttribute('data-edge-id');
    if (edgeId && edges.some(edge => edge.id === edgeId)) {
      return { type: 'edge', edgeId };
    }
  }

  const nodeEl = target.closest('[data-node-id]');
  if (nodeEl) {
    const nodeId = nodeEl.getAttribute('data-node-id');
    if (nodeId && getNodeById(nodeId)) {
      return { type: 'node', nodeId };
    }
  }

  if (target.closest('.flow-canvas')) {
    return { type: 'pane' };
  }

  return null;
}

export default defineComponent({
  name: 'FlowContextMenu',
  props: {
    enabled: {
      type: Boolean,
      default: true
    },
    canvasRef: {
      type: Object as PropType<Ref<HTMLElement | null>>,
      required: true
    },
    config: {
      type: Object as PropType<Ref<Readonly<FlowConfig>>>,
      required: true
    },
    nodes: {
      type: Object as PropType<Ref<FlowNode[]>>,
      required: true
    },
    edges: {
      type: Object as PropType<Ref<FlowEdge[]>>,
      required: true
    },
    selectedNodeIds: {
      type: Object as PropType<Ref<string[]>>,
      required: true
    },
    selectedEdgeIds: {
      type: Object as PropType<Ref<string[]>>,
      required: true
    },
    getNodeById: {
      type: Function as PropType<(nodeId: string) => FlowNode | undefined>,
      required: true
    },
    selectNode: {
      type: Function as PropType<(nodeId: string, addToSelection?: boolean) => void>,
      required: true
    },
    selectEdge: {
      type: Function as PropType<(edgeId: string, addToSelection?: boolean) => void>,
      required: true
    },
    deselectAll: {
      type: Function as PropType<() => void>,
      required: true
    },
    removeNode: {
      type: Function as PropType<(nodeId: string) => void>,
      required: true
    },
    removeEdge: {
      type: Function as PropType<(edgeId: string) => void>,
      required: true
    },
    copySelection: {
      type: Function as PropType<() => boolean | Promise<boolean>>,
      default: undefined
    },
    cutSelection: {
      type: Function as PropType<() => boolean | Promise<boolean>>,
      default: undefined
    },
    pasteClipboard: {
      type: Function as PropType<() => unknown | Promise<unknown>>,
      default: undefined
    }
  },
  setup(props) {
    const { t } = useFlowI18n({ config: props.config });
    const visible = ref(false);
    const x = ref(0);
    const y = ref(0);
    const target = ref<ContextTarget | null>(null);

    const hideMenu = () => {
      visible.value = false;
      target.value = null;
    };

    const selectedDeletableNodeIds = computed(() =>
      props.selectedNodeIds.value.filter(nodeId => {
        const node = props.getNodeById(nodeId);
        return node ? isNodeDeletable(node, props.config.value) : false;
      })
    );

    const selectedDeletableEdgeIds = computed(() =>
      props.selectedEdgeIds.value.filter(edgeId => {
        const edge = props.edges.value.find(item => item.id === edgeId);
        return edge ? isEdgeDeletable(edge, props.config.value) : false;
      })
    );

    const canDeleteSelection = computed(
      () => selectedDeletableNodeIds.value.length > 0 || selectedDeletableEdgeIds.value.length > 0
    );

    const menuOptions = computed<DropdownOption[]>(() => {
      const options: DropdownOption[] = [];
      const current = target.value;

      if (current?.type === 'node') {
        const node = props.getNodeById(current.nodeId);
        const deletable = node ? isNodeDeletable(node, props.config.value) : false;
        if (deletable) {
          options.push({
            key: 'delete',
            label: t('contextMenu.deleteNode'),
            props: { class: 'text-red-500' }
          });
        }
      } else if (current?.type === 'edge') {
        const edge = props.edges.value.find(item => item.id === current.edgeId);
        if (edge && isEdgeDeletable(edge, props.config.value)) {
          options.push({
            key: 'delete',
            label: t('contextMenu.deleteEdge'),
            props: { class: 'text-red-500' }
          });
        }
      }

      if (props.copySelection && (current?.type === 'node' || current?.type === 'edge')) {
        options.push({ key: 'copy', label: t('contextMenu.copy') });
      }

      if (
        props.cutSelection &&
        canDeleteSelection.value &&
        (current?.type === 'node' || current?.type === 'edge')
      ) {
        options.push({ key: 'cut', label: t('contextMenu.cut') });
      }

      if (props.pasteClipboard && current?.type === 'pane') {
        options.push({ key: 'paste', label: t('contextMenu.paste') });
      }

      if (
        props.pasteClipboard &&
        (current?.type === 'node' || current?.type === 'edge') &&
        !options.some(option => option.key === 'paste')
      ) {
        options.push({ key: 'paste', label: t('contextMenu.paste') });
      }

      return options;
    });

    const syncSelectionForTarget = (nextTarget: ContextTarget) => {
      if (nextTarget.type === 'node') {
        if (!props.selectedNodeIds.value.includes(nextTarget.nodeId)) {
          props.selectNode(nextTarget.nodeId, false);
        }
        return;
      }

      if (nextTarget.type === 'edge') {
        if (!props.selectedEdgeIds.value.includes(nextTarget.edgeId)) {
          props.selectEdge(nextTarget.edgeId, false);
        }
      }
    };

    const deleteSelection = () => {
      selectedDeletableNodeIds.value.forEach(nodeId => props.removeNode(nodeId));
      selectedDeletableEdgeIds.value.forEach(edgeId => props.removeEdge(edgeId));
      props.deselectAll();
    };

    const handleSelect = async (key: string) => {
      hideMenu();

      if (key === 'delete') {
        deleteSelection();
        return;
      }

      if (key === 'copy') {
        await props.copySelection?.();
        return;
      }

      if (key === 'cut') {
        await props.cutSelection?.();
        return;
      }

      if (key === 'paste') {
        await props.pasteClipboard?.();
      }
    };

    useEventListener(
      props.canvasRef,
      'contextmenu',
      (event: MouseEvent) => {
        if (!props.enabled || props.config.value.interaction?.enableContextMenu === false) {
          return;
        }

        const hitTarget = event.target as HTMLElement;
        if (shouldIgnoreContextTarget(hitTarget)) {
          return;
        }

        const nextTarget = resolveContextTarget(hitTarget, props.getNodeById, props.edges.value);
        if (!nextTarget) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (nextTarget.type !== 'pane') {
          syncSelectionForTarget(nextTarget);
        } else {
          props.deselectAll();
        }

        target.value = nextTarget;
        x.value = event.clientX;
        y.value = event.clientY;

        nextTick(() => {
          visible.value = menuOptions.value.length > 0;
        });
      },
      { capture: true }
    );

    useEventListener(document, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideMenu();
      }
    });

    return () => {
      if (!visible.value || menuOptions.value.length === 0) {
        return null;
      }

      return (
        <NDropdown
          show={visible.value}
          trigger="manual"
          placement="bottom-start"
          x={x.value}
          y={y.value}
          options={menuOptions.value}
          onClickoutside={hideMenu}
          onSelect={handleSelect}
        />
      );
    };
  }
});

export type { ContextTarget };
