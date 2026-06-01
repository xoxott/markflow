import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace, NSpin } from 'naive-ui';
import { workflowP1MockApi } from '@/service/api/workflow-mock';
import BaseDialog from '@/components/base-dialog';
import type { VersionHistoryDialogOptions } from './dialog';

export default defineComponent({
  name: 'VersionHistoryDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<VersionHistoryDialogOptions>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const loading = ref(false);
    const versions = ref<Api.Workflow.WorkflowVersion[]>([]);
    const restoring = ref<number | null>(null);

    const dialogConfig = computed(() => ({
      title: '版本历史（P1 Mock）',
      width: 720,
      height: 'auto',
      draggable: true,
      onClose: () => emit('update:show', false)
    }));

    async function loadVersions() {
      loading.value = true;
      try {
        const { data } = await workflowP1MockApi.fetchWorkflowVersions(props.config.workflowId);
        versions.value = Array.isArray(data) ? data : [];
      } finally {
        loading.value = false;
      }
    }

    async function handleRestore(version: number) {
      if (!props.config.onRestore) return;
      restoring.value = version;
      try {
        await props.config.onRestore(version);
        await loadVersions();
      } finally {
        restoring.value = null;
      }
    }

    const columns = [
      {
        title: '版本',
        key: 'version',
        width: 80,
        render: (row: Api.Workflow.WorkflowVersion) => `v${row.version}`
      },
      {
        title: '说明',
        key: 'changes',
        ellipsis: { tooltip: true },
        render: (row: Api.Workflow.WorkflowVersion) => row.changes || '-'
      },
      {
        title: '创建时间',
        key: 'createdAt',
        width: 180,
        render: (row: Api.Workflow.WorkflowVersion) =>
          new Date(row.createdAt).toLocaleString('zh-CN')
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (row: Api.Workflow.WorkflowVersion) =>
          props.config.onRestore ? (
            <NButton
              size="small"
              loading={restoring.value === row.version}
              onClick={() => handleRestore(row.version)}
            >
              恢复
            </NButton>
          ) : (
            '-'
          )
      }
    ];

    onMounted(() => {
      loadVersions();
    });

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NSpin show={loading.value}>
              <NDataTable columns={columns} data={versions.value} size="small" />
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
