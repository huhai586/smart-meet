import useConfigField from './useConfigField';

export const useStickerToggle = () => {
  return useConfigField('stickerEnabled', false);
};

export default useStickerToggle;
