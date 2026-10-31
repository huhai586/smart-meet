import { getConfigValue, setConfigValue } from '~/utils/appConfig';

export const getTranslatedWords = async (): Promise<string[]> => {
  const v = await getConfigValue('translatedWords');
  return v ?? [];
};

export const setTranslatedWords = async (text: string) => {
  const translatedWords = await getTranslatedWords();
  await setConfigValue('translatedWords', [...new Set([...translatedWords, text])]);
};

export const removeTranslatedWord = async (text: string) => {
  const translatedWords = await getTranslatedWords();
  await setConfigValue('translatedWords', translatedWords.filter((word) => word !== text));
};
