const isTraditionalChinese = (code: string) => /hant|tw|hk|mo/i.test(code);

/**
 * True when two BCP-47 codes name the same language ('en' and 'en-US'). Simplified and Traditional
 * Chinese count as different, since they are separate translation targets.
 */
export const isSameLanguage = (a: string, b: string): boolean => {
  const base = (code: string) => code.toLowerCase().split('-')[0];
  if (base(a) !== base(b)) return false;
  return base(a) !== 'zh' || isTraditionalChinese(a) === isTraditionalChinese(b);
};
