/**
 * Flow 空状态组件
 *
 * 当画布为空时显示的空状态提示
 */

import { type PropType, computed, defineComponent } from 'vue';
import { useFlowI18n } from '../hooks/useFlowI18n';
import type { FlowLocale } from '../types';

/** FlowEmptyState 组件属性 */
export interface FlowEmptyStateProps {
  /** 标题（未传则使用 i18n） */
  title?: string;
  /** 描述（未传则使用 i18n） */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 是否显示 */
  visible?: boolean;
  /** 自定义样式 */
  style?: Record<string, any>;
  /** CSS 类名 */
  class?: string;
  /** 覆盖 config 中的 locale */
  locale?: FlowLocale;
  /** 自定义内容插槽 */
}

/** Flow 空状态组件 */
export default defineComponent({
  name: 'FlowEmptyState',
  props: {
    title: {
      type: String,
      default: undefined
    },
    description: {
      type: String,
      default: undefined
    },
    icon: {
      type: String,
      default: undefined
    },
    visible: {
      type: Boolean,
      default: true
    },
    style: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    class: {
      type: String,
      default: ''
    },
    locale: {
      type: String as PropType<FlowLocale>,
      default: undefined
    }
  },
  setup(props, { slots }) {
    const { t } = useFlowI18n({ locale: props.locale });

    const displayTitle = computed(() => props.title ?? t('emptyState.title'));
    const displayDescription = computed(() => props.description ?? t('emptyState.description'));

    return () => {
      if (!props.visible) {
        return null;
      }

      return (
        <div
          class={`flow-empty-state ${props.class}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#94a3b8',
            pointerEvents: 'none',
            ...props.style
          }}
        >
          {slots.default ? (
            slots.default()
          ) : (
            <>
              {props.icon && (
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.5
                  }}
                >
                  {props.icon}
                </div>
              )}
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#64748b'
                }}
              >
                {displayTitle.value}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#94a3b8'
                }}
              >
                {displayDescription.value}
              </div>
            </>
          )}
        </div>
      );
    };
  }
});
