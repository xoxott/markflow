import { defineComponent } from 'vue';
import { AdminRemoteSelect } from '@/components/admin-remote-select';
import { $t } from '@/locales';

export default defineComponent({
  name: 'RoleCodeSelect',
  props: {
    value: { type: Array as () => string[], default: () => [] }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () => (
      <AdminRemoteSelect
        resource="roles"
        valueKey="code"
        value={props.value}
        multiple
        placeholder={$t('page.menuManagement.roleCodesHint')}
        onUpdate:value={value => emit('update:value', (value as string[]) ?? [])}
      />
    );
  }
});
