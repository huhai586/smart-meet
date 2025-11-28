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

// Extend dayjs with required plugins
dayjs.extend(weekday);
dayjs.extend(localeData);

// Export configured dayjs instance
export default dayjs;

