import { type PropType, defineComponent } from 'vue';
import { NIcon } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { WORKFLOW_NODE_SIZE } from '../constants/workflow-layout';

export type WorkflowNodeCardVariant = 'library' | 'canvas' | 'ghost';

export interface WorkflowNodeCardProps {
  label: string;
  description?: string;
  icon: string;
  color: string;
  variant?: WorkflowNodeCardVariant;
}

export default defineComponent({
  name: 'WorkflowNodeCard',
  props: {
    label: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    variant: {
      type: String as PropType<WorkflowNodeCardVariant>,
      default: 'library'
    }
  },
  setup(props) {
    const isFixedSize = () => props.variant !== 'canvas';

    return () => (
      <div
        class={['workflow-node-card', `workflow-node-card--${props.variant}`]}
        style={{
          borderLeftColor: props.color,
          ...(isFixedSize()
            ? {
                width: `${WORKFLOW_NODE_SIZE.width}px`,
                height: `${WORKFLOW_NODE_SIZE.height}px`
              }
            : undefined)
        }}
      >
        <div
          class="workflow-node-card__icon"
          style={{
            color: props.color,
            background: `${props.color}15`,
            borderColor: `${props.color}30`
          }}
        >
          <NIcon size={props.variant === 'canvas' ? 18 : 20}>
            <Icon icon={props.icon} />
          </NIcon>
        </div>
        <div class="workflow-node-card__body">
          <div class="workflow-node-card__label">{props.label}</div>
          {props.description ? (
            <div class="workflow-node-card__desc">{props.description}</div>
          ) : null}
        </div>
      </div>
    );
  }
});
