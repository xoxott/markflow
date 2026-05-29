import { type PropType, computed, defineComponent } from 'vue';
import { NDropdown } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import ActionButton from './ActionButton';

export interface ActionDropdownOption {
  label: string;
  key: string;
  disabled?: boolean;
}

export default defineComponent({
  name: 'ActionDropdownButton',
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
    options: {
      type: Array as PropType<ActionDropdownOption[]>,
      required: true
    },
    onSelect: {
      type: Function as PropType<(key: string) => void>,
      required: true
    }
  },
  setup(props) {
    const dropdownOptions = computed<DropdownOption[]>(() =>
      props.options.map(option => ({
        label: option.label,
        key: option.key,
        disabled: option.disabled,
        type: option.type
      }))
    );

    return () => (
      <NDropdown
        trigger="click"
        options={dropdownOptions.value}
        onSelect={(key: string) => props.onSelect(key)}
      >
        <ActionButton
          label={props.label}
          icon={props.icon}
          type={props.type}
          secondary={props.secondary}
          disabled={props.disabled}
          loading={props.loading}
          badge={props.badge}
          badgeType={props.badgeType}
        />
      </NDropdown>
    );
  }
});
