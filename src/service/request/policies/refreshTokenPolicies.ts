import type { RequestOption } from '@suga/axios';
import { isBackendSuccessCode } from './errorCodes';

/** 刷新专用实例：无 Authorization，失败静默 */
export function createRefreshTokenRequestOptions(): Partial<RequestOption<App.Service.Response>> {
  return {
    async onRequest(config) {
      return config;
    },
    isBackendSuccess(response) {
      return isBackendSuccessCode(response.data.code);
    },
    async onBackendFail() {
      return null;
    },
    transformBackendResponse(response) {
      return response.data.data;
    },
    onError() {}
  };
}
