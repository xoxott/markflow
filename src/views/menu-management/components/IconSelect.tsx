import { computed, defineComponent, ref } from 'vue';
import { NButton, NInput, NInputGroup } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import IconPickerDialog from './IconPickerDialog';

export default defineComponent({
  name: 'IconSelect',
  props: {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: 'mdi:home-outline' },
    usedIcons: { type: Array as () => string[], default: () => [] }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const pickerVisible = ref(false);

    const innerValue = computed({
      get: () => props.value,
      set: (val: string) => emit('update:value', val)
    });

    const openPicker = () => {
      if (props.disabled) return;
      pickerVisible.value = true;
    };

    const renderPrefix = () => {
      if (innerValue.value) {
        return <SvgIcon icon={innerValue.value} class="text-18px" />;
      }
      return <SvgIcon icon="mdi:image-outline" class="text-18px opacity-40" />;
    };

    return () => (
      <>
        <NInputGroup class="w-full">
          <NInput
            v-model:value={innerValue.value}
            disabled={props.disabled}
            placeholder={props.placeholder}
            clearable
          >
            {{ prefix: renderPrefix }}
          </NInput>
          <NButton disabled={props.disabled} onClick={openPicker}>
            选择
          </NButton>
        </NInputGroup>

        <IconPickerDialog
          show={pickerVisible.value}
          config={{
            value: innerValue.value,
            usedIcons: props.usedIcons,
            onSelect: (icon: string) => {
              innerValue.value = icon;
            },
            onClose: () => {
              pickerVisible.value = false;
            }
          }}
          onUpdate:show={(visible: boolean) => {
            pickerVisible.value = visible;
          }}
        />
      </>
    );
  }
});
