import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue';
import { useElementSize } from '@vueuse/core';

/**
 * 为 NDataTable `flexHeight` 提供容器实测高度。
 *
 * 父级需形成 `flex-1 min-h-0` 高度链；`height > 0` 时才启用 `flexHeight`，
 * 避免在布局尚未就绪时错误撑开表格。
 */
export function useDataTableHeight(enabled: MaybeRefOrGetter<boolean> = true) {
  const containerRef = ref<HTMLElement | null>(null);
  const { height } = useElementSize(containerRef);

  const flexHeight = computed(() => toValue(enabled) && height.value > 0);

  return {
    containerRef,
    flexHeight,
    height
  };
}
