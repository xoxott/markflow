import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { mockKnowledgeBaseApi } from '@/service/api/knowledge-base-mock';
import { useDialog } from '@/components/base-dialog/useDialog';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { type KnowledgeBaseFormData, createEmptyKnowledgeBaseForm } from './components/dialog';
import { useKnowledgeBaseDialog } from './components/useKnowledgeBaseDialog';
import {
  KNOWLEDGE_BASE_LIST_SCROLL_X,
  createKnowledgeBaseSearchFields,
  createKnowledgeBaseTableColumns
} from './listUiConfig';

const {
  fetchKnowledgeBaseList,
  fetchCreateKnowledgeBase,
  fetchUpdateKnowledgeBase,
  fetchDeleteKnowledgeBase,
  fetchReindexKnowledgeBase
} = mockKnowledgeBaseApi;

type KnowledgeBase = Api.KnowledgeBase.KnowledgeBase;

export default defineComponent({
  name: 'KnowledgeBaseList',
  setup() {
    const message = useMessage();
    const router = useRouter();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);
    const kbDialog = useKnowledgeBaseDialog(instance?.appContext.app);

    const selectedRowKeys = ref<string[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchKnowledgeBaseList as unknown as Parameters<
          typeof useAdminListTable
        >[0]['apiFn'],
        listFilters: { search: '' },
        showTotal: true,
        immediate: true
      });

    async function handleAdd() {
      const formData = createEmptyKnowledgeBaseForm();
      await kbDialog.showKnowledgeBaseForm({
        isEdit: false,
        formData,
        onConfirm: async (confirmData: KnowledgeBaseFormData) => {
          await fetchCreateKnowledgeBase({
            name: confirmData.name,
            description: confirmData.description,
            tags: confirmData.tags,
            embeddingModel: confirmData.embeddingModel
          });
          message.success($t('common.addSuccess'));
          await getData();
        }
      });
    }

    async function handleEdit(row: KnowledgeBase) {
      await kbDialog.showKnowledgeBaseForm({
        isEdit: true,
        formData: {
          name: row.name,
          description: row.description ?? '',
          tags: row.tags ?? [],
          embeddingModel: row.embeddingModel ?? 'text-embedding-3-small'
        },
        onConfirm: async (confirmData: KnowledgeBaseFormData) => {
          await fetchUpdateKnowledgeBase(row.id, {
            name: confirmData.name,
            description: confirmData.description,
            tags: confirmData.tags,
            embeddingModel: confirmData.embeddingModel
          });
          message.success($t('common.modifySuccess'));
          await getData();
        }
      });
    }

    function handleEnter(row: KnowledgeBase) {
      router.push({ name: 'file-manager-documents', params: { kbId: row.id } });
    }

    async function handleDelete(row: KnowledgeBase) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteKnowledgeBase(row.id);
        message.success($t('common.deleteSuccess'));
        await getData();
      });
    }

    async function handleReindex(row: KnowledgeBase) {
      await fetchReindexKnowledgeBase(row.id);
      message.success($t('page.knowledgeBase.reindexStarted'));
      await getData();
    }

    const searchConfig = computed(() => createKnowledgeBaseSearchFields());

    const tableColumns = computed(() =>
      createKnowledgeBaseTableColumns({
        onEnter: handleEnter,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onReindex: handleReindex
      })
    );

    return () => (
      <TablePage
        class="h-full"
        searchConfig={searchConfig.value}
        searchModel={searchParams}
        onSearch={onSearch}
        onReset={onReset}
        actionConfig={{
          preset: {
            add: { label: $t('page.knowledgeBase.createTitle'), onClick: handleAdd },
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        selectedKeys={selectedRowKeys.value}
        onUpdateSelectedKeys={keys => {
          selectedRowKeys.value = keys as string[];
        }}
        rowKey="id"
        scrollX={KNOWLEDGE_BASE_LIST_SCROLL_X}
        searchLabelWidth={96}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
