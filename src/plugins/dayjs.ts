import { extend } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import utc from 'dayjs/plugin/utc';
import { setDayjsLocale } from '../locales/dayjs';

export function setupDayjs() {
  extend(utc);
  extend(localeData);

  setDayjsLocale();
}
