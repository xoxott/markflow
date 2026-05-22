import { type MaybeRefOrGetter, onScopeDispose, ref, toValue } from 'vue';
import TypeIt from 'typeit';
import type { ActionOpts, El, Options } from 'typeit/dist/types';

export type { ActionOpts, El, Options as TypeItOptions };

export type UseTypeItOptions = Options & {
  /** 创建实例后自动执行 `go()`，默认 false（与 SoybeanAdmin 示例一致，由页面在 onMounted 调用） */
  autoStart?: boolean;
};

/**
 * 封装 [TypeIt](https://www.typeitjs.com/)，对齐 SoybeanAdmin 插件用法，并补充 AI 流式追加。
 *
 * @see https://naive.soybeanjs.cn/plugin/typeit
 */
export function useTypeIt(
  elementRef: MaybeRefOrGetter<El | null | undefined>,
  defaultOptions: UseTypeItOptions = {}
) {
  const { autoStart = false, ...baseOptions } = defaultOptions;

  const isRunning = ref(false);
  const isComplete = ref(false);

  let instance: TypeIt | null = null;

  function getElement() {
    return toValue(elementRef) ?? null;
  }

  function wrapAfterComplete(opts: Options): Options {
    const { afterComplete } = opts;
    return {
      ...opts,
      afterComplete: () => {
        isRunning.value = false;
        isComplete.value = true;
        if (typeof afterComplete === 'function') {
          afterComplete();
        }
      }
    };
  }

  /** 创建 TypeIt 实例（会先销毁旧实例） */
  function create(override: Partial<Options> = {}) {
    destroy();

    const el = getElement();
    if (!el) return null;

    const opts = wrapAfterComplete({
      lifeLike: true,
      speed: 120,
      ...baseOptions,
      ...override
    });

    instance = new TypeIt(el, opts);

    if (autoStart) {
      go();
    }

    return instance;
  }

  /** 开始播放队列（每个实例只能 `go()` 一次） */
  function go() {
    if (!instance) {
      create();
    }
    if (!instance) return null;

    isRunning.value = true;
    isComplete.value = false;
    instance.go();
    return instance;
  }

  /** 安全销毁：光标未 attach 时 parentNode 为 null，不可走 TypeIt 默认 destroy */
  function safeDestroyInstance(inst: TypeIt | null) {
    if (!inst) return;
    try {
      inst.destroy(false);
    } catch {
      // DOM 可能已被 Vue 卸载
    }
  }

  function clearTargetElement() {
    const el = getElement();
    if (!el || typeof el !== 'object' || !('innerHTML' in el)) return;
    const node = el as HTMLElement;
    node.innerHTML = '';
    delete node.dataset.typeitId;
  }

  /** 销毁实例 */
  function destroy() {
    safeDestroyInstance(instance);
    instance = null;
    isRunning.value = false;
  }

  /** 重新创建并播放（演示重放） */
  function replay(override: Partial<Options> = {}) {
    destroy();
    create(override);
    return go();
  }

  function freeze() {
    instance?.freeze();
    isRunning.value = false;
  }

  function unfreeze() {
    instance?.unfreeze();
    isRunning.value = true;
  }

  /** 链式打字，追加到队列 */
  function type(text: string, actionOpts?: ActionOpts) {
    if (!instance) create({ strings: '' });
    instance?.type(text, actionOpts);
    return instance;
  }

  /** AI SSE：即时追加文本（不排队动画） 需在 `create()` 之后调用；首次调用会自动创建空实例。 */
  function appendStream(chunk: string): Promise<void> {
    if (!chunk) return Promise.resolve();

    if (!instance) {
      create({ strings: '' });
    }
    if (!instance) return Promise.resolve();

    isRunning.value = true;
    isComplete.value = false;

    // TypeIt.flush() 结束时必调 flushCallback，无参调用会为 null 导致报错
    return new Promise(resolve => {
      instance!.type(chunk, { instant: true }).flush(() => {
        resolve();
      });
    });
  }

  /** 清空目标元素并销毁（不调用 TypeIt.reset，避免未 go() 时光标 parentNode 为 null） */
  function reset() {
    safeDestroyInstance(instance);
    instance = null;
    clearTargetElement();
    isRunning.value = false;
    isComplete.value = false;
  }

  function getInstance() {
    return instance;
  }

  onScopeDispose(destroy);

  return {
    isRunning,
    isComplete,
    create,
    go,
    replay,
    destroy,
    reset,
    freeze,
    unfreeze,
    type,
    appendStream,
    getInstance
  };
}
