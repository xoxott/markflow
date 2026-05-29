import { type PropType, defineComponent } from 'vue';
import { NBadge, NButton } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { ACTION_BUTTON_SIZE, ACTION_ICON_CLASS } from './constants';
import { resolveIconifyIcon } from './resolveIconifyIcon';

export default defineComponent({
  name: 'ActionButton',
  props: {
    label: { type: String, required: true },
    icon: { type: String, default: undefined },
    type: {
      type: String as PropType<'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>,
      default: 'default'
    },
    secondary: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    badge: { type: Number, default: undefined },
    badgeType: {
      type: String as PropType<'default' | 'info' | 'success' | 'warning' | 'error'>,
      default: 'info'
    },
    onClick: {
      type: Function as PropType<() => void | Promise<void>>,
      default: undefined
    }
  },
  setup(props) {
    return () => (
      <NButton
        size={ACTION_BUTTON_SIZE}
        type={props.type}
        secondary={props.secondary}
        disabled={props.disabled}
        loading={props.loading}
        onClick={props.onClick}
      >
        <div class="flex items-center gap-4px">
          {props.icon ? (
            <SvgIcon icon={resolveIconifyIcon(props.icon)} class={ACTION_ICON_CLASS} />
          ) : null}
          <span>{props.label}</span>
          {props.badge !== undefined && props.badge > 0 ? (
            <NBadge value={props.badge} type={props.badgeType} processing={false} />
          ) : null}
        </div>
      </NButton>
    );
  }
});
