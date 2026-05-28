import '../styles/workflow-editor-header.scss';

import { type PropType, computed, defineComponent } from 'vue';
import { NButton, NIcon, NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';
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
    onSave: { type: Function as PropType<() => void>, default: undefined },
    onValidate: { type: Function as PropType<() => void>, default: undefined },
    onUndo: { type: Function as PropType<() => void>, default: undefined },
    onRedo: { type: Function as PropType<() => void>, default: undefined },
    onFitView: { type: Function as PropType<() => void>, default: undefined },
    showMinimap: { type: Boolean, default: false },
    onToggleMinimap: { type: Function as PropType<() => void>, default: undefined },
    onClear: { type: Function as PropType<() => void>, default: undefined }
  },
  setup(props) {
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

          {props.isDirty && <span class="workflow-editor-header__status">未保存</span>}
        </div>

        <div class="workflow-editor-header__actions">
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="tiny" quaternary disabled={!props.canUndo} onClick={props.onUndo}>
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
                <NButton size="tiny" quaternary disabled={!props.canRedo} onClick={props.onRedo}>
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
                <NButton size="tiny" quaternary onClick={props.onFitView}>
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
                  size="tiny"
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
                <NButton size="tiny" quaternary onClick={props.onValidate}>
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
                  size="tiny"
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
                  size="tiny"
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
          <NButton size="tiny" onClick={props.onClear}>
            清空
          </NButton>
          <NButton size="tiny" type="primary" loading={props.isSaving} onClick={props.onSave}>
            保存
          </NButton>
        </div>
      </header>
    );
  }
});
