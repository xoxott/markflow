import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NButton, NEmpty, NInput, NSpace, NTabPane, NTabs } from 'naive-ui';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import SvgIcon from '@/components/custom/svg-icon';
import { ICON_PRESET_GROUPS, filterPresetIcons } from './icon-presets';

export interface IconPickerDialogConfig {
  value?: string;
  title?: string;
  width?: number;
  onSelect: (icon: string) => void;
  onClose?: () => void;
}

export default defineComponent({
  name: 'IconPickerDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<IconPickerDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const keyword = ref('');
    const activeTab = ref(ICON_PRESET_GROUPS[0]?.key ?? 'common');

    watch(
      () => props.show,
      visible => {
        if (visible) {
          keyword.value = '';
          activeTab.value = ICON_PRESET_GROUPS[0]?.key ?? 'common';
        }
      }
    );

    const filteredGroups = computed(() => filterPresetIcons(keyword.value));

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      title: props.config.title ?? '选择图标',
      width: props.config.width ?? 720,
      height: 'auto' as const,
      draggable: true,
      resizable: false,
      onClose: handleClose
    }));

    const handleSelect = (icon: string) => {
      props.config.onSelect(icon);
      handleClose();
    };

    const renderIconGrid = (icons: string[]) => {
      if (!icons.length) {
        return <NEmpty description="无匹配图标" size="small" />;
      }

      const selected = props.config.value;

      return (
        <div class="grid grid-cols-6 gap-8px sm:grid-cols-8">
          {icons.map(icon => {
            const isSelected = selected === icon;
            return (
              <button
                key={icon}
                type="button"
                title={icon}
                class={[
                  'flex flex-col items-center gap-4px border rounded-8px p-8px transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent hover:border-[var(--n-border-color)] hover:bg-[var(--n-action-color)]'
                ]}
                onClick={() => handleSelect(icon)}
              >
                <SvgIcon icon={icon} class="text-22px" />
                <span class="w-full truncate text-center text-10px opacity-70">
                  {icon.split(':')[1]}
                </span>
              </button>
            );
          })}
        </div>
      );
    };

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <div class="flex flex-col gap-12px">
              <NInput
                v-model:value={keyword.value}
                clearable
                placeholder="搜索图标，如 home、account、file..."
              />

              {keyword.value ? (
                renderIconGrid(filteredGroups.value.flatMap(group => group.icons))
              ) : (
                <NTabs v-model:value={activeTab.value} type="line" animated={false}>
                  {ICON_PRESET_GROUPS.map(group => (
                    <NTabPane key={group.key} name={group.key} tab={group.label}>
                      {renderIconGrid(group.icons)}
                    </NTabPane>
                  ))}
                </NTabs>
              )}

              {props.config.value ? (
                <div class="flex items-center gap-8px border-t pt-12px text-13px">
                  <span class="text-gray-500">当前：</span>
                  <SvgIcon icon={props.config.value} class="text-20px" />
                  <code class="text-12px">{props.config.value}</code>
                </div>
              ) : null}
            </div>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleClose}>{$t('common.cancel')}</NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
