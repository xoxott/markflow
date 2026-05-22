/** TypeIt 打字机示例（对齐 SoybeanAdmin 插件页） */
import { defineComponent, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { NButton, NCard, NDivider, NH3, NSpace, NText } from 'naive-ui';
import { useTypeIt } from '@/hooks/common/use-typeit';

const DEMO_STRING =
  'Markdown Preview Demo 是一个基于 Vue3、Vite、TypeScript 与 Naive UI 的示例项目。';

const AI_CHUNKS = ['你好！', '我是 ', 'AI ', '助手，', '正在以 ', '流式 ', '方式回复你。'];

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

export default defineComponent({
  name: 'TypeItExample',
  setup() {
    const basicRef = shallowRef<HTMLElement | null>(null);
    const streamRef = shallowRef<HTMLElement | null>(null);

    const basic = useTypeIt(basicRef, {
      strings: DEMO_STRING,
      lifeLike: true,
      speed: 80,
      loop: true,
      loopDelay: 1200
    });

    const stream = useTypeIt(streamRef, {
      strings: '',
      speed: 40,
      cursor: true,
      lifeLike: true
    });

    let streamAborted = false;

    onMounted(() => {
      basic.create();
      basic.go();
      stream.create();
    });

    onBeforeUnmount(() => {
      streamAborted = true;
      basic.destroy();
      stream.destroy();
    });

    const replayBasic = () => {
      basic.replay();
    };

    const simulateAiStream = async () => {
      streamAborted = false;
      stream.reset();
      stream.create({ strings: '' });

      for (const chunk of AI_CHUNKS) {
        if (streamAborted) break;
        stream.appendStream(chunk);
        await delay(280);
      }
    };

    return () => (
      <NCard bordered class="shadow-sm">
        <NH3 class="mb-4 border-b pb-2 text-lg font-semibold">打字机 TypeIt</NH3>

        <NText class="mb-4 block text-gray-500">
          与{' '}
          <a
            href="https://naive.soybeanjs.cn/plugin/typeit"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary"
          >
            SoybeanAdmin TypeIt 插件
          </a>{' '}
          相同，基于{' '}
          <a
            href="https://www.typeitjs.com/docs/vanilla/usage/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary"
          >
            typeit
          </a>
          。封装为 <code class="rounded bg-gray-100 px-1">useTypeIt</code>，支持循环演示与 AI
          流式即时追加。
        </NText>

        <NDivider title-placement="left">基本示例（循环）</NDivider>
        <span ref={basicRef} class="text-18px text-gray-800 leading-relaxed" />
        <NSpace class="mt-4">
          <NButton type="primary" onClick={replayBasic}>
            重新播放
          </NButton>
          <NButton onClick={() => basic.freeze()}>暂停</NButton>
          <NButton onClick={() => basic.unfreeze()}>继续</NButton>
        </NSpace>

        <NDivider title-placement="left">AI 流式模拟（instant append）</NDivider>
        <span ref={streamRef} class="min-h-12 text-18px text-gray-800 leading-relaxed" />
        <NSpace class="mt-4">
          <NButton type="primary" onClick={simulateAiStream}>
            模拟 SSE 流式回复
          </NButton>
          <NButton
            onClick={() => {
              streamAborted = true;
              stream.reset();
              stream.create({ strings: '' });
            }}
          >
            清空
          </NButton>
        </NSpace>

        <div class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p class="mb-2 font-semibold">页面接入示例：</p>
          <pre class="overflow-x-auto whitespace-pre-wrap">{`const elRef = shallowRef<HTMLElement | null>(null);
const { create, go, appendStream, replay } = useTypeIt(elRef, {
  strings: '欢迎语…',
  lifeLike: true,
  speed: 120
});

onMounted(() => { create(); go(); });

// SSE onmessage:
appendStream(event.data);`}</pre>
        </div>
      </NCard>
    );
  }
});
