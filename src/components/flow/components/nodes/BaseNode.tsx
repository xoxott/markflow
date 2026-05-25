/**
 * Flow 基础节点组件
 *
 * 提供通用的节点容器，支持端口渲染、样式、交互状态等
 */

import { type PropType, computed, defineComponent } from 'vue';
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
  /** 是否悬停 */
  hovered?: boolean;
  /** 是否正在拖拽 */
  dragging?: boolean;
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
    hovered: {
      type: Boolean,
      default: false
    },
    dragging: {
      type: Boolean,
      default: false
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
  emits: ['port-mousedown', 'port-mouseup', 'port-mouseenter', 'port-mouseleave'],
  setup(props, { emit, slots }) {
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
        hovered: props.hovered,
        dragging: props.dragging
      });
    });

    // 处理端口鼠标事件
    const handlePortMouseDown = (handle: FlowHandle, event: MouseEvent) => {
      if (props.locked) return;
      emit('port-mousedown', props.node.id, handle.id, handle.type, event);
    };

    const handlePortMouseUp = (handle: FlowHandle, event: MouseEvent) => {
      if (props.locked) return;
      emit('port-mouseup', props.node.id, handle.id, handle.type, event);
    };

    const handlePortMouseEnter = (handle: FlowHandle, event: MouseEvent) => {
      emit('port-mouseenter', props.node.id, handle.id, handle.type, event);
    };

    const handlePortMouseLeave = (handle: FlowHandle, event: MouseEvent) => {
      emit('port-mouseleave', props.node.id, handle.id, handle.type, event);
    };

    // 渲染端口
    const renderHandle = (handle: FlowHandle) => {
      if (handle.hidden) return null;

      const handleStyle = {
        ...calculateHandleStyle(handle),
        ...calculateHandlePositionStyle(handle)
      };

      return (
        <div
          class={getHandleClass(handle)}
          style={handleStyle}
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
        data-node-id={props.node.id}
        data-node-type={props.node.type}
      >
        {/* 默认插槽：节点内容 */}
        {slots.default ? (
          slots.default()
        ) : (
          <div
            class="flow-node-content"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <div class="flow-node-title">{props.node.data?.label || props.node.id}</div>
            {props.node.data?.description && (
              <div class="flow-node-description">{props.node.data.description}</div>
            )}
          </div>
        )}

        {/* 渲染端口 */}
        {props.node.handles?.map(handle => renderHandle(handle))}
      </div>
    );
  }
});
