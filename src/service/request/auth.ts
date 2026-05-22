import { localStg } from '@/utils/storage';
import { SERVICE_DEFAULT_HEADERS } from './requestDefaults';

export function getAuthorization(): string | null {
  const token = localStg.get('token') || localStg.get('accessToken');
  return token ? `Bearer ${token}` : null;
}

/** Headers shared by REST and stream (fetch SSE) requests */
export function buildServiceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    ...SERVICE_DEFAULT_HEADERS
  };

  const authorization = getAuthorization();
  if (authorization) {
    headers.Authorization = authorization;
  }

  return headers;
}
