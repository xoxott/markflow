import { type PropType, defineComponent } from 'vue';
import { NButton, NIcon, NTag, NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';

export default defineComponent({
  name: 'AgentEditorHeader',
  props: {
    title: { type: String, default: '智能体编辑器' },
    status: { type: String as PropType<Api.AgentManagement.AgentStatus>, default: 'draft' },
    isDirty: { type: Boolean, default: false },
    isSaving: { type: Boolean, default: false },
    isBuiltin: { type: Boolean, default: false },
    onBack: { type: Function as PropType<() => void>, default: undefined },
    onSave: { type: Function as PropType<() => void>, default: undefined },
    onPublish: { type: Function as PropType<() => void>, default: undefined },
    onExportJson: { type: Function as PropType<() => void>, default: undefined },
    onExportMd: { type: Function as PropType<() => void>, default: undefined }
  },
  setup(props) {
    const statusLabel: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      disabled: '已停用'
    };

    return () => (
      <header class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <div class="flex items-center gap-3">
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
          <h1 class="text-base font-medium">{props.title}</h1>
          <NTag size="small" bordered={false}>
            {statusLabel[props.status] ?? props.status}
          </NTag>
          {props.isDirty && <span class="text-xs text-orange-500">未保存</span>}
        </div>
        <div class="flex items-center gap-2">
          {!props.isBuiltin && (
            <>
              <NButton size="small" secondary loading={props.isSaving} onClick={props.onSave}>
                保存草稿
              </NButton>
              {props.status !== 'published' && (
                <NButton size="small" type="primary" onClick={props.onPublish}>
                  发布
                </NButton>
              )}
            </>
          )}
          <NButton size="small" secondary onClick={props.onExportJson}>
            导出 JSON
          </NButton>
          <NButton size="small" secondary onClick={props.onExportMd}>
            导出 MD
          </NButton>
        </div>
      </header>
    );
  }
});
