import { type PropType, computed, defineComponent } from 'vue';
import { NText } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { formatApiDateTime, getApiDateSmartAgeDays } from '@/utils/datetime';
import type { DateRendererConfig } from '../types';

export default defineComponent({
  name: 'DateRenderer',
  props: {
    row: {
      type: Object as PropType<Record<string, any>>,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    config: {
      type: Object as PropType<DateRendererConfig>,
      default: () => ({})
    }
  },
  setup(props) {
    const appStore = useAppStore();
    const locale = computed(() => appStore.locale);

    return () => {
      const { row, field, config } = props;
      const dateStr = row[field];
      const formatted = formatApiDateTime(dateStr, {
        format: config.format,
        formatString: config.formatString,
        locale: locale.value,
        emptyText: config.emptyText
      });

      if (formatted === (config.emptyText || '-')) {
        return <NText depth={3}>{formatted}</NText>;
      }

      if (config.format === 'smart') {
        const days = getApiDateSmartAgeDays(dateStr);
        if (days === null) {
          return <NText depth={3}>{formatted}</NText>;
        }
        if (days === 0) {
          return <NText type="success">{formatted}</NText>;
        }
        if (days < 7) {
          return <NText>{formatted}</NText>;
        }
        return <NText depth={3}>{formatted}</NText>;
      }

      return <NText>{formatted}</NText>;
    };
  }
});
