import { NButton, NSpace, NTag } from 'naive-ui';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type KnowledgeBase = Api.KnowledgeBase.KnowledgeBase;

const INDEX_STATUS_MAP: Record<
  Api.KnowledgeBase.IndexStatus,
  { labelKey: App.I18n.I18nKey; type: 'default' | 'info' | 'success' | 'warning' | 'error' }
> = {
  pending: { labelKey: 'page.knowledgeBase.indexStatus.pending', type: 'default' },
  indexing: { labelKey: 'page.knowledgeBase.indexStatus.indexing', type: 'info' },
  ready: { labelKey: 'page.knowledgeBase.indexStatus.ready', type: 'success' },
  failed: { labelKey: 'page.knowledgeBase.indexStatus.failed', type: 'error' }
};

export const KNOWLEDGE_BASE_LIST_SCROLL_X = 1200;

export function createKnowledgeBaseSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.knowledgeBase.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '240px'
    }
  ];
}

export interface KnowledgeBaseTableHandlers {
  onEnter: (row: KnowledgeBase) => void;
  onEdit: (row: KnowledgeBase) => void;
  onDelete: (row: KnowledgeBase) => void;
  onReindex: (row: KnowledgeBase) => void;
}

export function createKnowledgeBaseTableColumns(
  h: KnowledgeBaseTableHandlers
): TableColumnConfig<KnowledgeBase>[] {
  return [
    {
      title: $t('page.knowledgeBase.name'),
      key: 'name',
      width: 200,
      fixed: 'left',
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.knowledgeBase.description'),
      key: 'description',
      minWidth: 220,
      ellipsis: { tooltip: true },
      render: row => row.description || '-'
    },
    {
      title: $t('page.knowledgeBase.documentCount'),
      key: 'documentCount',
      width: 100,
      align: 'center'
    },
    {
      title: $t('page.knowledgeBase.chunkCount'),
      key: 'chunkCount',
      width: 100,
      align: 'center'
    },
    {
      title: $t('page.knowledgeBase.indexStatusLabel'),
      key: 'indexStatus',
      width: 120,
      render: row => {
        const config = INDEX_STATUS_MAP[row.indexStatus];
        return <NTag type={config.type}>{$t(config.labelKey)}</NTag>;
      }
    },
    {
      title: $t('page.knowledgeBase.embeddingModel'),
      key: 'embeddingModel',
      width: 180,
      ellipsis: { tooltip: true },
      render: row => row.embeddingModel || '-'
    },
    {
      title: $t('page.knowledgeBase.updatedAt'),
      key: 'updatedAt',
      width: 170,
      render: row => new Date(row.updatedAt).toLocaleString()
    },
    {
      title: $t('common.action'),
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: row => (
        <NSpace size={8}>
          <NButton size="small" type="primary" onClick={() => h.onEnter(row)}>
            {$t('page.knowledgeBase.enter')}
          </NButton>
          <NButton size="small" onClick={() => h.onEdit(row)}>
            {$t('common.edit')}
          </NButton>
          <NButton size="small" onClick={() => h.onReindex(row)}>
            {$t('page.knowledgeBase.reindex')}
          </NButton>
          <NButton size="small" type="error" onClick={() => h.onDelete(row)}>
            {$t('common.delete')}
          </NButton>
        </NSpace>
      )
    }
  ];
}
