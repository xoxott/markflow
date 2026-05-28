import { type PropType, type VNode, defineComponent, ref } from 'vue';
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch
} from 'naive-ui';
import {
  AGENT_TYPE_PATTERN,
  BACKGROUND_OPTIONS,
  ISOLATION_OPTIONS,
  MCP_SERVER_PRESETS,
  MEMORY_SCOPE_OPTIONS,
  PERMISSION_MODE_OPTIONS,
  SKILL_PRESETS,
  STRUCTURED_PERMISSION_OPTIONS
} from '../constants';
import ModelProfileSelect from './ModelProfileSelect';
import ToolMultiSelect from './ToolMultiSelect';

type AgentForm = Partial<Api.AgentManagement.AgentTemplate>;

const SECTIONS = [
  { key: 'basic', label: '基础' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'tools', label: '工具与权限' },
  { key: 'model', label: '模型与限制' },
  { key: 'advanced', label: '高级' }
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export default defineComponent({
  name: 'AgentFormSections',
  props: {
    model: { type: Object as PropType<AgentForm>, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    const activeSection = ref<SectionKey>('basic');
    const skillOptions = SKILL_PRESETS.map(s => ({ label: s, value: s }));
    const mcpOptions = MCP_SERVER_PRESETS.map(s => ({ label: s, value: s }));

    const renderBasic = () => (
      <NForm labelPlacement="top" disabled={props.readonly}>
        <NFormItem label="展示名称" required>
          <NInput v-model:value={props.model.name} placeholder="智能体展示名称" />
        </NFormItem>
        <NFormItem label="Agent Type (slug)" required>
          <NInput
            v-model:value={props.model.agentType}
            placeholder="如 my-research-agent"
            disabled={props.readonly || props.model.source === 'builtin'}
          />
          {!AGENT_TYPE_PATTERN.test(props.model.agentType ?? '') && props.model.agentType && (
            <div class="mt-4px text-xs text-red-500">须为小写字母开头的 slug</div>
          )}
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value={props.model.description}
            type="textarea"
            rows={2}
            placeholder="给 LLM 看的描述"
          />
        </NFormItem>
        <NFormItem label="何时使用 (whenToUse)">
          <NInput
            v-model:value={props.model.whenToUse}
            type="textarea"
            rows={2}
            placeholder="Coordinator 路由决策依据"
          />
        </NFormItem>
        <NFormItem label="颜色标识">
          <NInput v-model:value={props.model.color} placeholder="#6366f1" />
        </NFormItem>
      </NForm>
    );

    const renderPrompt = () => (
      <NForm labelPlacement="top" disabled={props.readonly}>
        <NFormItem label="系统提示 (systemPrompt)">
          <NInput
            v-model:value={props.model.systemPrompt}
            type="textarea"
            rows={12}
            placeholder="系统提示前缀，映射到 systemPromptPrefix"
          />
        </NFormItem>
      </NForm>
    );

    const renderTools = () => (
      <NForm labelPlacement="top" disabled={props.readonly}>
        <NFormItem label="工具白名单">
          <ToolMultiSelect
            value={props.model.tools ?? []}
            onUpdateValue={(v: string[]) => {
              props.model.tools = v.length ? v : undefined;
            }}
          />
        </NFormItem>
        <NFormItem label="工具黑名单">
          <ToolMultiSelect
            value={props.model.disallowedTools ?? []}
            placeholder="禁止使用的工具"
            onUpdateValue={(v: string[]) => {
              props.model.disallowedTools = v;
            }}
          />
        </NFormItem>
        <NFormItem label="权限模式">
          <NSelect
            v-model:value={props.model.permissionMode}
            options={PERMISSION_MODE_OPTIONS}
            clearable
          />
        </NFormItem>
        <NFormItem label="结构化权限">
          <NSelect
            v-model:value={props.model.structuredPermissionMode}
            options={STRUCTURED_PERMISSION_OPTIONS}
            clearable
          />
        </NFormItem>
      </NForm>
    );

    const renderModel = () => (
      <NForm labelPlacement="top" disabled={props.readonly}>
        <NFormItem label="模型配置">
          <ModelProfileSelect
            value={props.model.modelProfileId}
            disabled={props.readonly}
            onUpdateValue={(v: string | undefined) => {
              props.model.modelProfileId = v;
            }}
          />
        </NFormItem>
        <NFormItem label="最大轮次">
          <NInputNumber v-model:value={props.model.maxTurns} min={1} max={50} />
        </NFormItem>
        <NFormItem label="运行模式">
          <NSelect v-model:value={props.model.background} options={BACKGROUND_OPTIONS} clearable />
        </NFormItem>
        <NFormItem label="超时 (ms)">
          <NInputNumber v-model:value={props.model.timeout} min={1000} step={1000} />
        </NFormItem>
        <NFormItem label="结果最大字符数">
          <NInputNumber v-model:value={props.model.maxResultSizeChars} min={1000} step={1000} />
        </NFormItem>
        <NFormItem label="隔离模式">
          <NSelect v-model:value={props.model.isolation} options={ISOLATION_OPTIONS} clearable />
        </NFormItem>
      </NForm>
    );

    const renderAdvanced = () => (
      <NForm labelPlacement="top" disabled={props.readonly}>
        <NFormItem label="Skills">
          <NSelect
            value={props.model.skillIds ?? []}
            options={skillOptions}
            multiple
            filterable
            tag
            onUpdateValue={(v: string[]) => {
              props.model.skillIds = v.length ? v : undefined;
            }}
          />
        </NFormItem>
        <NFormItem label="MCP 服务器">
          <NSelect
            value={props.model.mcpServerIds ?? []}
            options={mcpOptions}
            multiple
            filterable
            tag
            onUpdateValue={(v: string[]) => {
              props.model.mcpServerIds = v.length ? v : undefined;
            }}
          />
        </NFormItem>
        <NFormItem label="记忆范围">
          <NSelect
            value={props.model.memoryScope?.scope}
            options={MEMORY_SCOPE_OPTIONS}
            clearable
            onUpdateValue={(v: Api.AgentManagement.MemoryScope | null) => {
              if (!v) {
                props.model.memoryScope = undefined;
              } else {
                props.model.memoryScope = {
                  scope: v,
                  enabled: props.model.memoryScope?.enabled ?? true
                };
              }
            }}
          />
        </NFormItem>
        {props.model.memoryScope && (
          <NFormItem label="启用记忆">
            <NSwitch
              value={props.model.memoryScope.enabled}
              onUpdateValue={(v: boolean) => {
                if (props.model.memoryScope) props.model.memoryScope.enabled = v;
              }}
            />
          </NFormItem>
        )}
      </NForm>
    );

    const sectionRenderers: Record<SectionKey, () => VNode> = {
      basic: renderBasic,
      prompt: renderPrompt,
      tools: renderTools,
      model: renderModel,
      advanced: renderAdvanced
    };

    return () => (
      <div class="agent-form-sections">
        <NSpace size="small" class="mb-4">
          {SECTIONS.map(section => (
            <NButton
              key={section.key}
              size="small"
              type={activeSection.value === section.key ? 'primary' : 'default'}
              secondary={activeSection.value !== section.key}
              onClick={() => {
                activeSection.value = section.key;
              }}
            >
              {section.label}
            </NButton>
          ))}
        </NSpace>

        {sectionRenderers[activeSection.value]()}
      </div>
    );
  }
});
