import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { NDivider, NText } from 'naive-ui';
import { $t } from '@/locales';

export default defineComponent({
  name: 'UserStatsInline',
  props: {
    stats: {
      type: Object as PropType<Api.UserManagement.UserStats | null>,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['clickOnline'],
  setup(props, { emit }) {
    const items = () => [
      {
        key: 'total',
        label: $t('page.userManagement.statsTotal'),
        value: props.stats?.total ?? 0
      },
      {
        key: 'active',
        label: $t('page.userManagement.statsActive'),
        value: props.stats?.active ?? 0
      },
      {
        key: 'inactive',
        label: $t('page.userManagement.statsInactive'),
        value: props.stats?.inactive ?? 0
      },
      {
        key: 'online',
        label: $t('page.userManagement.statsOnline'),
        value: props.stats?.online ?? 0,
        clickable: true
      },
      {
        key: 'blacklisted',
        label: $t('page.userManagement.statsBlacklisted'),
        value: props.stats?.blacklisted ?? 0
      }
    ];

    return () => (
      <div class="flex flex-wrap items-center">
        {items().map((item, index) => (
          <div key={item.key} class="flex items-center">
            {index > 0 ? <NDivider vertical class="!mx-12px !h-20px" /> : null}
            <div
              class={[
                'flex items-baseline gap-6px',
                item.clickable ? 'cursor-pointer hover:text-primary' : undefined
              ].join(' ')}
              onClick={() => {
                if (item.clickable) emit('clickOnline');
              }}
            >
              <NText depth={3} class="whitespace-nowrap text-12px">
                {item.label}
              </NText>
              <NText strong class="text-14px">
                {props.loading ? '-' : item.value}
              </NText>
            </div>
          </div>
        ))}
      </div>
    );
  }
});
