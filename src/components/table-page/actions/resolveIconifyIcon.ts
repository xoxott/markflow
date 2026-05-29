/** Uno `i-{collection}-{name}` 或 Iconify `{collection}:{name}` 统一为 SvgIcon 可用的 Iconify 名 */
export function resolveIconifyIcon(icon: string) {
  if (icon.includes(':')) return icon;
  if (icon.startsWith('i-')) {
    const rest = icon.slice(2);
    const dashIndex = rest.indexOf('-');
    if (dashIndex > 0) {
      return `${rest.slice(0, dashIndex)}:${rest.slice(dashIndex + 1)}`;
    }
  }
  return icon;
}
