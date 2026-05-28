<script lang="ts" setup>
import logoSvg from '@/assets/svg-icon/logo.svg?raw';

defineOptions({ name: 'SystemLogo', inheritAttrs: false });
</script>

<template>
  <span class="system-logo inline-flex shrink-0" v-bind="$attrs" v-html="logoSvg" />
</template>

<style scoped>
.system-logo :deep(svg) {
  display: block;
  width: 1em;
  height: 1em;
}
</style>
