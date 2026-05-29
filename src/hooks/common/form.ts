import {
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  reactive,
  ref,
  toValue,
  watch
} from 'vue';
import type { FormInst } from 'naive-ui';
import { REG_CODE_SIX, REG_EMAIL, REG_PHONE, REG_PWD, REG_USER_NAME } from '@/constants/reg';
import { $t } from '@/locales';

export function useFormRules() {
  const patternRules = {
    userName: {
      pattern: REG_USER_NAME,
      message: $t('form.userName.invalid'),
      trigger: 'change'
    },
    phone: {
      pattern: REG_PHONE,
      message: $t('form.phone.invalid'),
      trigger: 'change'
    },
    pwd: {
      pattern: REG_PWD,
      message: $t('form.pwd.invalid'),
      trigger: 'change'
    },
    code: {
      pattern: REG_CODE_SIX,
      message: $t('form.code.invalid'),
      trigger: 'change'
    },
    email: {
      pattern: REG_EMAIL,
      message: $t('form.email.invalid'),
      trigger: 'change'
    }
  } satisfies Record<string, App.Global.FormRule>;

  const formRules = {
    userName: [createRequiredRule($t('form.userName.required')), patternRules.userName],
    phone: [createRequiredRule($t('form.phone.required')), patternRules.phone],
    pwd: [createRequiredRule($t('form.pwd.required')), patternRules.pwd],
    code: [createRequiredRule($t('form.code.required')), patternRules.code],
    email: [createRequiredRule($t('form.email.required')), patternRules.email]
  } satisfies Record<string, App.Global.FormRule[]>;

  /** the default required rule */
  const defaultRequiredRule = createRequiredRule($t('form.required'));

  function createRequiredRule(message: string): App.Global.FormRule {
    return {
      required: true,
      message
    };
  }

  /** create a rule for confirming the password */
  function createConfirmPwdRule(pwd: string | Ref<string> | ComputedRef<string>) {
    const confirmPwdRule: App.Global.FormRule[] = [
      { required: true, message: $t('form.confirmPwd.required') },
      {
        asyncValidator: (rule, value) => {
          if (value.trim() !== '' && value !== toValue(pwd)) {
            return Promise.reject(rule.message);
          }
          return Promise.resolve();
        },
        message: $t('form.confirmPwd.invalid'),
        trigger: 'input'
      }
    ];
    return confirmPwdRule;
  }

  return {
    patternRules,
    formRules,
    defaultRequiredRule,
    createRequiredRule,
    createConfirmPwdRule
  };
}

export function useNaiveForm() {
  const formRef = ref<FormInst | null>(null);

  /**
   * 运行表单校验
   *
   * - 返回 true 表示全部通过
   * - 返回 false 表示校验未通过（不抛异常，方便调用方使用状态判断）
   */
  async function validate() {
    try {
      await formRef.value?.validate();
      return true;
    } catch {
      return false;
    }
  }

  async function restoreValidation() {
    formRef.value?.restoreValidation();
  }

  /**
   * 重置表单字段
   *
   * @param fields 要重置的字段，不传则重置所有字段
   */
  function resetFields(fields?: string[]) {
    (formRef.value as any)?.resetFields?.(fields);
  }

  return {
    formRef,
    validate,
    restoreValidation,
    resetFields
  };
}

export interface UseSyncedFormModelOptions<T extends object> {
  /** 自定义字段同步；默认使用 Object.assign */
  sync?: (model: T, source: T) => void;
  /** sync 完成后调用，用于同步派生状态（如日期时间戳 ref） */
  afterSync?: (model: T, source: T) => void;
}

/**
 * 将外部表单数据源同步到可写的 reactive model。
 *
 * 适用于弹窗表单：`config.formData` 变化时自动合并到本地 `formModel`。
 */
export function useSyncedFormModel<T extends object>(
  source: MaybeRefOrGetter<T>,
  options?: UseSyncedFormModelOptions<T>
) {
  const formModel = reactive({ ...toValue(source) }) as T;

  watch(
    () => toValue(source),
    newData => {
      if (options?.sync) {
        options.sync(formModel, newData);
      } else {
        Object.assign(formModel, newData);
      }
      options?.afterSync?.(formModel, newData);
    },
    { deep: true, immediate: true }
  );

  return formModel;
}
