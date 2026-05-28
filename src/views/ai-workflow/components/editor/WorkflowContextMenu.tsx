/** 工作流画布右键菜单：仅删除，不含复制 / 剪切 / 粘贴 */

import { type PropType, defineComponent } from 'vue';
import { FlowContextMenu, useFlowCanvasContext } from '@/components/flow';
import type { UseWorkflowEditorReturn } from '../hooks/useWorkflowEditor';

export default defineComponent({
  name: 'WorkflowContextMenu',
  props: {
    editor: {
      type: Object as PropType<UseWorkflowEditorReturn>,
      required: true
    }
  },
  setup(props) {
    const ctx = useFlowCanvasContext();

    return () => {
      const api = props.editor.canvasRef.value;
      if (!api) return null;

      return (
        <FlowContextMenu
          enabled
          canvasRef={ctx.canvasRef}
          config={ctx.config}
          nodes={ctx.nodes}
          edges={ctx.edges}
          selectedNodeIds={ctx.selection.selectedNodeIds}
          selectedEdgeIds={ctx.selection.selectedEdgeIds}
          getNodeById={ctx.getNodeById}
          selectNode={ctx.selection.selectNode}
          selectEdge={ctx.selection.selectEdge}
          deselectAll={ctx.selection.deselectAll}
          removeNode={nodeId => {
            api.removeNode(nodeId);
            props.editor.markDirty();
          }}
          removeEdge={edgeId => {
            api.removeEdge(edgeId);
            props.editor.markDirty();
          }}
        />
      );
    };
  }
});
