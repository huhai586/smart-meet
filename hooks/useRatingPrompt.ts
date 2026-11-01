import { useCallback } from 'react';
import { getConfigValue, setConfigValue } from '~/utils/appConfig';
import useConfigField from './useConfigField';

/** Successful summaries before the review card shows up. */
export const RATING_PROMPT_THRESHOLD = 3;

export const storeReviewsUrl = (extensionId: string) =>
  `https://chromewebstore.google.com/detail/${extensionId}/reviews`;

/**
 * The one-time "leave a review" card. It appears after RATING_PROMPT_THRESHOLD successful summaries and
 * is resolved for good once the user rates or dismisses it (the flag syncs across their devices).
 */
export const useRatingPrompt = () => {
  const [count] = useConfigField('successfulSummaryCount', 0);
  const [resolved, setResolved] = useConfigField('ratingPromptResolved', false);

  const recordSuccess = useCallback(async () => {
    if (await getConfigValue('ratingPromptResolved')) return;
    const current = (await getConfigValue('successfulSummaryCount')) ?? 0;
    await setConfigValue('successfulSummaryCount', current + 1);
  }, []);

  const rate = useCallback(() => {
    void chrome.tabs.create({ url: storeReviewsUrl(chrome.runtime.id) });
    setResolved(true);
  }, [setResolved]);

  const dismiss = useCallback(() => setResolved(true), [setResolved]);

  return { visible: !resolved && count >= RATING_PROMPT_THRESHOLD, recordSuccess, rate, dismiss };
};

export default useRatingPrompt;
