import { useEffect, useState } from 'react';
import { checkTranslatorAvailability } from '~/utils/translators/local-translator';

/**
 * True while Chrome's on-device translation model for this language pair is not on the machine yet
 * ('downloadable' / 'downloading'). Only checks when `enabled`, i.e. when local translation is the
 * active provider.
 */
export const useLocalModelNeedsDownload = (
  enabled: boolean,
  sourceLanguage: string,
  targetLanguage: string,
): boolean => {
  const [needsDownload, setNeedsDownload] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setNeedsDownload(false);
      return;
    }
    let cancelled = false;
    checkTranslatorAvailability(sourceLanguage, targetLanguage)
      .then((availability) => {
        if (!cancelled) setNeedsDownload(availability === 'downloadable' || availability === 'downloading');
      })
      .catch(() => {
        if (!cancelled) setNeedsDownload(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, sourceLanguage, targetLanguage]);

  return needsDownload;
};
