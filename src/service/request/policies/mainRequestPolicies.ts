/* eslint-disable no-console */
import type { AxiosError, AxiosResponse } from 'axios';
import type { FlatRequestInstance, RequestOption } from '@suga/axios';
import { useAuthStore } from '@/store/modules/auth';
import { isStaticDemo } from '@/utils/env/static-demo';
import { $t } from '@/locales';
import { getAuthorization } from '../auth';
import { handleExpiredRequest } from '../shared';
import type { RequestInstanceState } from '../type';
import {
  SESSION_AUTH_ERROR_CODES,
  extractErrorCode,
  getExpiredTokenCodes,
  getLogoutCodes,
  getModalLogoutCodes,
  isBackendSuccessCode
} from './errorCodes';
import { parseApiErrorPayload, showGlobalRequestError } from './errorHandler';
import { createRetryConfig } from './retry';

type MainFlatRequest = FlatRequestInstance<RequestInstanceState, App.Service.Response>;

const sessionAuthErrorCodeSet = new Set<string>(SESSION_AUTH_ERROR_CODES);

/**
 * 主业务 Axios 策略（全局请求封装）
 *
 * - isBackendSuccess：业务 code 判断
 * - onBackendFail：仅处理认证副作用（刷新 / 登出 / 模态框），不弹 toast
 * - onError：统一全局错误提示（含业务失败 BACKEND_ERROR 与网络错误）
 * - transformBackendResponse：解包 data 字段
 */
export function createMainRequestPolicies(
  getRequest: () => MainFlatRequest
): Partial<RequestOption<App.Service.Response>> {
  return {
    async onRequest(config) {
      const Authorization = getAuthorization();
      Object.assign(config.headers, { Authorization });
      return config;
    },
    isBackendSuccess(response) {
      const code = response.data.code;
      const isSuccess = isBackendSuccessCode(code);
      console.log('[Request] isBackendSuccess check:', {
        code,
        isSuccess,
        url: response.config.url,
        status: response.status
      });
      return isSuccess;
    },
    async onBackendFail(response, instance) {
      const request = getRequest();
      const authStore = useAuthStore();
      const errorData = parseApiErrorPayload(response) ?? (response.data as Api.ErrorResponse);
      const errorCode = extractErrorCode(errorData);
      const expiredTokenCodes = getExpiredTokenCodes();
      const logoutCodes = getLogoutCodes();
      const modalLogoutCodes = getModalLogoutCodes();
      const hasSession = Boolean(getAuthorization());

      console.log('[Request] onBackendFail (auth only):', {
        errorCode,
        url: response.config.url,
        status: response.status,
        message: errorData.message
      });

      const handleLogout = () => authStore.resetStore();
      const logoutAndCleanup = () => {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);
        request.state.errMsgStack = request.state.errMsgStack.filter(
          msg => msg !== errorData.message
        );
      };

      if (expiredTokenCodes.includes(errorCode)) {
        console.log('[Token Refresh] 检测到 token 过期，开始刷新 token，errorCode:', errorCode);
        const success = await handleExpiredRequest(request.state);
        if (success) {
          console.log('[Token Refresh] Token 刷新成功，重新发送请求');
          const newToken = getAuthorization();
          return instance.request(createRetryConfig(response, newToken!)) as Promise<AxiosResponse>;
        }
        console.warn('[Token Refresh] Token 刷新失败，将执行登出逻辑');
      }

      const shouldLogout =
        hasSession &&
        !isStaticDemo() &&
        !expiredTokenCodes.includes(errorCode) &&
        (sessionAuthErrorCodeSet.has(errorCode) || logoutCodes.includes(errorCode));

      if (shouldLogout) {
        handleLogout();
        return null;
      }

      if (
        hasSession &&
        modalLogoutCodes.includes(errorCode) &&
        !request.state.errMsgStack?.includes(errorData.message)
      ) {
        request.state.errMsgStack = [...(request.state.errMsgStack || []), errorData.message];
        window.addEventListener('beforeunload', handleLogout);

        window.$dialog?.error({
          title: $t('common.error'),
          content: errorData.message,
          positiveText: $t('common.confirm'),
          maskClosable: false,
          closeOnEsc: false,
          onPositiveClick: logoutAndCleanup,
          onClose: logoutAndCleanup
        });

        return null;
      }

      // 业务错误的全局 toast 统一在 onError 中处理，避免重复弹窗
      return null;
    },
    transformBackendResponse(response) {
      return response.data.data;
    },
    onError(error: AxiosError<App.Service.Response>) {
      const request = getRequest();
      const hasSession = Boolean(getAuthorization());
      showGlobalRequestError(request.state, error, hasSession);
    }
  };
}
