import { computed, defineComponent, getCurrentInstance, reactive, ref } from 'vue';
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  useMessage
} from 'naive-ui';
import { mockModelProfileApi } from '@/service/api/model-profile-mock';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { useDialog } from '@/components/base-dialog/useDialog';
import BaseDialog from '@/components/base-dialog';
import { $t } from '@/locales';
import {
  MODEL_PROFILE_LIST_SCROLL_X,
  createModelProfileSearchFields,
  createModelProfileTableColumns
} from './listUiConfig';

const {
  fetchModelProfileList,
  fetchCreateModelProfile,
  fetchUpdateModelProfile,
  fetchDeleteModelProfile,
  fetchSaveModelCredential,
  fetchTestModelConnection
} = mockModelProfileApi;

type Profile = Api.AgentManagement.ModelProfile;

export default defineComponent({
  name: 'ModelProfileManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);

    const formVisible = ref(false);
    const credentialVisible = ref(false);
    const isEdit = ref(false);
    const editingId = ref('');
    const credentialProfileId = ref('');

    const form = reactive<Api.AgentManagement.CreateModelProfileRequest>({
      name: '',
      provider: 'anthropic',
      modelId: '',
      maxTokens: 4096,
      thinking: false,
      isDefault: false,
      enabled: true
    });

    const credentialForm = reactive({ apiKey: '', organization: '' });

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchModelProfileList as NaiveUI.TableApiFn,
        listFilters: { search: '', provider: undefined },
        showTotal: true,
        immediate: true
      });

    function resetForm() {
      Object.assign(form, {
        name: '',
        provider: 'anthropic' as const,
        modelId: '',
        maxTokens: 4096,
        thinking: false,
        isDefault: false,
        enabled: true
      });
    }

    function handleAdd() {
      isEdit.value = false;
      editingId.value = '';
      resetForm();
      formVisible.value = true;
    }

    async function handleEdit(row: Profile) {
      isEdit.value = true;
      editingId.value = row.id;
      Object.assign(form, {
        name: row.name,
        provider: row.provider,
        modelId: row.modelId,
        baseURL: row.baseURL,
        maxTokens: row.maxTokens,
        thinking: row.thinking,
        isDefault: row.isDefault,
        enabled: row.enabled
      });
      formVisible.value = true;
    }

    async function handleFormConfirm() {
      if (!form.name || !form.modelId) {
        message.warning('请填写名称和模型 ID');
        return;
      }
      try {
        if (isEdit.value) {
          await fetchUpdateModelProfile(editingId.value, form);
          message.success('更新成功');
        } else {
          await fetchCreateModelProfile(form);
          message.success('创建成功');
        }
        formVisible.value = false;
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '操作失败');
      }
    }

    function handleCredential(row: Profile) {
      credentialProfileId.value = row.id;
      credentialForm.apiKey = '';
      credentialForm.organization = '';
      credentialVisible.value = true;
    }

    async function handleCredentialConfirm() {
      if (!credentialForm.apiKey) {
        message.warning('请输入 API Key');
        return;
      }
      try {
        await fetchSaveModelCredential(credentialProfileId.value, credentialForm);
        message.success('凭证已保存');
        credentialVisible.value = false;
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '保存失败');
      }
    }

    async function handleTest(row: Profile) {
      try {
        const result = await fetchTestModelConnection(row.id);
        message.success(
          `${result.data.message} (${result.data.latencyMs}ms) — ${result.data.models?.join(', ')}`
        );
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '连接失败');
      }
    }

    async function handleToggleEnabled(row: Profile, enabled: boolean) {
      try {
        await fetchUpdateModelProfile(row.id, { enabled });
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '操作失败');
      }
    }

    async function handleDelete(row: Profile) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteModelProfile(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    const tableColumns = computed(() =>
      createModelProfileTableColumns({
        onEdit: handleEdit,
        onCredential: handleCredential,
        onTest: handleTest,
        onDelete: handleDelete,
        onToggleEnabled: handleToggleEnabled
      })
    );

    return () => (
      <div class="h-full">
        <TablePage
          class="h-full"
          searchConfig={createModelProfileSearchFields()}
          searchModel={searchParams}
          onSearch={onSearch}
          onReset={onReset}
          actionConfig={{
            preset: {
              add: { label: $t('page.modelProfileManagement.add'), onClick: handleAdd },
              refresh: { onClick: getData }
            }
          }}
          columns={tableColumns.value}
          data={data.value}
          loading={loading.value}
          pagination={pagination}
          rowKey="id"
          scrollX={MODEL_PROFILE_LIST_SCROLL_X}
          searchCardBordered={false}
          actionCardBordered={false}
        />

        <BaseDialog
          show={formVisible.value}
          config={{
            title: isEdit.value ? $t('common.edit') : $t('common.add'),
            width: 520,
            onClose: () => {
              formVisible.value = false;
            }
          }}
        >
          {{
            default: () => (
              <NForm labelPlacement="left" labelWidth={100}>
                <NFormItem label="名称">
                  <NInput v-model:value={form.name} />
                </NFormItem>
                <NFormItem label="Provider">
                  <NSelect
                    v-model:value={form.provider}
                    options={[
                      { label: 'Anthropic', value: 'anthropic' },
                      { label: 'OpenAI', value: 'openai' }
                    ]}
                  />
                </NFormItem>
                <NFormItem label="Model ID">
                  <NInput v-model:value={form.modelId} placeholder="claude-sonnet-4-20250514" />
                </NFormItem>
                <NFormItem label="Base URL">
                  <NInput v-model:value={form.baseURL} placeholder="可选" />
                </NFormItem>
                <NFormItem label="Max Tokens">
                  <NInputNumber v-model:value={form.maxTokens} min={256} />
                </NFormItem>
                <NFormItem label="Thinking">
                  <NSwitch v-model:value={form.thinking} />
                </NFormItem>
                <NFormItem label="默认">
                  <NSwitch v-model:value={form.isDefault} />
                </NFormItem>
                <NFormItem label="启用">
                  <NSwitch v-model:value={form.enabled} />
                </NFormItem>
              </NForm>
            ),
            footer: () => (
              <div class="flex justify-end gap-2">
                <NButton onClick={() => (formVisible.value = false)}>{$t('common.cancel')}</NButton>
                <NButton type="primary" onClick={handleFormConfirm}>
                  {$t('common.confirm')}
                </NButton>
              </div>
            )
          }}
        </BaseDialog>

        <BaseDialog
          show={credentialVisible.value}
          config={{
            title: $t('page.modelProfileManagement.credentialDialogTitle'),
            width: 480,
            onClose: () => {
              credentialVisible.value = false;
            }
          }}
        >
          {{
            default: () => (
              <NForm labelPlacement="left" labelWidth={100}>
                <NFormItem label="API Key">
                  <NInput
                    v-model:value={credentialForm.apiKey}
                    type="password"
                    showPasswordOn="click"
                    placeholder="sk-..."
                  />
                </NFormItem>
                <NFormItem label="Organization">
                  <NInput v-model:value={credentialForm.organization} placeholder="可选" />
                </NFormItem>
              </NForm>
            ),
            footer: () => (
              <div class="flex justify-end gap-2">
                <NButton onClick={() => (credentialVisible.value = false)}>
                  {$t('common.cancel')}
                </NButton>
                <NButton type="primary" onClick={handleCredentialConfirm}>
                  {$t('common.confirm')}
                </NButton>
              </div>
            )
          }}
        </BaseDialog>
      </div>
    );
  }
});
