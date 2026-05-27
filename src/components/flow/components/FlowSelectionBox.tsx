/**
 * Flow 框选矩形（Phase 5.1）
 *
 * 显示当前框选范围的半透明 overlay；坐标由父级传入屏幕像素。
 */

import { computed, defineComponent } from 'vue';

export interface FlowSelectionBoxProps {
  visible: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default defineComponent({
  name: 'FlowSelectionBox',
  props: {
    visible: { type: Boolean, default: false },
    startX: { type: Number, required: true },
    startY: { type: Number, required: true },
    currentX: { type: Number, required: true },
    currentY: { type: Number, required: true }
  },
  setup(props: FlowSelectionBoxProps) {
    const boxStyle = computed(() => {
      const minX = Math.min(props.startX, props.currentX);
      const maxX = Math.max(props.startX, props.currentX);
      const minY = Math.min(props.startY, props.currentY);
      const maxY = Math.max(props.startY, props.currentY);
      return {
        position: 'absolute' as const,
        left: `${Math.round(minX)}px`,
        top: `${Math.round(minY)}px`,
        width: `${Math.round(maxX - minX)}px`,
        height: `${Math.round(maxY - minY)}px`,
        background: 'var(--flow-box-selection-bg, rgba(59, 130, 246, 0.10))',
        border: '1px solid var(--flow-box-selection-border, #3b82f6)',
        pointerEvents: 'none' as const,
        zIndex: 9999
      };
    });

    return () => (props.visible ? <div class="flow-selection-box" style={boxStyle.value} /> : null);
  }
});
