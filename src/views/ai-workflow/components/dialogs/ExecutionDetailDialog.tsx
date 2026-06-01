import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NSpin,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
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

const statusLabelMap: Record<Api.Workflow.ExecutionStatus, string> = {
  pending: '等待中',
  running: '运行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消'
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
      width: 720,
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
                <div class="flex flex-col gap-4">
                  <NDescriptions
                    bordered
                    column={1}
                    labelPlacement="left"
                    labelStyle={{ width: '120px' }}
                  >
                    <NDescriptionsItem label="工作流">
                      {detail.value.workflowName || `#${detail.value.workflowId}`}
                    </NDescriptionsItem>
                    <NDescriptionsItem label="状态">
                      <NTag type={statusTypeMap[detail.value.status] ?? 'default'} size="small">
                        {statusLabelMap[detail.value.status] ?? detail.value.status}
                      </NTag>
                    </NDescriptionsItem>
                    <NDescriptionsItem label="开始时间">
                      {detail.value.startedAt
                        ? new Date(detail.value.startedAt).toLocaleString('zh-CN')
                        : '-'}
                    </NDescriptionsItem>
                    {detail.value.finishedAt && (
                      <NDescriptionsItem label="结束时间">
                        {new Date(detail.value.finishedAt).toLocaleString('zh-CN')}
                      </NDescriptionsItem>
                    )}
                    {detail.value.duration !== null && detail.value.duration !== undefined && (
                      <NDescriptionsItem label="耗时">{detail.value.duration} ms</NDescriptionsItem>
                    )}
                    {detail.value.error && (
                      <NDescriptionsItem label="错误">{detail.value.error}</NDescriptionsItem>
                    )}
                  </NDescriptions>

                  {detail.value.nodeResults?.length > 0 && (
                    <div>
                      <h4 class="mb-2 text-sm font-medium">节点执行</h4>
                      <NTimeline>
                        {detail.value.nodeResults.map(item => (
                          <NTimelineItem
                            key={item.nodeId}
                            type={
                              item.status === 'success'
                                ? 'success'
                                : item.status === 'failed'
                                  ? 'error'
                                  : 'default'
                            }
                            title={item.nodeName || item.nodeId}
                            content={
                              item.error ||
                              (item.duration !== null && item.duration !== undefined
                                ? `耗时 ${item.duration} ms`
                                : item.status)
                            }
                          />
                        ))}
                      </NTimeline>
                    </div>
                  )}
                </div>
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
