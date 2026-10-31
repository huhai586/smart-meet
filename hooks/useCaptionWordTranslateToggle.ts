import useConfigField from './useConfigField';

export const useCaptionWordTranslateToggle = () => {
  return useConfigField('captionWordTranslateEnabled', true);
};

export default useCaptionWordTranslateToggle;
