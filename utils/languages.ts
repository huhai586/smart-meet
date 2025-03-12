export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// 支持的翻译语言列表
export const supportedLanguages: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];

// 默认语言
export const defaultLanguage: Language = supportedLanguages[0]; // 中文

// 根据语言代码获取语言对象
export const getLanguageByCode = (code: string): Language => {
  return supportedLanguages.find(lang => lang.code === code) || defaultLanguage;
};

// 获取语言名称显示
export const getLanguageDisplay = (language: Language): string => {
  return `${language.nativeName} (${language.name})`;
}; 