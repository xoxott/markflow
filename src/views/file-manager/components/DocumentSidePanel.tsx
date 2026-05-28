import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { NButton, NCard, NEmpty, NList, NListItem, NSkeleton, NSpace, NTag, NText } from 'naive-ui';
import { mockKnowledgeBaseApi } from '@/service/api/knowledge-base-mock';
import { $t } from '@/locales';

const DOC_STATUS_MAP: Record<
  Api.KnowledgeBase.DocumentStatus,
  { labelKey: App.I18n.I18nKey; type: 'default' | 'info' | 'success' | 'warning' | 'error' }
> = {
  uploaded: { labelKey: 'page.knowledgeBase.docStatus.uploaded', type: 'default' },
  processing: { labelKey: 'page.knowledgeBase.docStatus.processing', type: 'info' },
  indexed: { labelKey: 'page.knowledgeBase.docStatus.indexed', type: 'success' },
  failed: { labelKey: 'page.knowledgeBase.docStatus.failed', type: 'error' }
};

export default defineComponent({
  name: 'DocumentSidePanel',
  props: {
    document: {
      type: Object as () => Api.KnowledgeBase.Document | null,
      default: null
    },
    knowledgeBaseId: { type: String, required: true }
  },
  emits: ['reindex'],
  setup(props, { emit }) {
    const loading = ref(false);
    const chunks = ref<Api.KnowledgeBase.Chunk[]>([]);

    const statusConfig = computed(() => {
      if (!props.document) return null;
      return DOC_STATUS_MAP[props.document.status];
    });

    async function loadChunks() {
      if (!props.document || props.document.isDirectory) {
        chunks.value = [];
        return;
      }

      loading.value = true;
      try {
        const result = await mockKnowledgeBaseApi.fetchDocumentChunks(props.document.id);
        chunks.value = result.data;
      } finally {
        loading.value = false;
      }
    }

    watch(
      () => props.document?.id,
      () => {
        loadChunks();
      },
      { immediate: true }
    );

    onMounted(() => {
      if (props.document?.status === 'processing') {
        const timer = window.setInterval(async () => {
          if (!props.document) return;
          const detail = await mockKnowledgeBaseApi.fetchDocumentDetail(
            props.knowledgeBaseId,
            props.document.path
          );
          if (detail.data.status !== 'processing') {
            window.clearInterval(timer);
            await loadChunks();
          }
        }, 1500);
      }
    });

    return () => {
      if (!props.document) {
        return (
          <NCard bordered={false} class="h-full card-wrapper">
            <NEmpty description={$t('page.knowledgeBase.selectDocumentHint')} />
          </NCard>
        );
      }

      if (props.document.isDirectory) {
        return (
          <NCard bordered={false} class="h-full card-wrapper">
            <NEmpty description={$t('page.knowledgeBase.folderSelectedHint')} />
          </NCard>
        );
      }

      return (
        <NCard
          bordered={false}
          class="h-full card-wrapper"
          title={$t('page.knowledgeBase.documentPanel')}
        >
          <NSpace vertical size={12}>
            <div>
              <NText depth={3}>{$t('page.knowledgeBase.documentName')}</NText>
              <div class="mt-1 font-medium">{props.document.name}</div>
            </div>

            {statusConfig.value && (
              <div>
                <NText depth={3}>{$t('page.knowledgeBase.docStatusLabel')}</NText>
                <div class="mt-1">
                  <NTag type={statusConfig.value.type}>{$t(statusConfig.value.labelKey)}</NTag>
                </div>
              </div>
            )}

            <div>
              <NText depth={3}>{$t('page.knowledgeBase.chunkCount')}</NText>
              <div class="mt-1">{props.document.chunkCount}</div>
            </div>

            {props.document.error && (
              <div>
                <NText depth={3}>{$t('page.knowledgeBase.errorMessage')}</NText>
                <div class="mt-1 text-error">{props.document.error}</div>
              </div>
            )}

            <NSpace>
              <NButton
                size="small"
                onClick={() => emit('reindex', props.document!)}
                disabled={props.document.status === 'processing'}
              >
                {$t('page.knowledgeBase.reindexDocument')}
              </NButton>
            </NSpace>

            <div>
              <NText strong>{$t('page.knowledgeBase.chunkList')}</NText>
              {loading.value ? (
                <NSkeleton text repeat={4} class="mt-3" />
              ) : chunks.value.length === 0 ? (
                <NEmpty size="small" class="mt-3" description={$t('page.knowledgeBase.noChunks')} />
              ) : (
                <NList bordered class="mt-3">
                  {chunks.value.map(chunk => (
                    <NListItem key={chunk.id}>
                      <div class="mb-1 text-xs text-gray-500">
                        #{chunk.position} · {chunk.tokenCount} tokens
                      </div>
                      <div class="line-clamp-4 text-sm">{chunk.content}</div>
                    </NListItem>
                  ))}
                </NList>
              )}
            </div>
          </NSpace>
        </NCard>
      );
    };
  }
});
