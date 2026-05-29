import { type PropType, defineComponent } from 'vue';
import { NButton, NTooltip } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { ACTION_BUTTON_SIZE, ACTION_ICON_CLASS } from './constants';
import { resolveIconifyIcon } from './resolveIconifyIcon';

export default defineComponent({
  name: 'ActionIconButton',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    type: {
      type: String as PropType<'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>,
      default: 'default'
    },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    onClick: {
      type: Function as PropType<() => void | Promise<void>>,
      default: undefined
    }
  },
  setup(props) {
    return () => (
      <NTooltip>
        {{
          trigger: () => (
            <NButton
              size={ACTION_BUTTON_SIZE}
              type={props.type}
              disabled={props.disabled}
              loading={props.loading}
              onClick={props.onClick}
              aria-label={props.label}
            >
              <SvgIcon icon={resolveIconifyIcon(props.icon)} class={ACTION_ICON_CLASS} />
            </NButton>
          ),
          default: () => props.label
        }}
      </NTooltip>
    );
  }
});
