import type { AxiosError, AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE } from '@suga/axios';
import type { RequestInstanceState } from '../type';
import { showErrorMsg } from '../shared';
import {
  SESSION_AUTH_ERROR_CODES,
  extractErrorCode,
  getExpiredTokenCodes,
  getLogoutCodes,
  getModalLogoutCodes,
  isSessionCredentialError
} from './errorCodes';

const sessionAuthErrorCodeSet = new Set<string>(SESSION_AUTH_ERROR_CODES);

/** 从响应或 Axios 错误中解析 ai-server 标准错误体 */
export function parseApiErrorPayload(
  source: AxiosResponse | AxiosError | undefined
): Api.ErrorResponse | null {
  if (!source) return null;

  const data =
    'response' in source && source.response
      ? source.response.data
      : 'data' in source
        ? source.data
        : undefined;

  if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
    return data as Api.ErrorResponse;
  }

  return null;
}

/** 是否已由认证链路处理 UX，无需再弹全局 message （刷新中、登出、模态框登出） */
export function shouldSuppressGlobalErrorMessage(
  errorCode: string | null,
  hasSession: boolean
): boolean {
  if (!errorCode) return false;

  const expiredTokenCodes = getExpiredTokenCodes();
  const modalLogoutCodes = getModalLogoutCodes();

  if (!hasSession) {
    return false;
  }

  return (
    expiredTokenCodes.includes(errorCode) ||
    isSessionCredentialError(errorCode) ||
    sessionAuthErrorCodeSet.has(errorCode) ||
    modalLogoutCodes.includes(errorCode) ||
    getLogoutCodes().includes(errorCode)
  );
}

/** 全局请求层统一错误提示（业务失败 + 网络/HTTP 失败） */
export function showGlobalRequestError(
  state: RequestInstanceState,
  error: AxiosError,
  hasSession: boolean
): void {
  const payload = parseApiErrorPayload(error);
  const errorCode = payload ? extractErrorCode(payload) : null;

  if (shouldSuppressGlobalErrorMessage(errorCode, hasSession)) {
    return;
  }

  const message = payload?.message || error.message;
  if (message) {
    showErrorMsg(state, message);
  }
}

/** 业务失败（HTTP 可达但 code 非成功）是否走 onError 统一提示 */
export function isBusinessBackendError(error: AxiosError): boolean {
  return error.code === BACKEND_ERROR_CODE && Boolean(parseApiErrorPayload(error));
}
