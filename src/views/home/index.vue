<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/modules/app';
import WelcomeBanner from './modules/welcome-banner.vue';
import CapabilityCards from './modules/capability-cards.vue';
import QuickAccess from './modules/quick-access.vue';

const appStore = useAppStore();

const gap = computed(() => (appStore.isMobile ? 0 : 16));
</script>

<template>
  <NSpace vertical :size="16">
    <WelcomeBanner />
    <CapabilityCards />
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24">
        <QuickAccess />
      </NGi>
    </NGrid>
  </NSpace>
</template>

<style scoped></style>
