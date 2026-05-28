import { computed, defineComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NSpace, useMessage } from 'naive-ui';
import { mockKnowledgeBaseApi } from '@/service/api/knowledge-base-mock';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import { $t } from '@/locales';
import FileManagerDrawers from '../components/FileManagerDrawers';
import DocumentSidePanel from '../components/DocumentSidePanel';
import SearchTestDrawer from '../components/SearchTestDrawer';
import { useKnowledgeBaseDocumentsPage } from '../composables/useKnowledgeBaseDocumentsPage';

export default defineComponent({
  name: 'KnowledgeBaseDocuments',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const kbId = route.params.kbId as string;
    const showSearchDrawer = ref(false);

    const page = useKnowledgeBaseDocumentsPage(kbId);

    watch(
      () => page.logic.selectedFiles.value,
      files => {
        const file = files[0] ?? null;
        page.selectDocumentByFile(file);
      },
      { deep: true }
    );

    const handleBack = () => {
      router.push({ name: 'file-manager' });
    };

    const handleReindexKb = async () => {
      await mockKnowledgeBaseApi.fetchReindexKnowledgeBase(kbId);
      message.success($t('page.knowledgeBase.reindexStarted'));
      await page.loadKnowledgeBaseDetail();
      await page.loadSidebarNavigation();
    };

    const handleReindexDocument = async (doc: Api.KnowledgeBase.Document) => {
      await mockKnowledgeBaseApi.fetchReindexDocument(kbId, doc.path);
      message.success($t('page.knowledgeBase.reindexDocumentStarted'));
      const detail = await mockKnowledgeBaseApi.fetchDocumentDetail(kbId, doc.path);
      page.selectedDocument.value = detail.data;
    };

    const sidebarConfig = computed(() => ({
      quickAccessItems: page.quickAccessItems.value,
      fileTypeItems: page.fileTypeItems.value,
      treeData: page.folderTree.value,
      activeKey: page.sidebarActiveKey.value,
      onNavigate: page.handleSidebarNavigate,
      quickAccessLabel: $t('page.knowledgeBase.sidebar.quickAccess'),
      fileTypesLabel: $t('page.knowledgeBase.sidebar.fileTypes'),
      foldersLabel: $t('page.knowledgeBase.sidebar.folders')
    }));

    return () => (
      <div class="h-full flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-container px-4 py-3">
          <div>
            <div class="text-lg font-semibold">
              {page.knowledgeBase.value?.name ?? $t('page.knowledgeBase.documentsTitle')}
            </div>
            <div class="mt-1 text-sm text-gray-500">
              {page.knowledgeBase.value?.description || $t('page.knowledgeBase.documentsSubtitle')}
            </div>
          </div>
          <NSpace>
            <NButton onClick={handleBack}>{$t('page.knowledgeBase.backToList')}</NButton>
            <NButton onClick={handleReindexKb}>{$t('page.knowledgeBase.reindex')}</NButton>
            <NButton type="primary" onClick={() => (showSearchDrawer.value = true)}>
              {$t('page.knowledgeBase.searchTest')}
            </NButton>
          </NSpace>
        </div>

        <input
          ref={page.fileInputRef}
          type="file"
          multiple
          class="hidden"
          onChange={page.handleFileInputChange}
        />

        <div class="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="min-h-0 overflow-hidden rounded-lg bg-container">
            <FileExplorer
              logic={page.logic}
              containerRef={page.containerRef}
              onOpen={page.handleOpenFile}
              onUpload={() => page.fileInputRef.value?.click()}
              onFilesDrop={page.handleFilesDrop}
              hideDataSourceSwitch
              knowledgeBaseMode
              sidebarConfig={sidebarConfig.value}
            />
            <FileManagerDrawers logic={page.logic} preview={page.preview} hideUploadDrawer />
          </div>

          <DocumentSidePanel
            document={page.selectedDocument.value}
            knowledgeBaseId={kbId}
            onReindex={handleReindexDocument}
          />
        </div>

        <SearchTestDrawer
          show={showSearchDrawer.value}
          knowledgeBaseId={kbId}
          onUpdate:show={(v: boolean) => (showSearchDrawer.value = v)}
        />
      </div>
    );
  }
});
