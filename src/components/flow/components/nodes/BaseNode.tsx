/**
 * Flow 基础节点组件
 *
 * 提供通用的节点容器，支持端口渲染、样式、交互状态等
 */

import { type PropType, computed, defineComponent } from 'vue';
import { useFlowI18n } from '../../hooks/useFlowI18n';
import { calculateNodeClass, calculateNodeContainerStyle } from '../../utils/node-style-utils';
import {
  calculateHandlePositionStyle,
  calculateHandleStyle,
  getHandleClass
} from '../../utils/handle-utils';
import type { FlowHandle, FlowNode } from '../../types/flow-node';

/** BaseNode 组件属性 */
export interface BaseNodeProps {
  /** 节点数据 */
  node: FlowNode;
  /** 是否选中 */
  selected?: boolean;
  /** 是否锁定 */
  locked?: boolean;
  /** 是否正在拖拽 */
  dragging?: boolean;
  /** 端口鼠标按下 */
  onPortMousedown?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 端口鼠标抬起 */
  onPortMouseup?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 端口鼠标进入 */
  onPortMouseenter?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 端口鼠标离开 */
  onPortMouseleave?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 自定义样式 */
  style?: Record<string, any>;
  /** CSS 类名 */
  class?: string;
}

/**
 * 基础节点组件
 *
 * 提供通用的节点容器，子组件可以通过插槽自定义内容
 */
export default defineComponent({
  name: 'BaseNode',
  props: {
    node: {
      type: Object as PropType<FlowNode>,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    locked: {
      type: Boolean,
      default: false
    },
    dragging: {
      type: Boolean,
      default: false
    },
    onPortMousedown: {
      type: Function as PropType<BaseNodeProps['onPortMousedown']>,
      default: undefined
    },
    onPortMouseup: {
      type: Function as PropType<BaseNodeProps['onPortMouseup']>,
      default: undefined
    },
    onPortMouseenter: {
      type: Function as PropType<BaseNodeProps['onPortMouseenter']>,
      default: undefined
    },
    onPortMouseleave: {
      type: Function as PropType<BaseNodeProps['onPortMouseleave']>,
      default: undefined
    },
    style: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    class: {
      type: String,
      default: ''
    }
  },
  emits: {
    'port-mousedown': (
      _nodeId: string,
      _handleId: string,
      _handleType: 'source' | 'target',
      _event: MouseEvent
    ) => true,
    'port-mouseup': (
      _nodeId: string,
      _handleId: string,
      _handleType: 'source' | 'target',
      _event: MouseEvent
    ) => true,
    'port-mouseenter': (
      _nodeId: string,
      _handleId: string,
      _handleType: 'source' | 'target',
      _event: MouseEvent
    ) => true,
    'port-mouseleave': (
      _nodeId: string,
      _handleId: string,
      _handleType: 'source' | 'target',
      _event: MouseEvent
    ) => true
  },
  setup(props, { emit, slots }) {
    const { t } = useFlowI18n();

    const nodeLabel = computed(() => String(props.node.data?.label ?? props.node.id));

    const nodeAriaLabel = computed(() => t('node.ariaLabel', { label: nodeLabel.value }));

    const nodeStyle = computed(() =>
      calculateNodeContainerStyle({
        node: props.node,
        customStyle: props.style
      })
    );

    // 计算节点类名
    const nodeClass = computed(() => {
      return calculateNodeClass({
        nodeClass: props.node.class,
        customClass: props.class,
        selected: props.selected,
        locked: props.locked,
        dragging: props.dragging
      });
    });

    // 处理端口鼠标事件
    const handlePortMouseDown = (handle: FlowHandle, event: MouseEvent) => {
      if (props.locked) return;
      if (props.onPortMousedown) {
        props.onPortMousedown(props.node.id, handle.id, handle.type, event);
      } else {
        emit('port-mousedown', props.node.id, handle.id, handle.type, event);
      }
    };

    const handlePortMouseUp = (handle: FlowHandle, event: MouseEvent) => {
      if (props.locked) return;
      if (props.onPortMouseup) {
        props.onPortMouseup(props.node.id, handle.id, handle.type, event);
      } else {
        emit('port-mouseup', props.node.id, handle.id, handle.type, event);
      }
    };

    const handlePortMouseEnter = (handle: FlowHandle, event: MouseEvent) => {
      if (props.onPortMouseenter) {
        props.onPortMouseenter(props.node.id, handle.id, handle.type, event);
      } else {
        emit('port-mouseenter', props.node.id, handle.id, handle.type, event);
      }
    };

    const handlePortMouseLeave = (handle: FlowHandle, event: MouseEvent) => {
      if (props.onPortMouseleave) {
        props.onPortMouseleave(props.node.id, handle.id, handle.type, event);
      } else {
        emit('port-mouseleave', props.node.id, handle.id, handle.type, event);
      }
    };

    // 渲染端口
    const renderHandle = (handle: FlowHandle) => {
      if (handle.hidden) return null;

      const handleStyle = {
        ...calculateHandleStyle(handle),
        ...calculateHandlePositionStyle(handle)
      };

      const handleKey = handle.type === 'source' ? 'handle.source' : 'handle.target';
      const handleAriaLabel = t(handleKey, { id: handle.id });

      return (
        <div
          class={getHandleClass(handle)}
          style={handleStyle}
          role="button"
          tabindex={-1}
          aria-label={handleAriaLabel}
          onMousedown={(e: MouseEvent) => handlePortMouseDown(handle, e)}
          onMouseup={(e: MouseEvent) => handlePortMouseUp(handle, e)}
          onMouseenter={(e: MouseEvent) => handlePortMouseEnter(handle, e)}
          onMouseleave={(e: MouseEvent) => handlePortMouseLeave(handle, e)}
          data-handle-id={handle.id}
          data-handle-type={handle.type}
        />
      );
    };

    return () => (
      <div
        class={nodeClass.value}
        style={nodeStyle.value}
        role="button"
        tabindex={0}
        aria-label={nodeAriaLabel.value}
        aria-selected={props.selected ? 'true' : 'false'}
        aria-grabbed={props.dragging ? 'true' : 'false'}
        data-node-id={props.node.id}
        data-node-type={props.node.type}
      >
        {slots.default ? (
          slots.default()
        ) : (
          <div class="flow-node-content">
            <div class="flow-node-title">{props.node.data?.label || props.node.id}</div>
            {props.node.data?.description && (
              <div class="flow-node-description">{props.node.data.description}</div>
            )}
          </div>
        )}

        {props.node.handles?.map(handle => renderHandle(handle))}
      </div>
    );
  }
});
