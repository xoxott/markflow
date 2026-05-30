/** 登录/注册等未持 token 场景：仅提示，不登出（ai-server 凭证错误） */
export const CREDENTIAL_ERROR_CODES = ['1200', '1201'] as const;

/** 已登录场景：1200/1201 表示会话/凭证失效（如 token 被吊销），应清理登录态 */
export function isSessionCredentialError(errorCode: string): boolean {
  return (CREDENTIAL_ERROR_CODES as readonly string[]).includes(errorCode);
}

/** 已登录场景：token/会话无效等，应清理登录态（不含 1202，走刷新） */
export const SESSION_AUTH_ERROR_CODES = ['1203', '1204', '1205', '1206', '1207'] as const;

/** @deprecated 使用 SESSION_AUTH_ERROR_CODES；保留别名避免旧引用断裂 */
export const AUTH_ERROR_CODES = SESSION_AUTH_ERROR_CODES;

const DEFAULT_SUCCESS_CODES = ['200', '201'];

/** 业务成功码（与 ai-server SUCCESS_CODES 对齐，可通过 VITE_SERVICE_SUCCESS_CODE 覆盖） */
export function getSuccessCodes(): string[] {
  const codes = import.meta.env.VITE_SERVICE_SUCCESS_CODE?.split(',').filter(Boolean);
  return codes && codes.length > 0 ? codes : [...DEFAULT_SUCCESS_CODES];
}

export function isBackendSuccessCode(code: number | string): boolean {
  return getSuccessCodes().includes(String(code));
}

export function getExpiredTokenCodes(): string[] {
  const codes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',').filter(Boolean);
  return codes && codes.length > 0 ? codes : ['1202'];
}

export function getLogoutCodes(): string[] {
  return import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',').filter(Boolean) || [];
}

export function getModalLogoutCodes(): string[] {
  return import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',').filter(Boolean) || [];
}

export function extractErrorCode(errorData: Api.ErrorResponse): string {
  return String(errorData.code);
}
