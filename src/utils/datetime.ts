import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { localStg } from '@/utils/storage';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/** API 无时区墙钟串（mock / 历史接口兜底） */
const NAIVE_API_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

export type ApiDateFormat = 'datetime' | 'date' | 'time' | 'relative' | 'smart';

export interface FormatApiDateTimeOptions {
  format?: ApiDateFormat;
  formatString?: string;
  locale?: App.I18n.LangType;
  emptyText?: string;
}

const DAYJS_LOCALE_MAP: Record<App.I18n.LangType, string> = {
  'zh-CN': 'zh-cn',
  'en-US': 'en'
};

const RELATIVE_LABELS: Record<
  App.I18n.LangType,
  {
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
    weeksAgo: (n: number) => string;
    monthsAgo: (n: number) => string;
    yearsAgo: (n: number) => string;
  }
> = {
  'zh-CN': {
    justNow: '刚刚',
    minutesAgo: n => `${n}分钟前`,
    hoursAgo: n => `${n}小时前`,
    daysAgo: n => `${n}天前`,
    weeksAgo: n => `${Math.floor(n)}周前`,
    monthsAgo: n => `${Math.floor(n)}个月前`,
    yearsAgo: n => `${Math.floor(n)}年前`
  },
  'en-US': {
    justNow: 'Just now',
    minutesAgo: n => `${n} min ago`,
    hoursAgo: n => `${n} hr ago`,
    daysAgo: n => `${n} day${n === 1 ? '' : 's'} ago`,
    weeksAgo: n => `${Math.floor(n)} wk ago`,
    monthsAgo: n => `${Math.floor(n)} mo ago`,
    yearsAgo: n => `${Math.floor(n)} yr ago`
  }
};

export function getAppLocale(): App.I18n.LangType {
  return (localStg.get('lang') as App.I18n.LangType | null) || 'zh-CN';
}

export function resolveDayjsLocale(lang?: App.I18n.LangType): string {
  const key = lang ?? getAppLocale();
  return DAYJS_LOCALE_MAP[key] ?? 'zh-cn';
}

/** 解析后端 API 时间（主路径 ISO UTC `...Z`；兜底无时区 `YYYY-MM-DD HH:mm:ss`） */
export function parseApiDateTime(value: string | number | Date | null | undefined): Dayjs | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }

  if (typeof value === 'number') {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  if (NAIVE_API_DATETIME.test(trimmed)) {
    const parsed = dayjs(trimmed.replace(' ', 'T'));
    return parsed.isValid() ? parsed : null;
  }

  const parsed = dayjs(trimmed);
  return parsed.isValid() ? parsed : null;
}

function formatRelative(d: Dayjs, locale: App.I18n.LangType): string {
  const now = dayjs();
  const diffMs = now.diff(d);
  const labels = RELATIVE_LABELS[locale] ?? RELATIVE_LABELS['zh-CN'];

  if (diffMs < 0) {
    return d.locale(resolveDayjsLocale(locale)).format('YYYY-MM-DD HH:mm');
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) {
    if (hours === 0) {
      return minutes <= 0 ? labels.justNow : labels.minutesAgo(minutes);
    }
    return labels.hoursAgo(hours);
  }
  if (days < 7) {
    return labels.daysAgo(days);
  }
  if (days < 30) {
    return labels.weeksAgo(days / 7);
  }
  if (days < 365) {
    return labels.monthsAgo(days / 30);
  }
  return labels.yearsAgo(days / 365);
}

function formatSmart(d: Dayjs, locale: App.I18n.LangType): string {
  const now = dayjs();
  const days = Math.floor(now.diff(d) / (1000 * 60 * 60 * 24));
  const withLocale = d.locale(resolveDayjsLocale(locale));

  if (days === 0) {
    return withLocale.format('HH:mm');
  }
  if (days < 7) {
    const labels = RELATIVE_LABELS[locale] ?? RELATIVE_LABELS['zh-CN'];
    return labels.daysAgo(days);
  }
  return withLocale.format('YYYY-MM-DD');
}

/** 将 API 时间格式化为浏览器本地墙钟展示 */
export function formatApiDateTime(
  value: string | number | Date | null | undefined,
  options: FormatApiDateTimeOptions = {}
): string {
  const emptyText = options.emptyText ?? '-';
  const parsed = parseApiDateTime(value);
  if (!parsed) {
    return emptyText;
  }

  const locale = options.locale ?? getAppLocale();
  const withLocale = parsed.locale(resolveDayjsLocale(locale));
  const format = options.format ?? 'datetime';

  switch (format) {
    case 'date':
      return withLocale.format('YYYY-MM-DD');
    case 'time':
      return withLocale.format('HH:mm');
    case 'datetime':
      return withLocale.format('YYYY-MM-DD HH:mm:ss');
    case 'relative':
      return formatRelative(parsed, locale);
    case 'smart':
      return formatSmart(parsed, locale);
    default:
      if (options.formatString) {
        return withLocale.format(options.formatString);
      }
      return withLocale.format('YYYY-MM-DD HH:mm:ss');
  }
}

/** 与 formatApiDateTime format: 'relative' 相同 */
export function formatApiDateRelative(
  value: string | number | Date | null | undefined,
  options?: Omit<FormatApiDateTimeOptions, 'format'>
): string {
  return formatApiDateTime(value, { ...options, format: 'relative' });
}

/** smart 模式下的天数差（供 DateRenderer 着色） */
export function getApiDateSmartAgeDays(
  value: string | number | Date | null | undefined
): number | null {
  const parsed = parseApiDateTime(value);
  if (!parsed) {
    return null;
  }
  return Math.floor(dayjs().diff(parsed) / (1000 * 60 * 60 * 24));
}
