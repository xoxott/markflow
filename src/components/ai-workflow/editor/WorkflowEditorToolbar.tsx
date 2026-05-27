import { type PropType, computed, defineComponent } from 'vue';
import { NButton, NIcon, NSpace, NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';
import type { WorkflowValidationResult } from '../validation/validate-workflow';

export default defineComponent({
  name: 'WorkflowEditorToolbar',
  props: {
    isDirty: { type: Boolean, default: false },
    isSaving: { type: Boolean, default: false },
    canUndo: { type: Boolean, default: false },
    canRedo: { type: Boolean, default: false },
    lastValidation: {
      type: Object as PropType<WorkflowValidationResult | null>,
      default: null
    },
    onSave: { type: Function as PropType<() => void>, default: undefined },
    onValidate: { type: Function as PropType<() => void>, default: undefined },
    onUndo: { type: Function as PropType<() => void>, default: undefined },
    onRedo: { type: Function as PropType<() => void>, default: undefined },
    onFitView: { type: Function as PropType<() => void>, default: undefined },
    onClear: { type: Function as PropType<() => void>, default: undefined }
  },
  setup(props) {
    const validationHint = computed(() => {
      if (!props.lastValidation) return null;
      const { errors, warnings } = props.lastValidation;
      if (errors.length) return `${errors.length} 个错误`;
      if (warnings.length) return `${warnings.length} 个警告`;
      return '已通过';
    });

    return () => (
      <div class="workflow-editor-toolbar flex items-center justify-between border-b border-gray-200 bg-white/90 px-3 py-2 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
        <NSpace size="small" align="center">
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary disabled={!props.canUndo} onClick={props.onUndo}>
                  <NIcon size={18}>
                    <Icon icon="mdi:undo" />
                  </NIcon>
                </NButton>
              ),
              default: () => '撤销 (Ctrl+Z)'
            }}
          </NTooltip>
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary disabled={!props.canRedo} onClick={props.onRedo}>
                  <NIcon size={18}>
                    <Icon icon="mdi:redo" />
                  </NIcon>
                </NButton>
              ),
              default: () => '重做 (Ctrl+Shift+Z)'
            }}
          </NTooltip>
          <div class="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" quaternary onClick={props.onFitView}>
                  <NIcon size={18}>
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
                <NButton size="small" quaternary onClick={props.onValidate}>
                  <NIcon size={18}>
                    <Icon icon="mdi:check-circle-outline" />
                  </NIcon>
                </NButton>
              ),
              default: () => '验证工作流'
            }}
          </NTooltip>
          {validationHint.value && (
            <span class="text-xs text-gray-500 dark:text-gray-400">{validationHint.value}</span>
          )}
        </NSpace>

        <NSpace size="small">
          {props.isDirty && <span class="text-xs text-amber-600 dark:text-amber-400">未保存</span>}
          <NButton size="small" onClick={props.onClear}>
            清空
          </NButton>
          <NButton size="small" type="primary" loading={props.isSaving} onClick={props.onSave}>
            保存 (Ctrl+S)
          </NButton>
        </NSpace>
      </div>
    );
  }
});
