import { type PropType, defineComponent } from 'vue';
import { NButton, NDropdown, NPopconfirm, NSpace } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import {
  ACTION_BUTTON_SIZE,
  ACTION_ICON_CLASS,
  ACTION_MENU_TRIGGER_ICON,
  resolveIconifyIcon
} from '../actions';
import type { ActionButtonItemConfig, ActionRendererConfig } from '../types';

function isButtonVisible(button: ActionButtonItemConfig, row: any) {
  return typeof button.show === 'function' ? button.show(row) : button.show !== false;
}

function isButtonDisabled(button: ActionButtonItemConfig, row: any) {
  return typeof button.disabled === 'function' ? button.disabled(row) : button.disabled;
}

function runButtonClick(button: ActionButtonItemConfig, row: any) {
  if (button.confirm) {
    window.$dialog?.warning({
      title: button.confirm.title,
      content: button.confirm.content || `确定要${button.label}吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        button.onClick(row);
      }
    });
    return;
  }
  button.onClick(row);
}

export default defineComponent({
  name: 'ActionRenderer',
  props: {
    row: {
      type: Object as PropType<Record<string, any>>,
      required: true
    },
    config: {
      type: Object as PropType<ActionRendererConfig>,
      required: true
    }
  },
  setup(props) {
    const renderInlineButton = (button: ActionButtonItemConfig, row: any) => {
      const disabled = isButtonDisabled(button, row);

      const buttonNode = (
        <NButton
          size={ACTION_BUTTON_SIZE}
          type={button.type || 'default'}
          secondary={button.secondary !== false}
          disabled={disabled}
          onClick={() => button.onClick(row)}
        >
          <div class="flex items-center gap-4px">
            {button.icon ? (
              <SvgIcon icon={resolveIconifyIcon(button.icon)} class={ACTION_ICON_CLASS} />
            ) : null}
            <span>{button.label}</span>
          </div>
        </NButton>
      );

      if (button.confirm) {
        return (
          <NPopconfirm onPositiveClick={() => button.onClick(row)}>
            {{
              trigger: () => buttonNode,
              default: () => button.confirm!.content || `确定要${button.label}吗？`
            }}
          </NPopconfirm>
        );
      }

      return buttonNode;
    };

    const buildMenuOptions = (row: any): DropdownOption[] => {
      const options: DropdownOption[] = [];

      props.config.buttons.forEach((button, index) => {
        if (!isButtonVisible(button, row)) return;

        if (button.divider && options.length > 0) {
          options.push({ type: 'divider', key: `divider-${index}` });
        }

        options.push({
          label: button.label,
          key: button.key ?? String(index),
          disabled: isButtonDisabled(button, row)
        });
      });

      return options;
    };

    const handleMenuSelect = (key: string, row: any) => {
      const button = props.config.buttons.find(
        (item, index) => (item.key ?? String(index)) === key
      );
      if (!button || !isButtonVisible(button, row)) return;
      runButtonClick(button, row);
    };

    const renderMenuMode = (row: any) => {
      const options = buildMenuOptions(row);
      if (options.length === 0) return null;

      return (
        <NDropdown
          trigger="click"
          options={options}
          onSelect={(key: string) => handleMenuSelect(key, row)}
        >
          <NButton size={ACTION_BUTTON_SIZE} secondary aria-label={props.config.moreText ?? '操作'}>
            <SvgIcon icon={ACTION_MENU_TRIGGER_ICON} class={ACTION_ICON_CLASS} />
          </NButton>
        </NDropdown>
      );
    };

    const renderInlineMode = (row: any) => {
      const { maxShow = 2, moreText = '更多' } = props.config;

      const visibleButtons = props.config.buttons.filter(button => isButtonVisible(button, row));

      if (visibleButtons.length === 0) return null;

      if (visibleButtons.length <= maxShow) {
        return (
          <NSpace size="small">
            {visibleButtons.map((button, index) => (
              <div key={index}>{renderInlineButton(button, row)}</div>
            ))}
          </NSpace>
        );
      }

      const displayButtons = visibleButtons.slice(0, maxShow - 1);
      const moreButtons = visibleButtons.slice(maxShow - 1);

      const dropdownOptions: DropdownOption[] = moreButtons.map((button, index) => ({
        label: button.label,
        key: button.key ?? String(index),
        disabled: isButtonDisabled(button, row),
        props: {
          onClick: () => runButtonClick(button, row)
        }
      }));

      return (
        <NSpace size="small">
          {displayButtons.map((button, index) => (
            <div key={index}>{renderInlineButton(button, row)}</div>
          ))}
          <NDropdown options={dropdownOptions} trigger="click">
            <NButton size={ACTION_BUTTON_SIZE} secondary>
              <div class="flex items-center gap-4px">
                <SvgIcon icon={ACTION_MENU_TRIGGER_ICON} class={ACTION_ICON_CLASS} />
                <span>{moreText}</span>
              </div>
            </NButton>
          </NDropdown>
        </NSpace>
      );
    };

    return () => {
      const { row, config } = props;
      const mode = config.mode ?? 'inline';

      if (mode === 'menu') {
        return renderMenuMode(row);
      }

      return renderInlineMode(row);
    };
  }
});
