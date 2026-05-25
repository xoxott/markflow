/** 仅开发环境输出的性能日志 */
export function devPerfLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

/** 仅开发环境输出的性能警告 */
export function devPerfWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}
