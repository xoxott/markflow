import { type PropType, defineComponent, reactive, ref, watch } from 'vue';
import {
  NButton,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch
} from 'naive-ui';
import { mockAgentApi } from '@/service/api/agent-mock';
import { MonacoEditor } from '@/components/monaco';
import AgentTemplateSelect from '@/components/agent/AgentTemplateSelect';

/** 编辑器右侧内嵌配置面板（与画布同区域，不使用全局 Drawer） */
export default defineComponent({
  name: 'NodeConfigPanel',
  props: {
    node: {
      type: Object as PropType<Api.Workflow.WorkflowNode | null>,
      default: null
    },
    onUpdate: {
      type: Function as PropType<
        (nodeId: string, updates: Partial<Api.Workflow.WorkflowNode>) => void | Promise<void>
      >,
      default: undefined
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: undefined
    }
  },
  setup(props) {
    const formData = reactive<any>({
      label: '',
      description: '',
      config: {}
    });

    const manualOverride = ref(false);

    watch(
      () => props.node,
      node => {
        if (node) {
          formData.label = node.name || '';
          formData.description = node.description || '';
          formData.config = {
            mode: 'template',
            ...node.config
          };
          manualOverride.value = formData.config.mode === 'manual';
        }
      },
      { immediate: true }
    );

    async function applyTemplate(template: Api.AgentManagement.AgentTemplateListItem) {
      formData.config.agentTemplateId = template.id;
      formData.config.agentTemplateVersion = template.version;
      formData.config.mode = manualOverride.value ? 'manual' : 'template';

      if (!manualOverride.value) {
        formData.config.model = template.modelLabel ?? 'inherit';
        formData.config.systemPrompt = template.systemPrompt;
        formData.config.maxTokens = undefined;
        if (template.maxTurns !== undefined && template.maxTurns !== null) {
          formData.config.overrides = {
            ...formData.config.overrides,
            maxTurns: template.maxTurns
          };
        }
      }

      if (props.node && props.onUpdate) {
        await props.onUpdate(props.node.id, {
          config: { ...formData.config }
        });
      }
    }

    const renderAIConfig = () => (
      <>
        <NFormItem label="配置模式">
          <NSwitch
            value={manualOverride.value}
            onUpdateValue={(v: boolean) => {
              manualOverride.value = v;
              formData.config.mode = v ? 'manual' : 'template';
            }}
          >
            {{
              checked: () => '手动覆盖',
              unchecked: () => '模板绑定'
            }}
          </NSwitch>
        </NFormItem>

        {!manualOverride.value ? (
          <NFormItem label="智能体模板">
            <AgentTemplateSelect
              value={formData.config.agentTemplateId}
              onUpdateValue={async (_id, template) => {
                if (template) await applyTemplate(template);
              }}
            />
          </NFormItem>
        ) : (
          <NFormItem label="模型">
            <NSelect
              v-model:value={formData.config.model}
              options={[
                { label: 'GPT-4', value: 'gpt-4' },
                { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
                { label: 'Claude', value: 'claude-3' }
              ]}
              placeholder="选择AI模型"
            />
          </NFormItem>
        )}

        {formData.config.agentTemplateId && !manualOverride.value && (
          <NFormItem label="模板版本">
            <span class="text-xs text-gray-500">
              v{formData.config.agentTemplateVersion ?? '?'}
            </span>
          </NFormItem>
        )}

        <NFormItem label="提示词">
          <NInput
            v-model:value={formData.config.prompt}
            type="textarea"
            rows={4}
            placeholder="输入提示词"
          />
        </NFormItem>
        <NFormItem label="系统提示">
          <NInput
            v-model:value={formData.config.systemPrompt}
            type="textarea"
            rows={3}
            placeholder="系统提示（模板模式下可覆盖）"
            disabled={!manualOverride.value && !!formData.config.agentTemplateId}
          />
        </NFormItem>
        <NFormItem label="温度">
          <NInputNumber
            v-model:value={formData.config.temperature}
            min={0}
            max={2}
            step={0.1}
            placeholder="0-2"
          />
        </NFormItem>
        <NFormItem label="最大Tokens">
          <NInputNumber
            v-model:value={formData.config.maxTokens}
            min={1}
            max={4096}
            placeholder="最大生成长度"
          />
        </NFormItem>
      </>
    );

    const renderHttpConfig = () => (
      <>
        <NFormItem label="URL">
          <NInput v-model:value={formData.config.url} placeholder="https://api.example.com" />
        </NFormItem>
        <NFormItem label="方法">
          <NSelect
            v-model:value={formData.config.method}
            options={[
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'DELETE', value: 'DELETE' },
              { label: 'PATCH', value: 'PATCH' }
            ]}
          />
        </NFormItem>
        <NFormItem label="请求头 (JSON)">
          <NInput
            v-model:value={formData.config.headers}
            type="textarea"
            rows={3}
            placeholder='{"Content-Type": "application/json"}'
          />
        </NFormItem>
        <NFormItem label="请求体">
          <NInput v-model:value={formData.config.body} type="textarea" rows={4} />
        </NFormItem>
        <NFormItem label="超时 (秒)">
          <NInputNumber v-model:value={formData.config.timeout} min={1} max={300} />
        </NFormItem>
      </>
    );

    const renderDatabaseConfig = () => (
      <>
        <NFormItem label="连接字符串">
          <NInput
            v-model:value={formData.config.connectionString}
            type="password"
            showPasswordOn="click"
            placeholder="数据库连接字符串"
          />
        </NFormItem>
        <NFormItem label="查询语句">
          <NInput
            v-model:value={formData.config.query}
            type="textarea"
            rows={6}
            placeholder="SQL查询"
          />
        </NFormItem>
      </>
    );

    const renderConditionConfig = () => (
      <>
        <NFormItem label="条件表达式">
          <NInput
            v-model:value={formData.config.expression}
            type="textarea"
            rows={3}
            placeholder="例如: input.value > 100"
          />
        </NFormItem>
      </>
    );

    const renderTransformConfig = () => (
      <>
        <NFormItem label="转换代码">
          <div style={{ height: '300px', border: '1px solid #d0d0d0', borderRadius: '4px' }}>
            <MonacoEditor
              modelValue={formData.config.code || ''}
              language="javascript"
              height="100%"
              onUpdate:modelValue={(val: string) => (formData.config.code = val)}
            />
          </div>
        </NFormItem>
        <NFormItem label="语言">
          <NSelect
            v-model:value={formData.config.language}
            options={[
              { label: 'JavaScript', value: 'javascript' },
              { label: 'Python', value: 'python' }
            ]}
          />
        </NFormItem>
      </>
    );

    const renderFileConfig = () => (
      <>
        <NFormItem label="操作类型">
          <NSelect
            v-model:value={formData.config.operation}
            options={[
              { label: '读取', value: 'read' },
              { label: '写入', value: 'write' },
              { label: '删除', value: 'delete' }
            ]}
          />
        </NFormItem>
        <NFormItem label="文件路径">
          <NInput v-model:value={formData.config.path} placeholder="/path/to/file" />
        </NFormItem>
        {formData.config.operation === 'write' && (
          <NFormItem label="文件内容">
            <NInput v-model:value={formData.config.content} type="textarea" rows={6} />
          </NFormItem>
        )}
      </>
    );

    const renderConfigForm = () => {
      if (!props.node) return null;

      switch (props.node.type) {
        case 'ai':
          return renderAIConfig();
        case 'http':
          return renderHttpConfig();
        case 'database':
          return renderDatabaseConfig();
        case 'condition':
          return renderConditionConfig();
        case 'transform':
          return renderTransformConfig();
        case 'file':
          return renderFileConfig();
        default:
          return null;
      }
    };

    const handleSave = async () => {
      if (!props.node || !props.onUpdate) return;

      if (
        formData.config.mode !== 'manual' &&
        formData.config.agentTemplateId &&
        !formData.config.agentTemplateVersion
      ) {
        const detail = await mockAgentApi.fetchAgentDetail(formData.config.agentTemplateId);
        formData.config.agentTemplateVersion = detail.data.version;
      }

      await props.onUpdate(props.node.id, {
        name: formData.label,
        description: formData.description,
        config: formData.config
      });
    };

    return () => {
      if (!props.node) {
        return (
          <div class="node-config-panel h-full flex items-center justify-center bg-white dark:bg-gray-800">
            <NEmpty description="请选择一个节点进行配置" />
          </div>
        );
      }

      return (
        <div class="node-config-panel h-full flex flex-col bg-white dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <h3 class="text-xs text-gray-800 font-medium dark:text-gray-100">节点配置</h3>
            {props.onClose && (
              <NButton text onClick={props.onClose}>
                ✕
              </NButton>
            )}
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-4">
            <NForm labelPlacement="top" labelWidth={80}>
              <NFormItem label="节点名称">
                <NInput v-model:value={formData.label} placeholder="节点名称" />
              </NFormItem>

              <NFormItem label="描述">
                <NInput
                  v-model:value={formData.description}
                  type="textarea"
                  rows={2}
                  placeholder="节点描述"
                />
              </NFormItem>

              <NDivider />

              {renderConfigForm()}
            </NForm>
          </div>

          <div class="border-t border-gray-200 p-4 dark:border-gray-700">
            <NButton type="primary" block onClick={handleSave}>
              保存配置
            </NButton>
          </div>
        </div>
      );
    };
  }
});
