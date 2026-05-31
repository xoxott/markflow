import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { NDescriptions, NDescriptionsItem, NDivider, NSpace, NTag } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { $t } from '@/locales';
import { getLogStatusTagType } from '../listUiConfig';
import { formatMetadataValue, getLogTypeLabel, parseLogMetadata } from '../utils/log-detail';

type Log = Api.LogManagement.Log;

const MetadataBlock = defineComponent({
  name: 'LogMetadataBlock',
  props: {
    title: { type: String, required: true },
    value: { type: null as unknown as PropType<unknown>, required: true }
  },
  setup(props) {
    return () => {
      const text = formatMetadataValue(props.value);
      if (!text) {
        return null;
      }

      return (
        <div class="mt-12px">
          <div class="mb-8px text-13px font-500">{props.title}</div>
          <pre class="whitespace-pre-wrap break-all rounded-4px bg-#fafafa p-12px text-12px leading-relaxed">
            {text}
          </pre>
        </div>
      );
    };
  }
});

export default defineComponent({
  name: 'LogDetailDrawer',
  props: {
    log: {
      type: Object as PropType<Log>,
      required: true
    }
  },
  setup(props) {
    const parsedMetadata = computed(() => parseLogMetadata(props.log.metadata));

    return () => {
      const log = props.log;
      const metadata = parsedMetadata.value;

      return (
        <>
          <NDescriptions bordered column={1} labelPlacement="left" size="small">
            <NDescriptionsItem label={$t('page.logManagement.id')}>{log.id}</NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.logType')}>
              {$t(getLogTypeLabel(log.logType))}
            </NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.username')}>
              {log.username ?? (log.userId !== null ? String(log.userId) : '-')}
            </NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.ip')}>
              {log.ip ?? '-'}
            </NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.createdAt')}>
              {formatApiDateTime(log.createdAt)}
            </NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.resultStatus')}>
              <NSpace size="small">
                <NTag type={log.isSuccessful ? 'success' : 'error'} size="small">
                  {log.isSuccessful
                    ? $t('page.logManagement.resultSuccess')
                    : $t('page.logManagement.resultFailed')}
                </NTag>
                {log.hasError ? (
                  <NTag type="warning" size="small">
                    {$t('page.logManagement.hasError')}
                  </NTag>
                ) : null}
              </NSpace>
            </NDescriptionsItem>
          </NDescriptions>

          {metadata.action ? (
            <>
              <NDivider class="!my-16px" />
              <NDescriptions bordered column={1} labelPlacement="left" size="small">
                <NDescriptionsItem label={$t('page.logManagement.action')}>
                  <NTag type="info" size="small">
                    {metadata.action}
                  </NTag>
                </NDescriptionsItem>
              </NDescriptions>
            </>
          ) : null}

          <NDivider class="!my-16px" />
          <div class="mb-8px text-14px font-500">{$t('page.logManagement.requestInfo')}</div>
          <NDescriptions bordered column={1} labelPlacement="left" size="small">
            <NDescriptionsItem label={$t('page.logManagement.requestMethod')}>
              {log.method ?? '-'}
            </NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.requestUrl')}>
              <span class="break-all">{log.path ?? '-'}</span>
            </NDescriptionsItem>
            {metadata.userAgent ? (
              <NDescriptionsItem label={$t('page.logManagement.userAgent')}>
                <span class="break-all">{metadata.userAgent}</span>
              </NDescriptionsItem>
            ) : null}
          </NDescriptions>

          {metadata.query || metadata.body ? (
            <div class="mt-4px">
              <MetadataBlock title={$t('page.logManagement.requestQuery')} value={metadata.query} />
              <MetadataBlock title={$t('page.logManagement.requestBody')} value={metadata.body} />
            </div>
          ) : null}

          <NDivider class="!my-16px" />
          <div class="mb-8px text-14px font-500">{$t('page.logManagement.responseInfo')}</div>
          <NDescriptions bordered column={1} labelPlacement="left" size="small">
            <NDescriptionsItem label={$t('page.logManagement.responseStatus')}>
              <NTag type={getLogStatusTagType(log.statusCode)} size="small">
                {log.statusCode}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label={$t('page.logManagement.duration')}>
              {`${log.responseTime}ms`}
            </NDescriptionsItem>
          </NDescriptions>

          {log.error ? (
            <div class="mt-12px">
              <div class="mb-8px text-13px font-500">{$t('page.logManagement.error')}</div>
              <pre class="whitespace-pre-wrap break-all rounded-4px bg-#fff1f0 p-12px text-12px text-#cf1322 leading-relaxed">
                {log.error}
              </pre>
            </div>
          ) : null}

          {metadata.extra ? (
            <div class="mt-12px">
              <div class="mb-8px text-13px font-500">{$t('page.logManagement.metadata')}</div>
              <pre class="whitespace-pre-wrap break-all rounded-4px bg-#fafafa p-12px text-12px leading-relaxed">
                {formatMetadataValue(metadata.extra)}
              </pre>
            </div>
          ) : null}
        </>
      );
    };
  }
});
