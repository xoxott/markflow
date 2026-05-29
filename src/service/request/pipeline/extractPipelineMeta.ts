import type { CustomAxiosRequestConfig } from '@suga/axios';

/** 从 Axios config 提取步骤链 meta，不传给底层 HTTP */
export function extractPipelineMetaFromAxiosConfig(
  config: CustomAxiosRequestConfig
): Record<string, unknown> {
  const meta: Record<string, unknown> = {};

  if (config.signal !== undefined) {
    meta.signal = config.signal;
  }
  if (config.cache !== undefined) {
    meta.cache = config.cache;
  }
  if (config.dedupe !== undefined) {
    meta.dedupe = config.dedupe;
  }
  if (config.cacheExpireTime !== undefined) {
    meta.cacheExpireTime = config.cacheExpireTime;
  }

  return meta;
}
