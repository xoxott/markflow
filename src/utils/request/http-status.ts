/** Extract HTTP status from flat-request / axios error objects. */
export function resolveHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const err = error as { response?: { status?: number }; status?: number };
  return err.response?.status ?? err.status;
}

export function isAuthHttpStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}
