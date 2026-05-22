/** Markdown 编辑器页面（TypeIt 驱动左侧输入，右侧 Markdown 实时预览） */
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue';
import { NButton, NInput, NSpace, useThemeVars } from 'naive-ui';
import { useTypeIt } from '@/hooks/common/use-typeit';
import Markdown from '@/components/markdown';
import README from './README.md?raw';

const TYPEIT_CURSOR_CLASS = 'ti-cursor';

/** 读取 TypeIt 目标节点文本（排除闪烁光标节点） */
function getTypeitPlainText(el: HTMLElement) {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(`.${TYPEIT_CURSOR_CLASS}`).forEach(node => node.remove());
  return clone.textContent ?? '';
}

export default defineComponent({
  name: 'MarkdownEdit',
  setup() {
    const themeVars = useThemeVars();
    const content = ref(README);
    const typeitTargetRef = shallowRef<HTMLSpanElement | null>(null);
    /** 演示时展示 TypeIt 的 span 表面（带光标），平时用 NInput */
    const showTypeitSurface = ref(false);

    const syncPreviewFromTypeit = () => {
      if (typeitTargetRef.value) {
        content.value = getTypeitPlainText(typeitTargetRef.value);
      }
    };

    const typeit = useTypeIt(() => typeitTargetRef.value, {
      speed: 35,
      lifeLike: true,
      cursor: true,
      cursorChar: '|',
      html: false,
      afterStep: syncPreviewFromTypeit,
      afterComplete: () => {
        syncPreviewFromTypeit();
        showTypeitSurface.value = false;
      }
    });

    const loadSample = () => {
      typeit.destroy();
      showTypeitSurface.value = false;
      content.value = README;
    };

    const startTypewriter = async () => {
      if (typeit.isRunning.value) return;

      typeit.destroy();
      content.value = '';
      showTypeitSurface.value = true;

      await nextTick();

      typeit.replay({
        strings: README,
        cursor: true,
        cursorChar: '|'
      });
    };

    const stopTypewriter = () => {
      syncPreviewFromTypeit();
      typeit.destroy();
      showTypeitSurface.value = false;
    };

    onBeforeUnmount(() => {
      typeit.destroy();
    });

    const editorStyle = computed(() => ({
      backgroundColor: themeVars.value.bodyColor
    }));

    const leftStyle = computed(() => ({
      backgroundColor: themeVars.value.bodyColor,
      borderColor: themeVars.value.borderColor,
      color: themeVars.value.textColorBase
    }));

    const rightStyle = computed(() => ({
      backgroundColor: themeVars.value.bodyColor,
      color: themeVars.value.textColorBase
    }));

    const previewStyle = computed(() => ({
      backgroundColor: themeVars.value.cardColor,
      color: themeVars.value.textColorBase,
      borderColor: themeVars.value.borderColor,
      position: 'relative' as const
    }));

    const typeitSurfaceStyle = computed(() => ({
      borderColor: themeVars.value.borderColor,
      backgroundColor: themeVars.value.inputColor,
      color: themeVars.value.textColorBase
    }));

    return () => (
      <div class="h-full flex bg-gray-50" style={editorStyle.value}>
        <div class="w-1/3 overflow-y-auto border-r border-gray-200 p-4" style={leftStyle.value}>
          <div class="mb-2 text-lg font-semibold">Markdown 输入</div>
          <NSpace class="mb-3">
            <NButton type="primary" disabled={typeit.isRunning.value} onClick={startTypewriter}>
              {typeit.isRunning.value ? '打字机动画中...' : '打字机演示'}
            </NButton>
            <NButton disabled={!typeit.isRunning.value} onClick={stopTypewriter}>
              停止
            </NButton>
            <NButton onClick={loadSample}>加载示例</NButton>
          </NSpace>

          {showTypeitSurface.value ? (
            <div
              class="min-h-[480px] w-full whitespace-pre-wrap break-words border rounded p-3 text-sm leading-relaxed font-mono"
              style={typeitSurfaceStyle.value}
            >
              <span ref={typeitTargetRef} />
            </div>
          ) : (
            <NInput
              value={content.value}
              type="textarea"
              autosize={{ minRows: 20 }}
              placeholder="请输入 Markdown 内容..."
              class="w-full text-sm font-mono"
              onUpdate:value={(val: string) => {
                content.value = val;
              }}
            />
          )}
        </div>

        <div class="w-2/3 overflow-y-auto p-4" style={rightStyle.value}>
          <div class="mb-2 text-lg font-semibold">预览结果</div>
          <div class="border border-gray-200 rounded-md p-4 shadow" style={previewStyle.value}>
            <Markdown content={content.value} />
          </div>
        </div>
      </div>
    );
  }
});
