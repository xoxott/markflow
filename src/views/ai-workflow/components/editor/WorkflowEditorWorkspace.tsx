import { defineComponent } from 'vue';
import WorkflowEditorSidePanel from './WorkflowEditorSidePanel';

/** 编辑器三栏工作区：左/右内嵌侧栏 + 中间画布 */
export default defineComponent({
  name: 'WorkflowEditorWorkspace',
  props: {
    showLeftPanel: {
      type: Boolean,
      default: true
    },
    showRightPanel: {
      type: Boolean,
      default: false
    },
    leftWidth: {
      type: Number,
      default: 256
    },
    rightWidth: {
      type: Number,
      default: 384
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingText: {
      type: String,
      default: '加载中…'
    }
  },
  setup(props, { slots }) {
    return () => {
      if (props.loading) {
        return (
          <div class="flex flex-1 items-center justify-center text-gray-500">
            {props.loadingText}
          </div>
        );
      }

      return (
        <div class="workflow-editor-workspace">
          <WorkflowEditorSidePanel
            visible={props.showLeftPanel}
            placement="left"
            width={props.leftWidth}
          >
            {slots.left?.()}
          </WorkflowEditorSidePanel>

          <div class="workflow-editor-workspace__canvas">{slots.default?.()}</div>

          <WorkflowEditorSidePanel
            visible={props.showRightPanel}
            placement="right"
            width={props.rightWidth}
          >
            {slots.right?.()}
          </WorkflowEditorSidePanel>
        </div>
      );
    };
  }
});
