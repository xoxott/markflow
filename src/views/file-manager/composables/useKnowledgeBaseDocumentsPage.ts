import { onMounted, ref, shallowRef } from 'vue';
import type { TreeOption } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { mockKnowledgeBaseApi } from '@/service/api/knowledge-base-mock';
import { KnowledgeBaseFileDataSource } from '@/components/file-explorer/datasources';
import { useFileExplorerLogic } from '@/components/file-explorer/composables/useFileExplorerLogic';
import { useFilePreview } from '@/components/file-explorer/composables/useFilePreview';
import type { QuickAccessItem } from '@/components/file-explorer/layout/FileSidebar';
import {
  type FileOpenPreference,
  resolveFileOpenMode
} from '@/components/file-explorer/open/resolveFileOpenMode';
import type { FileItem } from '@/components/file-explorer/types/file-explorer';
import { mapFolderTree, mapSidebarItems } from '../utils/sidebar-icons';

/** 知识库文档页编排 */
export function useKnowledgeBaseDocumentsPage(knowledgeBaseId: string) {
  const message = useMessage();
  const containerRef = ref<HTMLElement | null>(null);
  const knowledgeBase = shallowRef<Api.KnowledgeBase.KnowledgeBase | null>(null);
  const selectedDocument = shallowRef<Api.KnowledgeBase.Document | null>(null);
  const fileInputRef = ref<HTMLInputElement | null>(null);

  const listQuery = ref<Api.KnowledgeBase.DocumentListQuery>({ path: '/' });
  const sidebarActiveKey = ref('/');
  const quickAccessItems = ref<QuickAccessItem[]>([]);
  const fileTypeItems = ref<QuickAccessItem[]>([]);
  const folderTree = ref<TreeOption[]>([]);

  const dataSource = new KnowledgeBaseFileDataSource({
    knowledgeBaseId,
    api: mockKnowledgeBaseApi,
    getListQuery: () => listQuery.value
  });

  /* eslint-disable @typescript-eslint/no-use-before-define -- logic and handlers reference each other */
  const loadSidebarNavigation = async () => {
    const result = await mockKnowledgeBaseApi.fetchSidebarNavigation(knowledgeBaseId);
    quickAccessItems.value = mapSidebarItems(result.data.quickAccess);
    fileTypeItems.value = mapSidebarItems(result.data.fileTypes);
    folderTree.value = mapFolderTree(result.data.folderTree);
  };

  const applyListQuery = async (next: Api.KnowledgeBase.DocumentListQuery, activeKey: string) => {
    listQuery.value = next;
    sidebarActiveKey.value = activeKey;
    await logic.refreshFileList();
  };

  const handleSidebarNavigate = async (key: string) => {
    if (mockKnowledgeBaseApi.isVirtualSidebarPath(key)) {
      const quickAccess = mockKnowledgeBaseApi.parseQuickAccess(key);
      const fileType = mockKnowledgeBaseApi.parseFileType(key);
      await applyListQuery(
        {
          path: '/',
          quickAccess,
          fileType
        },
        key
      );
      return;
    }

    await applyListQuery({ path: key }, key);
    logic.currentPath.value = key;
  };

  const uploadFilesToKnowledgeBase = async (files: File[], currentPath: string) => {
    if (files.length === 0) return;

    for (const file of files) {
      let content: string | undefined;
      if (file.type.startsWith('text/') || file.name.endsWith('.md')) {
        content = await file.text();
      }

      await mockKnowledgeBaseApi.fetchUploadDocument({
        knowledgeBaseId,
        path: currentPath,
        fileName: file.name,
        size: file.size,
        mimeType: file.type || undefined,
        content
      });
    }

    message.success(`已上传 ${files.length} 个文件，正在索引...`);
    await logic.refreshFileList();
    await loadKnowledgeBaseDetail();
    await loadSidebarNavigation();
  };

  const logic = useFileExplorerLogic({
    initialItems: [],
    containerRef,
    initialDataSourceType: 'server',
    customDataSource: dataSource,
    knowledgeBaseMode: true,
    defaultViewMode: 'list',
    onOpen: (file: FileItem) => handleOpenFile(file),
    onUploadFile: () => fileInputRef.value?.click(),
    onUploadFolder: () => fileInputRef.value?.click()
  });

  const originalBreadcrumbNavigate = logic.handleBreadcrumbNavigate;
  logic.handleBreadcrumbNavigate = async (path: string) => {
    await applyListQuery({ path }, path);
    await originalBreadcrumbNavigate(path);
  };

  const preview = useFilePreview({
    dataSource: () => logic.dataSource.value,
    refreshFileList: logic.refreshFileList
  });

  const handleOpenFile = async (file: FileItem, preference: FileOpenPreference = 'auto') => {
    const mode = resolveFileOpenMode(file, preference);

    if (mode === 'folder') {
      const targetPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
      await handleSidebarNavigate(targetPath);
      return;
    }

    if (file.type === 'file') {
      try {
        const detail = await mockKnowledgeBaseApi.fetchDocumentDetail(knowledgeBaseId, file.path);
        selectedDocument.value = detail.data;
      } catch {
        selectedDocument.value = null;
      }
    }

    if (mode.type === 'unsupported') {
      message.warning(mode.message);
      return;
    }

    await preview.openFile(file, {
      preferPreview: mode.type === 'preview',
      editorKind: mode.type === 'editor' ? mode.editorKind : undefined
    });
  };

  const handleFilesDrop = async (files: File[]) => {
    const uploadPath =
      listQuery.value.path && !listQuery.value.quickAccess && !listQuery.value.fileType
        ? listQuery.value.path
        : logic.currentPath.value;
    await uploadFilesToKnowledgeBase(files, uploadPath);
  };

  const handleFileInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    await handleFilesDrop(files);
  };

  const loadKnowledgeBaseDetail = async () => {
    const result = await mockKnowledgeBaseApi.fetchKnowledgeBaseDetail(knowledgeBaseId);
    knowledgeBase.value = result.data;
  };

  const selectDocumentByFile = async (file: FileItem | null) => {
    if (!file || file.type === 'folder') {
      selectedDocument.value = null;
      return;
    }
    try {
      const detail = await mockKnowledgeBaseApi.fetchDocumentDetail(knowledgeBaseId, file.path);
      selectedDocument.value = detail.data;
    } catch {
      selectedDocument.value = null;
    }
  };

  onMounted(async () => {
    await loadKnowledgeBaseDetail();
    await loadSidebarNavigation();
    await logic.refreshFileList();
    containerRef.value?.focus();
  });
  /* eslint-enable @typescript-eslint/no-use-before-define */

  return {
    containerRef,
    fileInputRef,
    logic,
    preview,
    knowledgeBase,
    selectedDocument,
    quickAccessItems,
    fileTypeItems,
    folderTree,
    sidebarActiveKey,
    handleOpenFile,
    handleFilesDrop,
    handleFileInputChange,
    handleSidebarNavigate,
    loadKnowledgeBaseDetail,
    loadSidebarNavigation,
    selectDocumentByFile
  };
}
