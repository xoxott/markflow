import { type PropType, defineComponent } from 'vue';
import BaseNode from '@/components/flow/components/nodes/BaseNode';
import type { FlowNode } from '@/components/flow';
import type { BaseNodeProps } from '@/components/flow/components/nodes/BaseNode';
import WorkflowNodeCard from '../shared/WorkflowNodeCard';
import type { WorkflowNodeFlowData } from '../types/workflow-node-data';

type WorkflowFlowNodeProps = Pick<
  BaseNodeProps,
  | 'node'
  | 'selected'
  | 'locked'
  | 'dragging'
  | 'onPortMousedown'
  | 'onPortMouseup'
  | 'onPortMouseenter'
  | 'onPortMouseleave'
>;

export default defineComponent({
  name: 'WorkflowFlowNode',
  props: {
    node: {
      type: Object as PropType<FlowNode<WorkflowNodeFlowData>>,
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
      type: Function as PropType<WorkflowFlowNodeProps['onPortMousedown']>,
      default: undefined
    },
    onPortMouseup: {
      type: Function as PropType<WorkflowFlowNodeProps['onPortMouseup']>,
      default: undefined
    },
    onPortMouseenter: {
      type: Function as PropType<WorkflowFlowNodeProps['onPortMouseenter']>,
      default: undefined
    },
    onPortMouseleave: {
      type: Function as PropType<WorkflowFlowNodeProps['onPortMouseleave']>,
      default: undefined
    }
  },
  setup(props) {
    return () => {
      const data = props.node.data;

      return (
        <BaseNode
          node={props.node}
          selected={props.selected}
          locked={props.locked}
          dragging={props.dragging}
          onPortMousedown={props.onPortMousedown}
          onPortMouseup={props.onPortMouseup}
          onPortMouseenter={props.onPortMouseenter}
          onPortMouseleave={props.onPortMouseleave}
        >
          <WorkflowNodeCard
            variant="canvas"
            label={data.label}
            description={data.description}
            icon={data.icon}
            color={data.color}
          />
        </BaseNode>
      );
    };
  }
});
