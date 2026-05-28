import type { PropType, Ref } from 'vue';
import { computed, defineComponent } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { NDynamicTags, NForm, NFormItem, NInput, NSelect, NText } from 'naive-ui';
import type { WorkflowMetaForm } from './workflow-meta';
import {
  WORKFLOW_STATUS_OPTIONS,
  createWorkflowMetaRules,
  getWorkflowStatusHint
} from './workflow-meta';

export default defineComponent({
  name: 'WorkflowMetaFields',
  props: {
    model: {
      type: Object as PropType<WorkflowMetaForm>,
      required: true
    },
    formRef: {
      type: Object as PropType<Ref<FormInst | null> | FormInst | null>,
      default: undefined
    },
    rules: {
      type: Object as PropType<FormRules>,
      default: undefined
    },
    showStatus: {
      type: Boolean,
      default: true
    },
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'top'
    },
    labelWidth: {
      type: [Number, String] as PropType<number | string>,
      default: 80
    }
  },
  setup(props) {
    const formRules = computed(() => props.rules ?? createWorkflowMetaRules());

    const statusHint = computed(() =>
      props.showStatus ? getWorkflowStatusHint(props.model.status) : null
    );

    return () => (
      <NForm
        ref={props.formRef as any}
        model={props.model}
        rules={formRules.value}
        labelPlacement={props.labelPlacement}
        labelWidth={props.labelWidth}
      >
        <NFormItem label="名称" path="name">
          <NInput v-model:value={props.model.name} placeholder="请输入工作流名称" />
        </NFormItem>

        <NFormItem label="描述" path="description">
          <NInput
            v-model:value={props.model.description}
            type="textarea"
            rows={3}
            placeholder="请输入工作流描述（可选）"
          />
        </NFormItem>

        <NFormItem label="标签" path="tags">
          <NDynamicTags v-model:value={props.model.tags} />
        </NFormItem>

        {props.showStatus && (
          <NFormItem label="状态" path="status">
            <div class="w-full flex flex-col gap-6px">
              <NSelect v-model:value={props.model.status} options={WORKFLOW_STATUS_OPTIONS} />
              {statusHint.value && (
                <NText depth={3} class="text-12px leading-snug">
                  {statusHint.value}
                </NText>
              )}
            </div>
          </NFormItem>
        )}
      </NForm>
    );
  }
});
