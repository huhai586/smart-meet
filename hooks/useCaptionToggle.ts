import useConfigField from './useConfigField';

export const useCaptionToggle = () => {
  return useConfigField('captionToggleEnabled', false);
};

export default useCaptionToggle;