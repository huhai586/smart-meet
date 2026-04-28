// 翻译工具函数统一导出
export { translateByGoogle } from './google-translator';
export { translateByMicrosoft } from './microsoft-translator';
export { translateByDeepL } from './deepl-translator';
export { translateByLocal } from './local-translator';

// 重新导出AI翻译函数（原有的translateSingleWords）
export { default as translateByAI } from '../translate-signal-words'; 