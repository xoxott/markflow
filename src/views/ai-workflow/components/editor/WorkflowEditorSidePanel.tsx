import '../styles/workflow-editor-side-panel.scss';

import { type PropType, defineComponent } from 'vue';

export type WorkflowEditorSidePanelPlacement = 'left' | 'right';

const DEFAULT_WIDTH: Record<WorkflowEditorSidePanelPlacement, number> = {
  left: 256,
  right: 384
};

/** 编辑器内嵌侧栏：宽度动画 + 内容滑入，限制在画布区域内 */
export default defineComponent({
  name: 'WorkflowEditorSidePanel',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    placement: {
      type: String as PropType<WorkflowEditorSidePanelPlacement>,
      default: 'left'
    },
    width: {
      type: Number,
      default: undefined
    }
  },
  setup(props, { slots }) {
    return () => {
      const panelWidth = props.width ?? DEFAULT_WIDTH[props.placement];

      return (
        <aside
          class={[
            'workflow-editor-side-panel',
            `workflow-editor-side-panel--${props.placement}`,
            props.visible && 'is-visible'
          ]}
          style={{ '--workflow-side-panel-width': `${panelWidth}px` }}
          aria-hidden={props.visible ? 'false' : 'true'}
        >
          <div class="workflow-editor-side-panel__inner">{slots.default?.()}</div>
        </aside>
      );
    };
  }
});
