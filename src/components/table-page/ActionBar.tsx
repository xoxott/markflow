import { type PropType, defineComponent } from 'vue';
import { NSpace, NText } from 'naive-ui';
import TableColumnSetting from '@/components/advanced/table-column-setting';
import { $t } from '@/locales';
import { ActionButton, ActionDropdownButton, ActionIconButton } from './actions';
import type { ActionBarColumnSetting, ActionBarProps, PresetButtonType } from './types';

/**
 * 表格工具条：预设按钮（新增 / 批量删除 / 刷新 / 导出）、自定义按钮、下拉按钮与可选列设置。 整体 w-full；有 statsRender
 * 时左侧统计、右侧按钮组（ml-auto）；无统计时按钮靠右。
 */
export default defineComponent({
  name: 'ActionBar',
  props: {
    config: {
      type: Object as PropType<ActionBarProps['config']>,
      required: true
    },
    selectedKeys: {
      type: Array as PropType<(string | number)[]>,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    columnSetting: {
      type: Object as PropType<ActionBarColumnSetting | undefined>,
      default: undefined
    }
  },
  setup(props) {
    const getPresetButtonMap = (): Record<
      PresetButtonType,
      {
        label: string;
        icon: string;
        type: 'default' | 'primary' | 'error';
        needSelection?: boolean;
        iconOnly?: boolean;
      }
    > => ({
      add: {
        label: $t('common.add'),
        icon: 'carbon:add',
        type: 'primary'
      },
      batchDelete: {
        label: $t('common.batchDelete'),
        icon: 'carbon:trash-can',
        type: 'error',
        needSelection: true
      },
      refresh: {
        label: $t('common.refresh'),
        icon: 'carbon:renew',
        type: 'default',
        iconOnly: true
      },
      export: {
        label: $t('common.export'),
        icon: 'carbon:download',
        type: 'default',
        iconOnly: true
      }
    });

    const renderPresetButton = (buttonType: PresetButtonType, buttonConfig: any) => {
      const preset = getPresetButtonMap()[buttonType];
      const { label = preset.label, icon = preset.icon, onClick, disabled, loading } = buttonConfig;

      const isDisabled = disabled || (preset.needSelection && props.selectedKeys.length === 0);

      if (preset.iconOnly) {
        return (
          <ActionIconButton
            label={label}
            icon={icon}
            type={preset.type}
            disabled={isDisabled}
            loading={loading}
            onClick={onClick}
          />
        );
      }

      return (
        <ActionButton
          label={label}
          icon={icon}
          type={preset.type}
          disabled={isDisabled}
          loading={loading}
          onClick={onClick}
          badge={
            buttonType === 'batchDelete' && props.selectedKeys.length > 0
              ? props.selectedKeys.length
              : undefined
          }
          badgeType="error"
        />
      );
    };

    const renderStats = () => {
      const showStats = props.config.showStats ?? false;
      if (!showStats) return null;

      const { statsRender } = props.config;

      if (statsRender) {
        const result = statsRender(props.total, props.selectedKeys.length);
        return typeof result === 'string' ? (
          <NText depth={3} class="text-13px">
            {result}
          </NText>
        ) : (
          result
        );
      }

      return (
        <NText depth={3} class="text-13px">
          共 {props.total} 条数据
          {props.selectedKeys.length > 0 && `，已选择 ${props.selectedKeys.length} 条`}
        </NText>
      );
    };

    const resolveDisabled = (disabled?: boolean | (() => boolean)) => {
      if (typeof disabled === 'function') return disabled();
      return disabled ?? false;
    };

    return () => {
      const showStats = props.config.showStats ?? false;

      return (
        <div class="w-full flex flex-wrap items-center gap-12px">
          {showStats ? renderStats() : null}
          <NSpace size="small" wrap={false} align="center" class="ml-auto">
            {props.config.preset &&
              Object.entries(props.config.preset).map(([key, config]) => {
                if (config.show !== false) {
                  return renderPresetButton(key as PresetButtonType, config);
                }
                return null;
              })}

            {props.config.custom?.map((buttonConfig, index) => (
              <ActionButton
                key={index}
                label={buttonConfig.label}
                icon={buttonConfig.icon}
                type={buttonConfig.type}
                secondary={buttonConfig.secondary}
                disabled={buttonConfig.disabled}
                loading={buttonConfig.loading}
                onClick={buttonConfig.onClick}
              />
            ))}

            {props.config.dropdowns?.map((dropdown, index) => (
              <ActionDropdownButton
                key={`dropdown-${index}`}
                label={dropdown.label}
                icon={dropdown.icon}
                type={dropdown.type}
                secondary={dropdown.secondary}
                disabled={resolveDisabled(dropdown.disabled)}
                loading={dropdown.loading}
                badge={dropdown.badge}
                badgeType={dropdown.badgeType}
                options={dropdown.options}
                onSelect={dropdown.onSelect}
              />
            ))}

            {props.columnSetting ? (
              <TableColumnSetting
                columns={props.columnSetting.checks}
                onUpdate:columns={props.columnSetting.onUpdateChecks}
              />
            ) : null}
          </NSpace>
        </div>
      );
    };
  }
});
