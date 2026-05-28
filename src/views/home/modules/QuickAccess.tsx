import { computed, defineComponent } from 'vue';
import { NCard } from 'naive-ui';
import type { RouteKey } from '@elegant-router/types';
import { useRouterPush } from '@/hooks/common/router';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';

interface QuickLinkItem {
  key: string;
  routeKey: RouteKey;
  labelKey: App.I18n.I18nKey;
  icon: string;
}

export default defineComponent({
  name: 'QuickAccess',
  setup() {
    const { routerPushByKeyWithMetaQuery } = useRouterPush();

    const quickLinks = computed<QuickLinkItem[]>(() => [
      {
        key: 'monitoring',
        routeKey: 'monitoring',
        labelKey: 'page.home.quickLinks.monitoring',
        icon: 'mdi:monitor-dashboard'
      },
      {
        key: 'user-management',
        routeKey: 'user-management',
        labelKey: 'page.home.quickLinks.userManagement',
        icon: 'mdi:account-group'
      },
      {
        key: 'role-management',
        routeKey: 'role-management',
        labelKey: 'page.home.quickLinks.roleManagement',
        icon: 'mdi:account-key'
      },
      {
        key: 'log-management',
        routeKey: 'log-management',
        labelKey: 'page.home.quickLinks.requestLogs',
        icon: 'mdi:file-document-outline'
      }
    ]);

    function handleNavigate(routeKey: RouteKey) {
      routerPushByKeyWithMetaQuery(routeKey);
    }

    return () => (
      <NCard bordered={false} class="card-wrapper">
        <h3 class="home-section-title">{$t('page.home.quickAccessTitle')}</h3>
        <div class="quick-access-grid">
          {quickLinks.value.map(item => (
            <button
              key={item.key}
              type="button"
              class="quick-access-item"
              onClick={() => handleNavigate(item.routeKey)}
            >
              <span class="quick-access-item__icon">
                <SvgIcon icon={item.icon} class="text-20px" />
              </span>
              <span class="quick-access-item__label">{$t(item.labelKey)}</span>
              <SvgIcon icon="mdi:chevron-right" class="quick-access-item__arrow text-16px" />
            </button>
          ))}
        </div>
      </NCard>
    );
  }
});
