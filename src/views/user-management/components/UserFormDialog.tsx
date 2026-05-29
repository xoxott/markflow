import type { PropType } from 'vue';
import { computed, defineComponent, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, NSpace } from 'naive-ui';
import { useVerificationCode } from '@/hooks/business/verification-code';
import { useFormRules, useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { UserFormDialogConfig } from './dialog';

export default defineComponent({
  name: 'UserFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<UserFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();
    const { formRules } = useFormRules();
    const { isCounting, loading, label, sendCode, reset } = useVerificationCode({
      purpose: 'register'
    });

    const formModel = useSyncedFormModel(() => props.config.formData);

    const formRulesConfig = computed(() => ({
      username: formRules.userName,
      email: formRules.email,
      password: [
        {
          validator: (_rule: unknown, value: string) => {
            if (!props.config.isEdit && !value) {
              return new Error($t('form.pwd.required'));
            }
            if (value && (value.length < 6 || value.length > 18)) {
              return new Error($t('form.pwd.invalid'));
            }
            return true;
          },
          trigger: 'blur'
        }
      ],
      verificationCode: props.config.isEdit ? [] : formRules.code
    }));

    const handleClose = () => {
      reset();
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? (props.config.isEdit ? $t('common.edit') : $t('common.add')),
      width: props.config.width ?? 600,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;

      const succeeded = await props.config.onConfirm({ ...formModel });
      if (succeeded !== true) return;

      handleClose();
    };

    const handleCancel = () => {
      props.config.onCancel?.();
      handleClose();
    };

    const handleSendCode = () => {
      sendCode(formModel.email);
    };

    watch(
      () => props.show,
      show => {
        if (show) {
          formRef.value?.restoreValidation();
        } else {
          reset();
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
              rules={formRulesConfig.value}
              labelPlacement="left"
              labelWidth="80px"
            >
              <NFormItem label={$t('page.userManagement.username')} path="username">
                <NInput
                  v-model:value={formModel.username}
                  placeholder={$t('form.userName.required')}
                />
              </NFormItem>
              <NFormItem label={$t('page.userManagement.email')} path="email">
                <NInput v-model:value={formModel.email} placeholder={$t('form.email.required')} />
              </NFormItem>
              {!props.config.isEdit && (
                <>
                  <NFormItem
                    label={$t('page.userManagement.verificationCode')}
                    path="verificationCode"
                  >
                    <div class="w-full flex items-center gap-8px">
                      <NInput
                        v-model:value={formModel.verificationCode}
                        maxlength={6}
                        placeholder={$t('page.login.common.codePlaceholder')}
                        class="flex-1"
                      />
                      <NButton
                        secondary
                        disabled={isCounting.value}
                        loading={loading.value}
                        onClick={handleSendCode}
                      >
                        {label.value}
                      </NButton>
                    </div>
                  </NFormItem>
                  <NFormItem label={$t('page.userManagement.role')}>
                    <NSelect
                      v-model:value={formModel.roleIds}
                      multiple
                      filterable
                      clearable
                      maxTagCount="responsive"
                      placeholder={$t('page.userManagement.rolePlaceholder')}
                      options={props.config.roleOptions}
                    />
                  </NFormItem>
                </>
              )}
              <NFormItem label={$t('page.userManagement.password')} path="password">
                <NInput
                  v-model:value={formModel.password}
                  type="password"
                  placeholder={
                    props.config.isEdit
                      ? $t('page.userManagement.passwordPlaceholderEdit')
                      : $t('page.userManagement.passwordPlaceholder')
                  }
                  showPasswordOn="click"
                />
              </NFormItem>
              {props.config.isEdit && (
                <NFormItem label={$t('page.userManagement.avatar')}>
                  <NInput
                    v-model:value={formModel.avatar}
                    placeholder={$t('page.userManagement.avatarPlaceholder')}
                  />
                </NFormItem>
              )}
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
