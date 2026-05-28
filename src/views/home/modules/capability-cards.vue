<script setup lang="ts">
import { computed } from 'vue';
import type { RouteKey } from '@elegant-router/types';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';

defineOptions({
  name: 'CapabilityCards'
});

interface CapabilityItem {
  key: string;
  routeKey: RouteKey;
  titleKey: App.I18n.I18nKey;
  descKey: App.I18n.I18nKey;
  icon: string;
  accent: string;
}

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
    routeKey: 'file-manager',
    titleKey: 'page.home.knowledgeBase.title',
    descKey: 'page.home.knowledgeBase.desc',
    icon: 'mdi:book-open-page-variant',
    accent: '#5B8DEF'
  }
]);

function handleEnter(routeKey: RouteKey) {
  routerPushByKeyWithMetaQuery(routeKey);
}
</script>

<template>
  <div>
    <h3 class="section-title">{{ $t('page.home.capabilitiesTitle') }}</h3>
    <NGrid cols="1 s:1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
      <NGi v-for="item in capabilities" :key="item.key">
        <NCard
          :bordered="false"
          class="capability-card card-wrapper"
          hoverable
          @click="handleEnter(item.routeKey)"
        >
          <div class="capability-card__inner">
            <div class="capability-card__icon" :style="{ backgroundColor: `${item.accent}18` }">
              <SvgIcon :icon="item.icon" :style="{ color: item.accent }" class="text-32px" />
            </div>
            <div class="capability-card__body">
              <h4 class="capability-card__title">{{ $t(item.titleKey) }}</h4>
              <p class="capability-card__desc">{{ $t(item.descKey) }}</p>
              <NButton type="primary" text class="capability-card__action">
                {{ $t('page.home.enterModule') }}
                <template #icon>
                  <SvgIcon icon="mdi:arrow-right" />
                </template>
              </NButton>
            </div>
          </div>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.capability-card {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.capability-card:hover {
  transform: translateY(-2px);
}

.capability-card__inner {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.capability-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 14px;
}

.capability-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.capability-card__desc {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.7;
  color: rgb(0 0 0 / 0.55);
}

html.dark .capability-card__desc {
  color: rgb(255 255 255 / 0.65);
}

.capability-card__action {
  padding-left: 0;
}
</style>
