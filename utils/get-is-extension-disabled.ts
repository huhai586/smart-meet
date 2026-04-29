import { getConfigValue } from '~/utils/appConfig';

const getIsExtensionDisabled = async (): Promise<boolean> => {
  const v = await getConfigValue('isExtensionDisabled');
  return !!v;
};

export default getIsExtensionDisabled;
