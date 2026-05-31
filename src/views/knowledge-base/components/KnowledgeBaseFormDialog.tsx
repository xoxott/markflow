import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { NButton, NDynamicTags, NForm, NFormItem, NInput, NSpace } from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { KnowledgeBaseDialogOptions } from './dialog';

export default defineComponent({
  name: 'KnowledgeBaseFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<KnowledgeBaseDialogOptions>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();
    const formModel = useSyncedFormModel(() => props.config.formData, {
      sync(model, data) {
        model.name = data.name ?? '';
        model.description = data.description ?? '';
        model.tags = [...(data.tags ?? [])];
        model.embeddingModel = data.embeddingModel ?? 'text-embedding-3-small';
      }
    });

    const handleClose = () => {
      props.config.onCancel?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title:
        props.config.title ??
        (props.config.isEdit
          ? $t('page.knowledgeBase.editTitle')
          : $t('page.knowledgeBase.createTitle')),
      width: props.config.width ?? 520,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      await props.config.onConfirm({ ...formModel, tags: [...formModel.tags] });
      handleClose();
    };

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NForm ref={formRef} model={formModel} labelPlacement="top">
              <NFormItem
                label={$t('page.knowledgeBase.name')}
                path="name"
                rule={{
                  required: true,
                  message: $t('page.knowledgeBase.nameRequired'),
                  trigger: 'blur'
                }}
              >
                <NInput
                  v-model:value={formModel.name}
                  placeholder={$t('page.knowledgeBase.namePlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.knowledgeBase.description')} path="description">
                <NInput
                  v-model:value={formModel.description}
                  type="textarea"
                  rows={3}
                  placeholder={$t('page.knowledgeBase.descriptionPlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.knowledgeBase.embeddingModel')} path="embeddingModel">
                <NInput
                  v-model:value={formModel.embeddingModel}
                  placeholder={$t('page.knowledgeBase.embeddingModelPlaceholder')}
                />
              </NFormItem>
              <NFormItem label={$t('page.knowledgeBase.tags')} path="tags">
                <NDynamicTags v-model:value={formModel.tags} />
              </NFormItem>
            </NForm>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleClose}>{$t('common.cancel')}</NButton>
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
