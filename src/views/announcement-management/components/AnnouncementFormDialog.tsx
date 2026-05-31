import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import {
  NAlert,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch
} from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import { createAnnouncementTypeOptions } from '../constants';
import type { AnnouncementFormDialogConfig } from './dialog';

export default defineComponent({
  name: 'AnnouncementFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<AnnouncementFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const expiresAtTimestamp = ref<number | null>(null);

    const formModel = useSyncedFormModel(() => props.config.formData, {
      afterSync(_, source) {
        expiresAtTimestamp.value = source.expiresAt ? new Date(source.expiresAt).getTime() : null;
      }
    });

    const formRules = {
      title: [
        {
          required: true,
          message: $t('page.announcementManagement.titleRequired'),
          trigger: 'blur'
        }
      ],
      content: [
        {
          required: true,
          message: $t('page.announcementManagement.contentRequired'),
          trigger: 'blur'
        }
      ],
      type: [
        {
          required: true,
          message: $t('page.announcementManagement.typeRequired'),
          trigger: 'change'
        }
      ]
    };

    const typeOptions = computed(() => createAnnouncementTypeOptions());

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? (props.config.isEdit ? $t('common.edit') : $t('common.add')),
      width: props.config.width ?? 800,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      const submitData = {
        ...formModel,
        expiresAt: expiresAtTimestamp.value ? new Date(expiresAtTimestamp.value).toISOString() : '',
        targetAudience: formModel.targetAudience.trim()
      };
      await props.config.onConfirm(submitData);
      handleClose();
    };

    const handleCancel = () => {
      props.config.onCancel?.();
      handleClose();
    };

    watch(
      () => props.show,
      show => {
        if (show) {
          formRef.value?.restoreValidation();
        }
      }
    );

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <>
              {!props.config.isEdit ? (
                <NAlert type="info" class="mb-16px" showIcon={false}>
                  {$t('page.announcementManagement.createDraftHint')}
                </NAlert>
              ) : null}
              <NForm
                ref={formRef}
                model={formModel}
                rules={formRules}
                labelPlacement="left"
                labelWidth="100px"
              >
                <NFormItem label={$t('page.announcementManagement.title')} path="title">
                  <NInput
                    v-model:value={formModel.title}
                    placeholder={$t('page.announcementManagement.titlePlaceholder')}
                  />
                </NFormItem>
                <NFormItem label={$t('page.announcementManagement.content')} path="content">
                  <NInput
                    v-model:value={formModel.content}
                    type="textarea"
                    placeholder={$t('page.announcementManagement.contentPlaceholder')}
                    rows={6}
                  />
                </NFormItem>
                <NFormItem label={$t('page.announcementManagement.type')} path="type">
                  <NSelect
                    v-model:value={formModel.type}
                    placeholder={$t('page.announcementManagement.typePlaceholder')}
                    options={typeOptions.value}
                  />
                </NFormItem>
                <NFormItem label={$t('page.announcementManagement.priority')} path="priority">
                  <NInputNumber
                    v-model:value={formModel.priority}
                    placeholder={$t('page.announcementManagement.priorityPlaceholder')}
                    min={0}
                    clearable
                    style={{ width: '100%' }}
                  />
                </NFormItem>
                <NFormItem label={$t('page.announcementManagement.sticky')} path="sticky">
                  <NSwitch v-model:value={formModel.sticky} />
                </NFormItem>
                <NFormItem label={$t('page.announcementManagement.expiresAt')} path="expiresAt">
                  <NDatePicker
                    v-model:value={expiresAtTimestamp.value}
                    type="datetime"
                    placeholder={$t('page.announcementManagement.expiresAtPlaceholder')}
                    clearable
                    style={{ width: '100%' }}
                  />
                </NFormItem>
                <NFormItem
                  label={$t('page.announcementManagement.targetAudience')}
                  path="targetAudience"
                >
                  <NInput
                    v-model:value={formModel.targetAudience}
                    placeholder={$t('page.announcementManagement.targetAudiencePlaceholder')}
                  />
                </NFormItem>
              </NForm>
            </>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleCancel}>{$t('common.cancel')}</NButton>
              <NButton type="primary" onClick={handleConfirm}>
                {$t('common.confirm')}
              </NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
