import { defineComponent } from 'vue';
import { NCard } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import SystemLogo from '@/components/common/system-logo.vue';
import { $t } from '@/locales';

export default defineComponent({
  name: 'WelcomeBanner',
  setup() {
    const authStore = useAuthStore();

    return () => (
      <NCard bordered={false} class="welcome-banner card-wrapper">
        <div class="welcome-banner__content">
          <div class="welcome-banner__brand">
            <div class="welcome-banner__logo">
              <SystemLogo class="text-36px text-primary" />
            </div>
            <div>
              <p class="welcome-banner__eyebrow">{$t('system.subtitle')}</p>
              <h2 class="welcome-banner__title">
                {$t('page.home.greeting', { userName: authStore.userInfo.username })}
              </h2>
              <p class="welcome-banner__desc">{$t('page.home.platformDesc')}</p>
            </div>
          </div>
        </div>
      </NCard>
    );
  }
});
