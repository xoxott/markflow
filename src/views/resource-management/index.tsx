import { computed, defineComponent, getCurrentInstance } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchCreateResource,
  fetchDeleteResource,
  fetchResourceDetail,
  fetchResourceList,
  fetchUpdateResource
} from '@/service/api/resource';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { ResourceFormData } from './components/dialog';
import { useResourceDialog } from './components/useResourceDialog';
import {
  RESOURCE_LIST_SCROLL_X,
  createResourceSearchFields,
  createResourceTableColumns
} from './listUiConfig';

type Resource = Api.ResourceManagement.Resource;

export default defineComponent({
  name: 'ResourceManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const resourceDialog = useResourceDialog(instance?.appContext.app);
    const dialog = useDialog(instance?.appContext.app);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchResourceList,
        listFilters: {
          search: '',
          isActive: undefined
        },
        showTotal: true
      });

    async function handleAdd() {
      await resourceDialog.showResourceForm({
        isEdit: false,
        formData: { code: '', name: '', description: '', isActive: true },
        onConfirm: async (form: ResourceFormData) => {
          await fetchCreateResource({
            code: form.code,
            name: form.name,
            description: form.description || undefined
          });
          message.success($t('common.addSuccess'));
          getData();
        }
      });
    }

    async function handleEdit(row: Resource) {
      const { data: detail } = await fetchResourceDetail(row.id);
      if (!detail) {
        message.error($t('page.resourceManagement.getDetailFailed'));
        return;
      }

      await resourceDialog.showResourceForm({
        isEdit: true,
        formData: {
          code: detail.code,
          name: detail.name,
          description: detail.description || '',
          isActive: detail.isActive
        },
        onConfirm: async (form: ResourceFormData) => {
          await fetchUpdateResource(row.id, {
            name: form.name,
            description: form.description || undefined,
            isActive: form.isActive
          });
          message.success($t('common.updateSuccess'));
          getData();
        }
      });
    }

    async function handleDelete(row: Resource) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteResource(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    const searchConfig = computed(() => createResourceSearchFields());
    const tableColumns = computed(() =>
      createResourceTableColumns({ onEdit: handleEdit, onDelete: handleDelete })
    );

    return () => (
      <TablePage
        class="h-full"
        enableColumnSetting
        searchConfig={searchConfig.value}
        searchModel={searchParams}
        onSearch={onSearch}
        onReset={onReset}
        actionConfig={{
          preset: {
            add: { onClick: handleAdd },
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        rowKey="id"
        scrollX={RESOURCE_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
