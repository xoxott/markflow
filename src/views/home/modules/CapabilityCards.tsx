import { computed, defineComponent } from 'vue';
import { NButton, NCard, NGi, NGrid } from 'naive-ui';
import type { RouteKey } from '@elegant-router/types';
import { useRouterPush } from '@/hooks/common/router';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';

interface CapabilityItem {
  key: string;
  routeKey: RouteKey;
  titleKey: App.I18n.I18nKey;
  descKey: App.I18n.I18nKey;
  icon: string;
  accent: string;
}

export default defineComponent({
  name: 'CapabilityCards',
  setup() {
    const { routerPushByKeyWithMetaQuery } = useRouterPush();

    const capabilities = computed<CapabilityItem[]>(() => [
      {
        key: 'workflow',
        routeKey: 'ai-workflow',
        titleKey: 'page.home.workflow.title',
        descKey: 'page.home.workflow.desc',
        icon: 'mdi:workflow',
        accent: '#0C7DB1'
      },
      {
        key: 'knowledge-base',
        routeKey: 'knowledge-base',
        titleKey: 'page.home.knowledgeBase.title',
        descKey: 'page.home.knowledgeBase.desc',
        icon: 'mdi:book-open-page-variant',
        accent: '#5B8DEF'
      }
    ]);

    function handleEnter(routeKey: RouteKey) {
      routerPushByKeyWithMetaQuery(routeKey);
    }

    return () => (
      <div>
        <h3 class="home-section-title">{$t('page.home.capabilitiesTitle')}</h3>
        <NGrid cols="1 s:1 m:2" responsive="screen" xGap={16} yGap={16}>
          {capabilities.value.map(item => (
            <NGi key={item.key}>
              <div
                class="capability-card card-wrapper"
                role="button"
                tabindex={0}
                onClick={() => handleEnter(item.routeKey)}
                onKeydown={(event: KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleEnter(item.routeKey);
                  }
                }}
              >
                <NCard bordered={false} hoverable>
                  <div class="capability-card__inner">
                    <div
                      class="capability-card__icon"
                      style={{ backgroundColor: `${item.accent}18` }}
                    >
                      <SvgIcon icon={item.icon} style={{ color: item.accent }} class="text-32px" />
                    </div>
                    <div class="capability-card__body">
                      <h4 class="capability-card__title">{$t(item.titleKey)}</h4>
                      <p class="capability-card__desc">{$t(item.descKey)}</p>
                      <NButton type="primary" text class="capability-card__action">
                        {{
                          default: () => $t('page.home.enterModule'),
                          icon: () => <SvgIcon icon="mdi:arrow-right" />
                        }}
                      </NButton>
                    </div>
                  </div>
                </NCard>
              </div>
            </NGi>
          ))}
        </NGrid>
      </div>
    );
  }
});
