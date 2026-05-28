import {
  computed,
  defineComponent,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { mockAgentApi } from '@/service/api/agent-mock';
import { useDialog } from '@/components/base-dialog/useDialog';
import { templateToExportJson, templateToExportMd } from '../utils/agent-form';
import AgentEditorHeader from '../components/AgentEditorHeader';
import AgentFormSections from '../components/AgentFormSections';

const { fetchAgentDetail, fetchUpdateAgent, fetchPublishAgent, fetchCreateAgent } = mockAgentApi;

export default defineComponent({
  name: 'AgentEditor',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);

    const agentId = computed(() => route.params.id as string);
    const isNew = computed(() => agentId.value === 'new');
    const loading = ref(true);
    const saving = ref(false);
    const isDirty = ref(false);
    const originalJson = ref('');

    const form = reactive<Partial<Api.AgentManagement.AgentTemplate>>({
      name: '',
      agentType: '',
      source: 'custom',
      status: 'draft',
      description: '',
      whenToUse: '',
      systemPrompt: '',
      version: 1
    });

    const isBuiltin = computed(() => form.source === 'builtin');

    watch(
      () => ({ ...form }),
      () => {
        if (!loading.value) {
          isDirty.value = JSON.stringify(form) !== originalJson.value;
        }
      },
      { deep: true }
    );

    async function loadAgent() {
      loading.value = true;
      try {
        if (isNew.value) {
          Object.assign(form, {
            name: '',
            agentType: '',
            source: 'custom',
            status: 'draft',
            description: '',
            whenToUse: '',
            systemPrompt: '',
            version: 1
          });
        } else {
          const result = await fetchAgentDetail(agentId.value);
          Object.assign(form, result.data);
        }
        originalJson.value = JSON.stringify({ ...form });
        isDirty.value = false;
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '加载失败');
        router.push('/agent-management');
      } finally {
        loading.value = false;
      }
    }

    onMounted(loadAgent);

    async function handleSave() {
      if (!form.name || !form.agentType) {
        message.warning('请填写名称和 Agent Type');
        return;
      }
      saving.value = true;
      try {
        if (isNew.value) {
          const result = await fetchCreateAgent({
            name: form.name,
            agentType: form.agentType,
            description: form.description,
            whenToUse: form.whenToUse,
            systemPrompt: form.systemPrompt,
            tools: form.tools,
            disallowedTools: form.disallowedTools,
            modelProfileId: form.modelProfileId,
            maxTurns: form.maxTurns,
            permissionMode: form.permissionMode,
            structuredPermissionMode: form.structuredPermissionMode,
            background: form.background,
            timeout: form.timeout,
            maxResultSizeChars: form.maxResultSizeChars,
            isolation: form.isolation,
            mcpServerIds: form.mcpServerIds,
            skillIds: form.skillIds,
            memoryScope: form.memoryScope,
            color: form.color
          });
          message.success('创建成功');
          originalJson.value = JSON.stringify({ ...result.data.agent });
          isDirty.value = false;
          router.replace(`/agent-management/editor/${result.data.agent.id}`);
        } else {
          const result = await fetchUpdateAgent(agentId.value, { ...form });
          Object.assign(form, result.data.agent);
          originalJson.value = JSON.stringify({ ...form });
          isDirty.value = false;
          message.success('已保存');
        }
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '保存失败');
      } finally {
        saving.value = false;
      }
    }

    async function handlePublish() {
      if (isNew.value || isDirty.value) {
        await handleSave();
      }
      if (isNew.value) return;

      await dialog.confirm({
        title: '确认发布',
        content: '发布后工作流可引用此模板，是否继续？',
        type: 'warning',
        onConfirm: async () => {
          try {
            const result = await fetchPublishAgent(agentId.value);
            Object.assign(form, result.data.agent);
            originalJson.value = JSON.stringify({ ...form });
            isDirty.value = false;
            message.success('发布成功');
          } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : '发布失败');
          }
        }
      });
    }

    function downloadExport(content: string, filename: string) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function handleExportJson() {
      downloadExport(
        templateToExportJson(form as Api.AgentManagement.AgentTemplate),
        `${form.agentType || 'agent'}.json`
      );
    }

    function handleExportMd() {
      downloadExport(
        templateToExportMd(form as Api.AgentManagement.AgentTemplate),
        `${form.agentType || 'agent'}.md`
      );
    }

    onBeforeRouteLeave((_to, _from, next) => {
      if (!isDirty.value) {
        next();
        return;
      }
      dialog.confirm({
        title: '未保存的更改',
        content: '有未保存的更改，确定离开吗？',
        type: 'warning',
        onConfirm: () => next(),
        onCancel: () => next(false)
      });
    });

    const previewJson = computed(() => JSON.stringify(form, null, 2));

    return () => (
      <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <AgentEditorHeader
          title={form.name || '新建智能体'}
          status={form.status ?? 'draft'}
          isDirty={isDirty.value}
          isSaving={saving.value}
          isBuiltin={isBuiltin.value}
          onBack={() => router.push('/agent-management')}
          onSave={handleSave}
          onPublish={handlePublish}
          onExportJson={handleExportJson}
          onExportMd={handleExportMd}
        />

        {!loading.value && (
          <div class="min-h-0 flex flex-1 gap-4 p-4">
            <div class="min-w-0 flex-1 overflow-y-auto rounded-lg bg-white p-4 dark:bg-gray-800">
              <AgentFormSections model={form} readonly={isBuiltin.value} />
            </div>
            <div class="w-80 flex flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800">
              <div class="border-b border-gray-200 px-3 py-2 text-sm font-medium dark:border-gray-700">
                JSON 预览
              </div>
              <pre class="min-h-0 flex-1 overflow-auto p-3 text-xs leading-relaxed">
                {previewJson.value}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }
});
