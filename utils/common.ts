import { getConfigValue } from '~/utils/appConfig';

export const getSpecificTags = async () => {
  const v = await getConfigValue('specificHighlightWords');
  return v ?? [];
};

export const getDomainTags = async () => {
  const v = await getConfigValue('highlightWordsByDescriptions');
  return v ?? [];
};

export const getDomain = async () => {
  return getConfigValue('domain');
};
