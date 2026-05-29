import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { NButton, NDescriptions, NDescriptionsItem, NSpace, NSpin, NTag } from 'naive-ui';
import { fetchExecutionDetail } from '@/service/api/workflow';
import BaseDialog from '@/components/base-dialog';
import type { ExecutionDetailDialogOptions } from './dialog';

const statusTypeMap: Record<
  Api.Workflow.ExecutionStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  pending: 'default',
  running: 'info',
  success: 'success',
  failed: 'error',
  cancelled: 'warning'
};

export default defineComponent({
  name: 'ExecutionDetailDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<ExecutionDetailDialogOptions>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const loading = ref(false);
    const detail = ref<Api.Workflow.ExecutionDetail | null>(null);

    const dialogConfig = computed(() => ({
      title: '执行详情',
      width: 640,
      height: 'auto',
      draggable: true,
      onClose: () => emit('update:show', false)
    }));

    async function loadDetail() {
      loading.value = true;
      try {
        const { data } = await fetchExecutionDetail(props.config.executionId);
        detail.value = data;
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      loadDetail();
    });

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NSpin show={loading.value}>
              {detail.value ? (
                <NDescriptions
                  bordered
                  column={1}
                  labelPlacement="left"
                  labelStyle={{ width: '120px' }}
                >
                  <NDescriptionsItem label="工作流">{detail.value.workflowName}</NDescriptionsItem>
                  <NDescriptionsItem label="状态">
                    <NTag type={statusTypeMap[detail.value.status] ?? 'default'} size="small">
                      {detail.value.status}
                    </NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="开始时间">
                    {new Date(detail.value.startTime).toLocaleString('zh-CN')}
                  </NDescriptionsItem>
                  {detail.value.endTime && (
                    <NDescriptionsItem label="结束时间">
                      {new Date(detail.value.endTime).toLocaleString('zh-CN')}
                    </NDescriptionsItem>
                  )}
                  {detail.value.duration !== undefined && detail.value.duration !== null && (
                    <NDescriptionsItem label="耗时">{detail.value.duration} ms</NDescriptionsItem>
                  )}
                  {detail.value.error && (
                    <NDescriptionsItem label="错误">{detail.value.error}</NDescriptionsItem>
                  )}
                </NDescriptions>
              ) : (
                !loading.value && <div>未找到执行记录</div>
              )}
            </NSpin>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={() => emit('update:show', false)}>关闭</NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
