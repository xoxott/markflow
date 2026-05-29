import { computed, defineComponent, onMounted, ref } from 'vue';
import { NSelect } from 'naive-ui';
import { QUERY_BOOLEAN_TRUE } from '@/constants/queryBoolean';
import { fetchRoleList } from '@/service/api/role';
import { $t } from '@/locales';

const FALLBACK_ROLE_OPTIONS = [
  { label: 'R_SUPER', value: 'R_SUPER' },
  { label: 'R_ADMIN', value: 'R_ADMIN' },
  { label: 'R_USER', value: 'R_USER' }
];

export default defineComponent({
  name: 'RoleCodeSelect',
  props: {
    value: { type: Array as () => string[], default: () => [] }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const options = ref(FALLBACK_ROLE_OPTIONS);

    onMounted(async () => {
      try {
        const result = await fetchRoleList({ page: 1, limit: 100, isActive: QUERY_BOOLEAN_TRUE });
        const roles = result.data?.lists ?? [];
        if (roles.length) {
          options.value = roles.map((role: Api.RoleManagement.Role) => ({
            label: `${role.code}${role.name ? `（${role.name}）` : ''}`,
            value: role.code
          }));
        }
      } catch {
        // 后端不可用时使用内置角色选项
      }
    });

    const innerValue = computed({
      get: () => props.value,
      set: (val: string[]) => emit('update:value', val)
    });

    return () => (
      <NSelect
        v-model:value={innerValue.value}
        options={options.value}
        multiple
        filterable
        clearable
        placeholder={$t('page.menuManagement.roleCodesHint')}
      />
    );
  }
});
