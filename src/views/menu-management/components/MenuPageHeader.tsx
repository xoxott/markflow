import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { NButton, NCard, NSpace } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';
import type { MenuTreeStats } from '../constants';

interface StatItem {
  key: string;
  value: number;
  label: string;
  tone?: 'default' | 'warning';
}

export default defineComponent({
  name: 'MenuPageHeader',
  props: {
    loading: { type: Boolean, default: false },
    applying: { type: Boolean, default: false },
    stats: {
      type: Object as PropType<MenuTreeStats>,
      required: true
    }
  },
  emits: ['sync', 'refresh', 'apply'],
  setup(props, { emit }) {
    const statItems = (): StatItem[] => {
      const items: StatItem[] = [
        {
          key: 'total',
          value: props.stats.total,
          label: $t('page.menuManagement.statsTotalLabel')
        },
        {
          key: 'groups',
          value: props.stats.groups,
          label: $t('page.menuManagement.statsGroupLabel')
        },
        {
          key: 'routes',
          value: props.stats.routes,
          label: $t('page.menuManagement.statsRouteLabel')
        }
      ];

      if (props.stats.inactive > 0) {
        items.push({
          key: 'inactive',
          value: props.stats.inactive,
          label: $t('page.menuManagement.statsInactiveLabel'),
          tone: 'warning'
        });
      }

      return items;
    };

    const buttonIcon = (icon: string) => () => <SvgIcon icon={icon} class="text-16px" />;

    return () => (
      <NCard
        bordered={false}
        class="menu-management__header card-wrapper"
        contentStyle="padding: 16px 20px"
      >
        <div class="menu-management__header-inner">
          <div class="menu-management__header-main">
            <div class="menu-management__header-brand">
              <div class="menu-management__header-icon">
                <SvgIcon icon="mdi:file-tree-outline" />
              </div>
              <div class="menu-management__header-copy">
                <div class="menu-management__header-title-row">
                  <h2 class="menu-management__title">{$t('page.menuManagement.title')}</h2>
                  <div class="menu-management__header-stats">
                    {statItems().map(item => (
                      <div
                        key={item.key}
                        class={[
                          'menu-management__stat',
                          item.tone === 'warning' ? 'menu-management__stat--warning' : ''
                        ]}
                      >
                        <span class="menu-management__stat-value">{item.value}</span>
                        <span class="menu-management__stat-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p class="menu-management__desc">{$t('page.menuManagement.subtitle')}</p>
              </div>
            </div>
          </div>

          <div class="menu-management__header-actions">
            <NSpace wrap size={10} justify="end">
              <NButton type="primary" loading={props.loading} onClick={() => emit('sync')}>
                {{
                  icon: buttonIcon('mdi:database-sync-outline'),
                  default: () => $t('page.menuManagement.syncRoutes')
                }}
              </NButton>
              <NButton loading={props.loading} onClick={() => emit('refresh')}>
                {{ icon: buttonIcon('mdi:refresh'), default: () => $t('common.refresh') }}
              </NButton>
              <NButton loading={props.applying} onClick={() => emit('apply')}>
                {{
                  icon: buttonIcon('mdi:navigation-variant-outline'),
                  default: () => $t('page.menuManagement.applySidebar')
                }}
              </NButton>
            </NSpace>
          </div>
        </div>
      </NCard>
    );
  }
});
