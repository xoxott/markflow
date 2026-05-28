import { type PropType, defineComponent } from 'vue';
import { NSelect } from 'naive-ui';
import { TOOL_PRESETS } from '../constants';

export default defineComponent({
  name: 'ToolMultiSelect',
  props: {
    value: { type: Array as PropType<string[]>, default: () => [] },
    placeholder: { type: String, default: '选择工具（空=全部允许）' },
    disabled: { type: Boolean, default: false },
    onUpdateValue: {
      type: Function as PropType<(v: string[]) => void>,
      default: undefined
    }
  },
  setup(props) {
    const options = TOOL_PRESETS.map(t => ({ label: t, value: t }));

    return () => (
      <NSelect
        value={props.value}
        options={options}
        multiple
        filterable
        tag
        disabled={props.disabled}
        placeholder={props.placeholder}
        onUpdateValue={(v: string[]) => props.onUpdateValue?.(v)}
      />
    );
  }
});
