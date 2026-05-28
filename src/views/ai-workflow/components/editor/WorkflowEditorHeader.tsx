import '../styles/workflow-editor-header.scss';

import { type PropType, type Ref, computed, defineComponent, ref } from 'vue';
import { NButton, NIcon, NPopover, NTooltip } from 'naive-ui';
import type { FormInst } from 'naive-ui';
import { Icon } from '@iconify/vue';
import WorkflowMetaFields from '../shared/WorkflowMetaFields';
import type { WorkflowMetaForm } from '../shared/workflow-meta';
import type { WorkflowValidationResult } from '../validation/validate-workflow';

export default defineComponent({
  name: 'WorkflowEditorHeader',
  props: {
    title: {
      type: String,
      default: '工作流编辑器'
    },
    description: {
      type: String,
      default: ''
    },
    metaForm: {
      type: Object as PropType<WorkflowMetaForm>,
      default: undefined
    },
    metaFormRef: {
      type: Object as PropType<Ref<FormInst | null>>,
      default: undefined
    },
    isMetaDirty: { type: Boolean, default: false },
    isMetaSaving: { type: Boolean, default: false },
    showLeftPanel: {
      type: Boolean,
      default: true
    },
    showRightPanel: {
      type: Boolean,
      default: false
    },
    isDirty: { type: Boolean, default: false },
    isSaving: { type: Boolean, default: false },
    canUndo: { type: Boolean, default: false },
    canRedo: { type: Boolean, default: false },
    lastValidation: {
      type: Object as PropType<WorkflowValidationResult | null>,
      default: null
    },
    onBack: { type: Function as PropType<() => void>, default: undefined },
    onToggleLeftPanel: { type: Function as PropType<() => void>, default: undefined },
    onToggleRightPanel: { type: Function as PropType<() => void>, default: undefined },
    onSaveMeta: { type: Function as PropType<() => void>, default: undefined },
    onSave: { type: Function as PropType<() => void>, default: undefined },
    onValidate: { type: Function as PropType<() => void>, default: undefined },
    onUndo: { type: Function as PropType<() => void>, default: undefined },
    onRedo: { type: Function as PropType<() => void>, default: undefined },
    onFitView: { type: Function as PropType<() => void>, default: undefined },
    showMinimap: { type: Boolean, default: false },
    onToggleMinimap: { type: Function as PropType<() => void>, default: undefined },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onImport: { type: Function as PropType<() => void>, default: undefined },
    onExport: { type: Function as PropType<() => void>, default: undefined }
  },
  setup(props) {
    const showMetaPopover = ref(false);

    const titleTip = computed(() => {
      if (!props.description) return props.title;
      return `${props.title}\n${props.description}`;
    });

    const validationHint = computed(() => {
      if (!props.lastValidation) return '验证工作流';
      const { errors, warnings } = props.lastValidation;
      if (errors.length) return `校验：${errors.length} 个错误`;
      if (warnings.length) return `校验：${warnings.length} 个警告`;
      return '校验：已通过';
    });

    return () => (
      <header class="workflow-editor-header">
        <div class="workflow-editor-header__nav">
          <NTooltip>
            {{
              trigger: () => (
                <NButton text size="small" onClick={props.onBack}>
                  <NIcon size={18}>
                    <Icon icon="mdi:arrow-left" />
                  </NIcon>
                </NButton>
              ),
              default: () => '返回列表'
            }}
          </NTooltip>

          <NTooltip disabled={!props.description}>
            {{
              trigger: () => <h1 class="workflow-editor-header__title">{props.title}</h1>,
              default: () => titleTip.value
            }}
          </NTooltip>

          {props.metaForm && (
            <NPopover
              show={showMetaPopover.value}
              onUpdateShow={(value: boolean) => {
                showMetaPopover.value = value;
              }}
              trigger="click"
              placement="bottom-start"
            >
              {{
                trigger: () => (
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NButton size="small" secondary>
                          <div class="flex items-center gap-4px">
                            <NIcon size={16}>
                              <Icon icon="mdi:pencil-outline" />
                            </NIcon>
                            <span>编辑信息</span>
                          </div>
                        </NButton>
                      ),
                      default: () => '编辑工作流名称、描述、标签与状态'
                    }}
                  </NTooltip>
                ),
                default: () => (
                  <div class="workflow-editor-header__meta-form">
                    <WorkflowMetaFields
                      formRef={props.metaFormRef}
                      model={props.metaForm!}
                      showStatus
                    />
                  </div>
                )
              }}
            </NPopover>
          )}

          {props.isMetaDirty && (
            <span class="workflow-editor-header__status workflow-editor-header__status--meta">
              信息未保存
            </span>
          )}
          {props.isDirty && (
            <span class="workflow-editor-header__status workflow-editor-header__status--canvas">
              画布未保存
            </span>
          )}
        </div>

        <div class="workflow-editor-header__actions">
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary disabled={!props.canUndo} onClick={props.onUndo}>
                  <NIcon size={16}>
                    <Icon icon="mdi:undo" />
                  </NIcon>
                </NButton>
              ),
              default: () => '撤销'
            }}
          </NTooltip>
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary disabled={!props.canRedo} onClick={props.onRedo}>
                  <NIcon size={16}>
                    <Icon icon="mdi:redo" />
                  </NIcon>
                </NButton>
              ),
              default: () => '重做'
            }}
          </NTooltip>

          <div class="workflow-editor-header__divider" />

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary onClick={props.onFitView}>
                  <NIcon size={16}>
                    <Icon icon="mdi:fit-to-screen" />
                  </NIcon>
                </NButton>
              ),
              default: () => '适应画布'
            }}
          </NTooltip>
          <NTooltip>
            {{
              trigger: () => (
                <NButton
                  size="small"
                  quaternary
                  type={props.showMinimap ? 'primary' : 'default'}
                  onClick={props.onToggleMinimap}
                >
                  <NIcon size={16}>
                    <Icon icon="mdi:map-outline" />
                  </NIcon>
                </NButton>
              ),
              default: () => (props.showMinimap ? '隐藏小地图' : '显示小地图')
            }}
          </NTooltip>
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary onClick={props.onValidate}>
                  <NIcon size={16}>
                    <Icon icon="mdi:check-circle-outline" />
                  </NIcon>
                </NButton>
              ),
              default: () => validationHint.value
            }}
          </NTooltip>
        </div>

        <div class="workflow-editor-header__panels">
          <NTooltip>
            {{
              trigger: () => (
                <NButton
                  size="small"
                  quaternary
                  type={props.showLeftPanel ? 'primary' : 'default'}
                  onClick={props.onToggleLeftPanel}
                >
                  <NIcon size={16}>
                    <Icon icon="mdi:view-grid-plus-outline" />
                  </NIcon>
                </NButton>
              ),
              default: () => (props.showLeftPanel ? '隐藏节点库' : '显示节点库')
            }}
          </NTooltip>
          <NTooltip>
            {{
              trigger: () => (
                <NButton
                  size="small"
                  quaternary
                  type={props.showRightPanel ? 'primary' : 'default'}
                  onClick={props.onToggleRightPanel}
                >
                  <NIcon size={16}>
                    <Icon icon="mdi:tune-variant" />
                  </NIcon>
                </NButton>
              ),
              default: () => (props.showRightPanel ? '隐藏配置' : '显示配置')
            }}
          </NTooltip>
        </div>

        <div class="workflow-editor-header__save-group">
          <NButton
            size="small"
            secondary
            disabled={!props.isMetaDirty}
            loading={props.isMetaSaving}
            onClick={props.onSaveMeta}
          >
            保存信息
          </NButton>
          <NButton
            size="small"
            type="primary"
            disabled={!props.isDirty}
            loading={props.isSaving}
            onClick={props.onSave}
          >
            保存画布
          </NButton>

          <div class="workflow-editor-header__divider" />

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" secondary onClick={props.onImport}>
                  <div class="flex items-center gap-4px">
                    <NIcon size={16}>
                      <Icon icon="mdi:import" />
                    </NIcon>
                    <span>导入</span>
                  </div>
                </NButton>
              ),
              default: () => '从 JSON 文件导入工作流'
            }}
          </NTooltip>

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" secondary onClick={props.onExport}>
                  <div class="flex items-center gap-4px">
                    <NIcon size={16}>
                      <Icon icon="mdi:export" />
                    </NIcon>
                    <span>导出</span>
                  </div>
                </NButton>
              ),
              default: () => '导出为 JSON 文件'
            }}
          </NTooltip>

          <NButton size="small" secondary onClick={props.onClear}>
            清空
          </NButton>
        </div>
      </header>
    );
  }
});
