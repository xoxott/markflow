<script setup lang="ts">
import { computed } from 'vue';
import type { RouteKey } from '@elegant-router/types';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';

defineOptions({
  name: 'QuickAccess'
});

interface QuickLinkItem {
  key: string;
  routeKey: RouteKey;
  labelKey: App.I18n.I18nKey;
  icon: string;
}

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
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <h3 class="section-title">{{ $t('page.home.quickAccessTitle') }}</h3>
    <div class="quick-access-grid">
      <button
        v-for="item in quickLinks"
        :key="item.key"
        type="button"
        class="quick-access-item"
        @click="handleNavigate(item.routeKey)"
      >
        <span class="quick-access-item__icon">
          <SvgIcon :icon="item.icon" class="text-20px" />
        </span>
        <span class="quick-access-item__label">{{ $t(item.labelKey) }}</span>
        <SvgIcon icon="mdi:chevron-right" class="quick-access-item__arrow text-16px" />
      </button>
    </div>
  </NCard>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 640px) {
  .quick-access-grid {
    grid-template-columns: 1fr;
  }
}

.quick-access-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgb(0 0 0 / 0.06);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

html.dark .quick-access-item {
  border-color: rgb(255 255 255 / 0.08);
}

.quick-access-item:hover {
  border-color: rgb(var(--primary-color) / 0.35);
  background: rgb(var(--primary-color) / 0.04);
}

.quick-access-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgb(var(--primary-color) / 0.1);
  color: rgb(var(--primary-color));
}

.quick-access-item__label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.quick-access-item__arrow {
  color: rgb(0 0 0 / 0.35);
}

html.dark .quick-access-item__arrow {
  color: rgb(255 255 255 / 0.45);
}
</style>
