import { computed, defineComponent, ref } from 'vue';
import { NButton, NInput, NSpace } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import IconPickerDialog from './IconPickerDialog';

export default defineComponent({
  name: 'IconSelect',
  props: {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: 'mdi:home-outline' }
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

    return () => (
      <>
        <NSpace align="center" wrap={false} class="w-full">
          <button
            type="button"
            class={[
              'flex h-34px w-34px shrink-0 items-center justify-center border rounded-6px transition-colors',
              props.disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:border-primary hover:bg-primary/5'
            ]}
            disabled={props.disabled}
            title={innerValue.value || '选择图标'}
            onClick={openPicker}
          >
            {innerValue.value ? (
              <SvgIcon icon={innerValue.value} class="text-20px" />
            ) : (
              <span class="text-12px text-gray-400">?</span>
            )}
          </button>
          <NInput
            v-model:value={innerValue.value}
            class="min-w-0 flex-1"
            disabled={props.disabled}
            placeholder={props.placeholder}
            clearable
          />
          <NButton disabled={props.disabled} onClick={openPicker}>
            选择
          </NButton>
        </NSpace>

        <IconPickerDialog
          show={pickerVisible.value}
          config={{
            value: innerValue.value,
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
