import { type PropType, computed, defineComponent } from 'vue';
import { NButton, NCard, NSpace, NTag } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import BaseDialog from '@/components/base-dialog';
import { $t } from '@/locales';
import { getLogStatusTagType } from '../listUiConfig';
import type { LogDetailDialogConfig } from './dialog';

export default defineComponent({
  name: 'LogDetailDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<LogDetailDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? $t('page.logManagement.logDetail'),
      width: props.config.width ?? 900,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    return () => {
      const log = props.config.log;
      const metadataText =
        log.metadata && Object.keys(log.metadata).length > 0
          ? JSON.stringify(log.metadata, null, 2)
          : null;

      return (
        <BaseDialog show={props.show} config={dialogConfig.value}>
          {{
            default: () => (
              <NSpace vertical size={16}>
                <NCard title={$t('page.logManagement.basicInfo')} size="small">
                  <NSpace vertical size={12}>
                    <div>
                      <strong>{$t('page.logManagement.id')}:</strong> {log.id}
                    </div>
                    <div>
                      <strong>{$t('page.logManagement.username')}:</strong>{' '}
                      {log.username ?? (log.userId !== null ? String(log.userId) : '-')}
                    </div>
                    <div>
                      <strong>{$t('page.logManagement.ip')}:</strong> {log.ip ?? '-'}
                    </div>
                    <div>
                      <strong>{$t('page.logManagement.createdAt')}:</strong>{' '}
                      {formatApiDateTime(log.createdAt)}
                    </div>
                    <div>
                      <strong>{$t('page.logManagement.logType')}:</strong> {log.logType}
                    </div>
                  </NSpace>
                </NCard>
                <NCard title={$t('page.logManagement.requestInfo')} size="small">
                  <NSpace vertical size={12}>
                    <div>
                      <strong>{$t('page.logManagement.requestMethod')}:</strong> {log.method ?? '-'}
                    </div>
                    <div>
                      <strong>{$t('page.logManagement.requestUrl')}:</strong> {log.path ?? '-'}
                    </div>
                  </NSpace>
                </NCard>
                <NCard title={$t('page.logManagement.responseInfo')} size="small">
                  <NSpace vertical size={12}>
                    <div>
                      <strong>{$t('page.logManagement.responseStatus')}:</strong>{' '}
                      {log.statusCode !== null ? (
                        <NTag type={getLogStatusTagType(log.statusCode)} size="small">
                          {log.statusCode}
                        </NTag>
                      ) : (
                        '-'
                      )}
                    </div>
                    <div>
                      <strong>{$t('page.logManagement.duration')}:</strong>{' '}
                      {log.responseTime !== null ? `${log.responseTime}ms` : '-'}
                    </div>
                    {log.error ? (
                      <div>
                        <strong>{$t('page.logManagement.error')}:</strong>
                        <pre class="mt-8px max-h-200px overflow-auto rounded-4px bg-#fff1f0 p-8px text-#cf1322">
                          {log.error}
                        </pre>
                      </div>
                    ) : null}
                  </NSpace>
                </NCard>
                {metadataText ? (
                  <NCard title={$t('page.logManagement.metadata')} size="small">
                    <pre class="max-h-260px overflow-auto rounded-4px bg-#fafafa p-8px text-12px">
                      {metadataText}
                    </pre>
                  </NCard>
                ) : null}
              </NSpace>
            ),
            footer: () => (
              <NSpace justify="end">
                <NButton onClick={handleClose}>{$t('common.close')}</NButton>
              </NSpace>
            )
          }}
        </BaseDialog>
      );
    };
  }
});
