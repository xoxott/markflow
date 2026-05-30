/** 写操作成功后自动失效相关 GET 缓存与去重条目 */

import type { RequestContext, RequestStep } from '@suga/request-core';
import type { RequestCacheManager } from '@suga/request-cache';
import type { DedupeManager } from '@suga/request-dedupe';
import {
  getGetRequestKeyPrefix,
  isMutationMethod,
  mergeInvalidationUrlPaths
} from './invalidateCacheOnMutation';

export interface MutationCacheInvalidateStepOptions {
  cacheManager?: RequestCacheManager;
  dedupeManager?: DedupeManager;
}

export class MutationCacheInvalidateStep implements RequestStep {
  private readonly cacheManager?: RequestCacheManager;

  private readonly dedupeManager?: DedupeManager;

  constructor(options: MutationCacheInvalidateStepOptions = {}) {
    this.cacheManager = options.cacheManager;
    this.dedupeManager = options.dedupeManager;
  }

  execute<T>(ctx: RequestContext<T>, next: () => Promise<void>): Promise<void> {
    return next().then(() => {
      if (ctx.error) {
        return;
      }

      if (!isMutationMethod(ctx.config.method)) {
        return;
      }

      const url = String(ctx.config.url || '');
      const explicitPaths = ctx.meta.invalidatePaths as string[] | undefined;
      const paths = mergeInvalidationUrlPaths(url, explicitPaths);

      for (const urlPath of paths) {
        this.cacheManager?.deleteGetKeysByUrlPrefix(urlPath);
        this.dedupeManager?.clearKeysByPrefix(getGetRequestKeyPrefix(urlPath));
      }
    });
  }
}
