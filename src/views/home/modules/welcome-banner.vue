<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import SystemLogo from '@/components/common/system-logo.vue';

defineOptions({
  name: 'WelcomeBanner'
});

const authStore = useAuthStore();
</script>

<template>
  <NCard :bordered="false" class="welcome-banner card-wrapper">
    <div class="welcome-banner__content">
      <div class="welcome-banner__brand">
        <div class="welcome-banner__logo">
          <SystemLogo class="text-36px text-primary" />
        </div>
        <div>
          <p class="welcome-banner__eyebrow">{{ $t('system.subtitle') }}</p>
          <h2 class="welcome-banner__title">
            {{ $t('page.home.greeting', { userName: authStore.userInfo.username }) }}
          </h2>
          <p class="welcome-banner__desc">{{ $t('page.home.platformDesc') }}</p>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.welcome-banner {
  background: linear-gradient(
    135deg,
    rgb(var(--primary-color) / 0.08) 0%,
    rgb(var(--primary-color) / 0.02) 100%
  );
}

.welcome-banner__content {
  padding: 4px 0;
}

.welcome-banner__brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-banner__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 16px;
  background: rgb(var(--primary-color) / 0.12);
}

.welcome-banner__eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--primary-color));
  letter-spacing: 0.02em;
}

.welcome-banner__title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
}

.welcome-banner__desc {
  margin: 0;
  max-width: 640px;
  font-size: 14px;
  line-height: 1.7;
  color: rgb(0 0 0 / 0.55);
}

html.dark .welcome-banner__desc {
  color: rgb(255 255 255 / 0.65);
}
</style>
