import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NButton, NDatePicker, NForm, NFormItem, NInput, NSpace, NSwitch } from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { VersionLogFormDialogConfig } from './dialog';

export default defineComponent({
  name: 'VersionLogFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<VersionLogFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();

    const releaseDateTimestamp = ref<number | null>(null);

    const formModel = useSyncedFormModel(() => props.config.formData, {
      afterSync(_, source) {
        releaseDateTimestamp.value = source.releaseDate
          ? new Date(source.releaseDate).getTime()
          : null;
      }
    });

    const formRules = {
      version: [
        {
          required: true,
          message: $t('page.versionLogManagement.versionRequired'),
          trigger: 'blur'
        },
        {
          pattern: /^\d+\.\d+\.\d+$/,
          message: $t('page.versionLogManagement.versionInvalid'),
          trigger: 'blur'
        }
      ],
      title: [
        {
          required: true,
          message: $t('page.versionLogManagement.titleRequired'),
          trigger: 'blur'
        }
      ],
      releaseDate: [
        {
          required: true,
          message: $t('page.versionLogManagement.releaseDateRequired'),
          trigger: 'change'
        }
      ]
    };

    const updateReleaseDate = (value: number | null) => {
      releaseDateTimestamp.value = value;
      formModel.releaseDate = value ? new Date(value).toISOString() : '';
    };

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? (props.config.isEdit ? $t('common.edit') : $t('common.add')),
      width: props.config.width ?? 800,
      height: props.config.height ?? 'calc(100vh - 80px)',
      maxHeight: props.config.maxHeight ?? 'calc(100vh - 80px)',
      minHeight: props.config.minHeight ?? 520,
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      await props.config.onConfirm({ ...formModel });
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
            <NForm
              ref={formRef}
              model={formModel}
              rules={formRules}
              labelPlacement="left"
              labelWidth="100px"
            >
              <NFormItem label={$t('page.versionLogManagement.version')} path="version">
                <NInput
                  v-model:value={formModel.version}
                  placeholder={$t('page.versionLogManagement.versionPlaceholder')}
                  disabled={props.config.isEdit}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.releaseTitle')} path="title">
                <NInput
                  v-model:value={formModel.title}
                  placeholder={$t('page.versionLogManagement.titlePlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.releaseDate')} path="releaseDate">
                <NDatePicker
                  value={releaseDateTimestamp.value}
                  type="date"
                  placeholder={$t('page.versionLogManagement.releaseDatePlaceholder')}
                  style={{ width: '100%' }}
                  onUpdateValue={updateReleaseDate}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.description')} path="description">
                <NInput
                  v-model:value={formModel.description}
                  type="textarea"
                  placeholder={$t('page.versionLogManagement.descriptionPlaceholder')}
                  rows={4}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.features')} path="features">
                <NInput
                  v-model:value={formModel.features}
                  type="textarea"
                  placeholder={$t('page.versionLogManagement.featuresPlaceholder')}
                  rows={3}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.fixes')} path="fixes">
                <NInput
                  v-model:value={formModel.fixes}
                  type="textarea"
                  placeholder={$t('page.versionLogManagement.fixesPlaceholder')}
                  rows={3}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.improvements')} path="improvements">
                <NInput
                  v-model:value={formModel.improvements}
                  type="textarea"
                  placeholder={$t('page.versionLogManagement.improvementsPlaceholder')}
                  rows={3}
                />
              </NFormItem>
              <NFormItem label={$t('page.versionLogManagement.isPrerelease')} path="isPrerelease">
                <NSwitch v-model:value={formModel.isPrerelease} />
                <span style={{ marginLeft: '8px' }}>
                  {formModel.isPrerelease
                    ? $t('page.versionLogManagement.prerelease')
                    : $t('page.versionLogManagement.stableRelease')}
                </span>
              </NFormItem>
            </NForm>
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
