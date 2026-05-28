import { computed, defineComponent, getCurrentInstance, reactive, ref } from 'vue';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage
} from 'naive-ui';
import { mockAgentRunApi } from '@/service/api/agent-run-mock';
import { mockAgentApi } from '@/service/api/agent-mock';
import AgentTemplateSelect from '@/components/agent/AgentTemplateSelect';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { useDialog } from '@/components/base-dialog/useDialog';
import BaseDialog from '@/components/base-dialog';
import {
  AGENT_TEAM_LIST_SCROLL_X,
  createAgentTeamSearchFields,
  createAgentTeamTableColumns
} from './listUiConfig';

const {
  fetchAgentTeamList,
  fetchAgentTeamDetail,
  fetchCreateAgentTeam,
  fetchUpdateAgentTeam,
  fetchDeleteAgentTeam,
  fetchStartAgentTeam,
  fetchStopAgentTeam
} = mockAgentRunApi;

type Team = Api.AgentManagement.AgentTeam;

export default defineComponent({
  name: 'AgentTeamManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);

    const formVisible = ref(false);
    const detailVisible = ref(false);
    const isEdit = ref(false);
    const editingId = ref('');
    const teamDetail = ref<Api.AgentManagement.AgentTeamDetail | null>(null);

    const coordinatorOptions = ref<Array<{ label: string; value: string }>>([]);

    const form = reactive<Api.AgentManagement.CreateAgentTeamRequest>({
      name: '',
      coordinatorAgentType: 'general-purpose',
      workerTemplateIds: [],
      phaseStrategy: 'default',
      description: ''
    });

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchAgentTeamList as NaiveUI.TableApiFn,
        listFilters: { search: '', status: undefined },
        showTotal: true,
        immediate: true
      });

    async function loadCoordinatorOptions() {
      const result = await mockAgentApi.fetchPublishedAgents();
      coordinatorOptions.value = result.data.map(a => ({
        label: `${a.name} (${a.agentType})`,
        value: a.agentType
      }));
    }

    loadCoordinatorOptions();

    function handleAdd() {
      isEdit.value = false;
      editingId.value = '';
      Object.assign(form, {
        name: '',
        coordinatorAgentType: 'general-purpose',
        workerTemplateIds: [],
        phaseStrategy: 'default',
        description: ''
      });
      formVisible.value = true;
    }

    async function handleEdit(row: Team) {
      isEdit.value = true;
      editingId.value = row.id;
      Object.assign(form, {
        name: row.name,
        coordinatorAgentType: row.coordinatorAgentType,
        workerTemplateIds: [...row.workerTemplateIds],
        phaseStrategy: row.phaseStrategy ?? 'default',
        description: row.description ?? ''
      });
      formVisible.value = true;
    }

    async function handleFormConfirm() {
      if (!form.name) {
        message.warning('请填写团队名称');
        return;
      }
      try {
        if (isEdit.value) {
          await fetchUpdateAgentTeam(editingId.value, form);
          message.success('更新成功');
        } else {
          await fetchCreateAgentTeam(form);
          message.success('创建成功');
        }
        formVisible.value = false;
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '操作失败');
      }
    }

    async function handleDetail(row: Team) {
      const result = await fetchAgentTeamDetail(row.id);
      teamDetail.value = result.data;
      detailVisible.value = true;
    }

    async function handleStart(row: Team) {
      try {
        const result = await fetchStartAgentTeam(row.id);
        message.success(`编排已启动，会话 ${result.data.sessionId}`);
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '启动失败');
      }
    }

    async function handleStop(row: Team) {
      try {
        await fetchStopAgentTeam(row.id);
        message.success('已停止');
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '停止失败');
      }
    }

    async function handleDelete(row: Team) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteAgentTeam(row.id);
        message.success('删除成功');
        getData();
      });
    }

    const tableColumns = computed(() =>
      createAgentTeamTableColumns({
        onDetail: handleDetail,
        onStart: handleStart,
        onStop: handleStop,
        onEdit: handleEdit,
        onDelete: handleDelete
      })
    );

    return () => (
      <div class="h-full">
        <TablePage
          class="h-full"
          searchConfig={createAgentTeamSearchFields()}
          searchModel={searchParams}
          onSearch={onSearch}
          onReset={onReset}
          actionConfig={{
            preset: {
              add: { label: '新建团队', onClick: handleAdd },
              refresh: { onClick: getData }
            }
          }}
          columns={tableColumns.value}
          data={data.value}
          loading={loading.value}
          pagination={pagination}
          rowKey="id"
          scrollX={AGENT_TEAM_LIST_SCROLL_X}
          searchCardBordered={false}
          actionCardBordered={false}
        />

        <BaseDialog
          show={formVisible.value}
          config={{
            title: isEdit.value ? '编辑团队' : '新建团队',
            width: 560,
            onClose: () => {
              formVisible.value = false;
            }
          }}
        >
          {{
            default: () => (
              <NForm labelPlacement="top">
                <NFormItem label="团队名称">
                  <NInput v-model:value={form.name} />
                </NFormItem>
                <NFormItem label="协调 Agent">
                  <NSelect
                    v-model:value={form.coordinatorAgentType}
                    options={coordinatorOptions.value}
                  />
                </NFormItem>
                <NFormItem label="Worker 模板">
                  <AgentTemplateSelect
                    value={form.workerTemplateIds[0]}
                    onUpdateValue={(_id, template) => {
                      if (template && !form.workerTemplateIds.includes(template.id)) {
                        form.workerTemplateIds.push(template.id);
                      }
                    }}
                  />
                  <div class="mt-2 text-xs text-gray-500">
                    已选: {form.workerTemplateIds.join(', ') || '无'}
                  </div>
                </NFormItem>
                <NFormItem label="阶段策略">
                  <NSelect
                    v-model:value={form.phaseStrategy}
                    options={[
                      { label: '默认四阶段', value: 'default' },
                      { label: '自定义', value: 'custom' }
                    ]}
                  />
                </NFormItem>
                <NFormItem label="描述">
                  <NInput v-model:value={form.description} type="textarea" rows={2} />
                </NFormItem>
              </NForm>
            ),
            footer: () => (
              <div class="flex justify-end gap-2">
                <NButton onClick={() => (formVisible.value = false)}>取消</NButton>
                <NButton type="primary" onClick={handleFormConfirm}>
                  确定
                </NButton>
              </div>
            )
          }}
        </BaseDialog>

        <NDrawer
          show={detailVisible.value}
          width={480}
          onUpdateShow={(v: boolean) => (detailVisible.value = v)}
        >
          <NDrawerContent title={teamDetail.value?.name ?? '团队详情'}>
            {teamDetail.value && (
              <div class="space-y-4">
                <p class="text-sm text-gray-600">{teamDetail.value.description}</p>
                <div>
                  <div class="mb-2 text-sm font-medium">Workers</div>
                  {teamDetail.value.workers.map(w => (
                    <div
                      key={w.workerId}
                      class="mb-2 flex items-center justify-between border rounded p-2 text-sm"
                    >
                      <span>
                        {w.name} ({w.agentType})
                      </span>
                      <span class="text-gray-500">{w.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </NDrawerContent>
        </NDrawer>
      </div>
    );
  }
});
