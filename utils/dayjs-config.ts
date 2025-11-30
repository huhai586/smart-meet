/**
 * Global dayjs configuration file
 * 
 * This file configures dayjs with all necessary plugins required by the application.
 * Import this file in entry points (sidepanel.tsx, options.tsx, popup.tsx, etc.)
 * to ensure dayjs is properly configured.
 * 
 * Required plugins:
 * - weekday: Required by Ant Design DatePicker (since antd 5.26+)
 * - localeData: Required by Ant Design DatePicker for locale support
 */

import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';

// Import all locale files
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/it';
import 'dayjs/locale/pt';
import 'dayjs/locale/ru';
import 'dayjs/locale/ar';
import 'dayjs/locale/hi';
import 'dayjs/locale/th';
import 'dayjs/locale/vi';
import 'dayjs/locale/fa';

// Extend dayjs with required plugins
dayjs.extend(weekday);
dayjs.extend(localeData);

// Map our language codes to dayjs locale codes
const LOCALE_MAP: Record<string, string> = {
  'en': 'en',
  'zh': 'zh-cn',
  'ja': 'ja',
  'ko': 'ko',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'ar': 'ar',
  'hi': 'hi',
  'th': 'th',
  'vi': 'vi',
  'fa': 'fa'
};

/**
 * Set dayjs locale based on UI language
 * @param langCode - Language code (e.g., 'en', 'zh', 'ja')
 */
export const setDayjsLocale = (langCode: string) => {
  const dayjsLocale = LOCALE_MAP[langCode] || 'en';
  dayjs.locale(dayjsLocale);
  console.log('Dayjs locale set to:', dayjsLocale);
};

// Export configured dayjs instance
export default dayjs;

