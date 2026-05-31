import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NButton, NEmpty, NGi, NGrid, NInput, NSpace, NTabPane, NTabs } from 'naive-ui';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import SvgIcon from '@/components/custom/svg-icon';
import { buildIconPresetGroups, resolveSearchIcons } from './icon-presets';

export interface IconPickerDialogConfig {
  value?: string;
  usedIcons?: string[];
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

    const presetGroups = computed(() => buildIconPresetGroups(props.config.usedIcons ?? []));
    const activeTab = ref(presetGroups.value[0]?.key ?? 'common');

    watch(
      () => props.show,
      visible => {
        if (visible) {
          keyword.value = '';
          activeTab.value = presetGroups.value[0]?.key ?? 'common';
        }
      }
    );

    watch(presetGroups, groups => {
      if (!groups.some(group => group.key === activeTab.value)) {
        activeTab.value = groups[0]?.key ?? 'common';
      }
    });

    const searchResults = computed(() => resolveSearchIcons(keyword.value, presetGroups.value));

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
        <NGrid cols="2 s:4 m:6 l:8" responsive="screen" xGap={8} yGap={8}>
          {icons.map(icon => {
            const isSelected = selected === icon;
            return (
              <NGi key={icon}>
                <NButton
                  block
                  text
                  type={isSelected ? 'primary' : 'default'}
                  class={['icon-picker-item', isSelected ? 'icon-picker-item--selected' : '']}
                  style={{ height: 'auto', padding: '8px 4px' }}
                  onClick={() => handleSelect(icon)}
                >
                  <div class="min-w-0 w-full flex flex-col items-center gap-4px">
                    <SvgIcon icon={icon} class="text-22px" />
                    <span class="w-full truncate text-center text-10px text-[var(--n-text-color-3)]">
                      {icon.split(':')[1]}
                    </span>
                  </div>
                </NButton>
              </NGi>
            );
          })}
        </NGrid>
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
                placeholder="搜索图标，如 home、folder-key，或输入 mdi:xxx"
              />

              {keyword.value ? (
                renderIconGrid(searchResults.value)
              ) : (
                <NTabs v-model:value={activeTab.value} type="line" animated={false}>
                  {presetGroups.value.map(group => (
                    <NTabPane key={group.key} name={group.key} tab={group.label}>
                      {renderIconGrid(group.icons)}
                    </NTabPane>
                  ))}
                </NTabs>
              )}

              {props.config.value ? (
                <div class="flex items-center gap-8px border-t border-[var(--n-divider-color)] pt-12px text-13px">
                  <span class="text-[var(--n-text-color-3)]">当前：</span>
                  <SvgIcon icon={props.config.value} class="text-20px" />
                  <code class="text-12px text-[var(--n-text-color-2)]">{props.config.value}</code>
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
