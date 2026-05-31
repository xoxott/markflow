import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { NTreeSelect } from 'naive-ui';
import { $t } from '@/locales';
import type { MenuTreeNode } from '../types';
import { buildActiveMenuTreeOptions } from '../utils/active-menu';

export default defineComponent({
  name: 'ActiveMenuTreeSelect',
  props: {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    treeData: { type: Array as PropType<MenuTreeNode[]>, default: () => [] },
    excludeSidebarKey: { type: String, default: '' },
    excludeMenuId: { type: String, default: '' }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const options = computed(() =>
      buildActiveMenuTreeOptions(props.treeData, {
        excludeSidebarKey: props.excludeSidebarKey || undefined,
        excludeMenuId: props.excludeMenuId || undefined
      })
    );

    const innerValue = computed({
      get: () => props.value || null,
      set: (val: string | null) => emit('update:value', val ?? '')
    });

    return () => (
      <NTreeSelect
        v-model:value={innerValue.value}
        options={options.value}
        filterable
        clearable
        disabled={props.disabled}
        defaultExpandAll
        placeholder={$t('page.menuManagement.activeMenuPlaceholder')}
      />
    );
  }
});
