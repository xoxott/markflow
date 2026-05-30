import { PrepareContextStep, type RequestStep } from '@suga/request-core';
import { CacheReadStep, CacheWriteStep, RequestCacheManager } from '@suga/request-cache';
import { RetryStep } from '@suga/request-retry';
import { CircuitBreakerStep } from '@suga/request-circuit-breaker';
import { DedupeManager, DedupeStep } from '@suga/request-dedupe';
import { QueueStep } from '@suga/request-queue';
import { AbortStep } from '@suga/request-abort';
import { EventStep, eventManager } from '@suga/request-events';
import type { AxiosTransport } from './AxiosTransport';
import { MutationCacheInvalidateStep } from './MutationCacheInvalidateStep';
import { PipelineTransportStep } from './PipelineTransportStep';
import type { PipelineProfile } from './pipelineProfile';
import { DEFAULT_PIPELINE_CACHE_EXPIRE_MS, resolvePipelineProfile } from './pipelineProfile';

export interface PipelineResources {
  steps: RequestStep[];
  cacheManager?: RequestCacheManager;
  dedupeManager?: DedupeManager;
}

/** 按 profile 创建步骤链及共享的缓存/去重管理器 */
export function createPipelineResources(
  transport: AxiosTransport,
  profile: PipelineProfile = 'standard'
): PipelineResources {
  const f = resolvePipelineProfile(profile);
  const steps: RequestStep[] = [new PrepareContextStep()];
  const cacheManager = f.useCache
    ? new RequestCacheManager({ defaultExpireTime: DEFAULT_PIPELINE_CACHE_EXPIRE_MS })
    : undefined;
  const dedupeManager = f.useDedupe
    ? new DedupeManager({ dedupeWindow: f.dedupeWindow })
    : undefined;

  if (f.useCache && cacheManager) {
    steps.push(
      new CacheReadStep({
        requestCacheManager: cacheManager,
        enabledByDefault: true
      })
    );
  }
  if (f.useDedupe && dedupeManager) {
    steps.push(
      new DedupeStep({
        dedupeManager,
        defaultOptions: { dedupeWindow: f.dedupeWindow, strategy: 'exact' },
        enabledByDefault: true
      })
    );
  }
  if (f.useAbort) {
    steps.push(
      new AbortStep({
        defaultOptions: { enabled: true, autoAbortPrevious: true }
      })
    );
  }
  if (f.useQueue) {
    steps.push(
      new QueueStep({
        defaultConfig: {
          maxConcurrent: f.queueMaxConcurrent,
          queueStrategy: 'fifo'
        },
        enabledByDefault: true
      })
    );
  }
  if (f.useEvents) {
    steps.push(new EventStep({ eventManager }));
  }
  if (f.useRetry) {
    steps.push(new RetryStep({ defaultStrategy: f.retryStrategy, enabledByDefault: true }));
  }
  if (f.useCircuitBreaker) {
    steps.push(
      new CircuitBreakerStep({ managerOptions: f.circuitBreaker, enabledByDefault: true })
    );
  }

  if (f.useCache && cacheManager) {
    steps.push(
      new CacheWriteStep({
        requestCacheManager: cacheManager,
        enabledByDefault: true
      })
    );
  }

  if (cacheManager || dedupeManager) {
    steps.push(
      new MutationCacheInvalidateStep({
        cacheManager,
        dedupeManager
      })
    );
  }

  steps.push(new PipelineTransportStep(transport));

  return { steps, cacheManager, dedupeManager };
}

/** 按 profile 装配步骤链；默认 `standard` 与历史 `buildDefaultPipelineSteps` 行为一致。 */
export function buildPipelineSteps(
  transport: AxiosTransport,
  profile: PipelineProfile = 'standard'
): RequestStep[] {
  return createPipelineResources(transport, profile).steps;
}

/** @deprecated 使用 {@link buildPipelineSteps}(transport, 'standard') */
export function buildDefaultPipelineSteps(transport: AxiosTransport): RequestStep[] {
  return buildPipelineSteps(transport, 'standard');
}
