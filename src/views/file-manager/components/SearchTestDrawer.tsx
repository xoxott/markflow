import { defineComponent, ref } from 'vue';
import {
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  NTag
} from 'naive-ui';
import { mockKnowledgeBaseApi } from '@/service/api/knowledge-base-mock';
import { $t } from '@/locales';

export default defineComponent({
  name: 'SearchTestDrawer',
  props: {
    show: { type: Boolean, required: true },
    knowledgeBaseId: { type: String, required: true }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const query = ref('');
    const topK = ref(5);
    const minScore = ref(0.5);
    const loading = ref(false);
    const results = ref<Api.KnowledgeBase.SearchResult[]>([]);

    const handleSearch = async () => {
      if (!query.value.trim()) return;
      loading.value = true;
      try {
        const result = await mockKnowledgeBaseApi.fetchSearch({
          knowledgeBaseId: props.knowledgeBaseId,
          query: query.value.trim(),
          topK: topK.value,
          minScore: minScore.value
        });
        results.value = result.data;
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <NDrawer show={props.show} width={520} onUpdate:show={v => emit('update:show', v)}>
        <NDrawerContent title={$t('page.knowledgeBase.searchTestTitle')} closable>
          <NForm labelPlacement="top">
            <NFormItem label={$t('page.knowledgeBase.searchQuery')}>
              <NInput
                v-model:value={query.value}
                type="textarea"
                rows={3}
                placeholder={$t('page.knowledgeBase.searchQueryPlaceholder')}
              />
            </NFormItem>
            <NSpace>
              <NFormItem label="Top K">
                <NInputNumber v-model:value={topK.value} min={1} max={20} />
              </NFormItem>
              <NFormItem label={$t('page.knowledgeBase.minScore')}>
                <NInputNumber v-model:value={minScore.value} min={0} max={1} step={0.05} />
              </NFormItem>
            </NSpace>
            <NButton type="primary" loading={loading.value} onClick={handleSearch}>
              {$t('page.knowledgeBase.runSearch')}
            </NButton>
          </NForm>

          <div class="mt-4">
            {results.value.length === 0 ? (
              <NEmpty description={$t('page.knowledgeBase.noSearchResults')} class="mt-6" />
            ) : (
              <NSpace vertical size={12} class="mt-4">
                {results.value.map((item, index) => (
                  <NCard key={`${item.chunk.id}-${index}`} size="small" bordered>
                    <NSpace vertical size={8}>
                      <NSpace align="center" justify="space-between">
                        <span class="font-medium">{item.document.name}</span>
                        <NTag type="success">{(item.score * 100).toFixed(1)}%</NTag>
                      </NSpace>
                      <div class="text-xs text-gray-500">{item.document.path}</div>
                      {item.highlights?.map(highlight => (
                        <div key={highlight} class="rounded bg-primary/5 p-2 text-sm">
                          {highlight}
                        </div>
                      ))}
                      <div class="line-clamp-4 text-sm text-gray-600">{item.chunk.content}</div>
                    </NSpace>
                  </NCard>
                ))}
              </NSpace>
            )}
          </div>
        </NDrawerContent>
      </NDrawer>
    );
  }
});
