import { type PropType, defineComponent, reactive, watch } from 'vue';
import {
  NButton,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect
} from 'naive-ui';
import { MonacoEditor } from '@/components/monaco';

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
    const formData = reactive<{
      label: string;
      config: Api.Workflow.NodeConfig;
    }>({
      label: '',
      config: {}
    });

    watch(
      () => props.node,
      node => {
        if (node) {
          formData.label = node.data?.label || '';
          formData.config = { ...(node.data?.config ?? {}) };
        }
      },
      { immediate: true }
    );

    const renderLlmConfig = () => (
      <>
        <NFormItem label="提供商">
          <NSelect
            v-model:value={(formData.config as Api.Workflow.LlmNodeConfig).provider}
            options={[
              { label: 'OpenAI', value: 'openai' },
              { label: 'Anthropic', value: 'anthropic' },
              { label: 'Custom', value: 'custom' }
            ]}
          />
        </NFormItem>
        <NFormItem label="模型">
          <NSelect
            v-model:value={(formData.config as Api.Workflow.LlmNodeConfig).model}
            options={[
              { label: 'GPT-4', value: 'gpt-4' },
              { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
              { label: 'Claude 3', value: 'claude-3' }
            ]}
            placeholder="选择模型"
          />
        </NFormItem>
        <NFormItem label="提示词">
          <NInput
            v-model:value={(formData.config as Api.Workflow.LlmNodeConfig).prompt}
            type="textarea"
            rows={4}
            placeholder="输入提示词"
          />
        </NFormItem>
        <NFormItem label="系统消息">
          <NInput
            v-model:value={(formData.config as Api.Workflow.LlmNodeConfig).systemMessage}
            type="textarea"
            rows={3}
            placeholder="系统消息（可选）"
          />
        </NFormItem>
        <NFormItem label="温度">
          <NInputNumber
            v-model:value={(formData.config as Api.Workflow.LlmNodeConfig).temperature}
            min={0}
            max={2}
            step={0.1}
            placeholder="0-2"
          />
        </NFormItem>
        <NFormItem label="最大 Tokens">
          <NInputNumber
            v-model:value={(formData.config as Api.Workflow.LlmNodeConfig).maxTokens}
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
          <NInput
            v-model:value={(formData.config as Api.Workflow.HttpNodeConfig).url}
            placeholder="https://api.example.com"
          />
        </NFormItem>
        <NFormItem label="方法">
          <NSelect
            v-model:value={(formData.config as Api.Workflow.HttpNodeConfig).method}
            options={[
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'DELETE', value: 'DELETE' },
              { label: 'PATCH', value: 'PATCH' }
            ]}
          />
        </NFormItem>
        <NFormItem label="超时 (秒)">
          <NInputNumber
            v-model:value={(formData.config as Api.Workflow.HttpNodeConfig).timeout}
            min={1}
            max={300}
          />
        </NFormItem>
      </>
    );

    const renderDatabaseConfig = () => (
      <>
        <NFormItem label="查询语句">
          <NInput
            v-model:value={(formData.config as Api.Workflow.DatabaseNodeConfig).query}
            type="textarea"
            rows={6}
            placeholder="SQL 查询"
          />
        </NFormItem>
      </>
    );

    const renderConditionConfig = () => {
      const cfg = formData.config as Api.Workflow.ConditionNodeConfig;
      type ConditionItem = NonNullable<Api.Workflow.ConditionNodeConfig['conditions']>[number];
      const condition: ConditionItem = cfg.conditions?.[0] ?? {
        variable: 'input',
        operator: '==',
        value: true
      };

      return (
        <>
          <NFormItem label="变量名">
            <NInput
              value={condition.variable}
              onUpdateValue={(v: string) => {
                cfg.conditions = [{ ...condition, variable: v }];
              }}
              placeholder="例如: input.status"
            />
          </NFormItem>
          <NFormItem label="运算符">
            <NSelect
              value={condition.operator}
              onUpdateValue={(v: ConditionItem['operator']) => {
                cfg.conditions = [{ ...condition, operator: v }];
              }}
              options={[
                { label: '等于', value: '==' },
                { label: '不等于', value: '!=' },
                { label: '大于', value: '>' },
                { label: '小于', value: '<' },
                { label: '包含', value: 'contains' }
              ]}
            />
          </NFormItem>
          <NFormItem label="比较值">
            <NInput
              value={String(condition.value ?? '')}
              onUpdateValue={(v: string) => {
                cfg.conditions = [{ ...condition, value: v }];
              }}
              placeholder="比较值"
            />
          </NFormItem>
        </>
      );
    };

    const renderTransformConfig = () => (
      <>
        <NFormItem label="转换脚本">
          <div style={{ height: '300px', border: '1px solid #d0d0d0', borderRadius: '4px' }}>
            <MonacoEditor
              modelValue={(formData.config as Api.Workflow.TransformNodeConfig).script || ''}
              language="javascript"
              height="100%"
              onUpdate:modelValue={(val: string) => {
                (formData.config as Api.Workflow.TransformNodeConfig).script = val;
              }}
            />
          </div>
        </NFormItem>
      </>
    );

    const renderConfigForm = () => {
      if (!props.node) return null;

      switch (props.node.type) {
        case 'llm':
          return renderLlmConfig();
        case 'http':
          return renderHttpConfig();
        case 'database':
          return renderDatabaseConfig();
        case 'condition':
          return renderConditionConfig();
        case 'transform':
          return renderTransformConfig();
        default:
          return null;
      }
    };

    const handleSave = async () => {
      if (!props.node || !props.onUpdate) return;

      await props.onUpdate(props.node.id, {
        data: {
          label: formData.label,
          config: { ...formData.config }
        }
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
