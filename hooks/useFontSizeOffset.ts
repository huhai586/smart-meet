import { useEffect, useState } from 'react';
import { getConfigValue, setConfigValue, onConfigChanged, type AppConfigKey } from '~/utils/appConfig';

/**
 * Reads a numeric font-size offset from appConfig and re-syncs when
 * another page (e.g. options) or another device writes a new value.
 */
const useFontSizeOffset = (storageKey: 'captionFontSizeOffset' | 'summaryFontSizeOffset'): number => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        getConfigValue(storageKey).then((v) => setOffset(v ?? 0));

        const unsubscribe = onConfigChanged((changes) => {
            const field = changes[storageKey] as { value: number } | undefined;
            if (field !== undefined) setOffset(field.value ?? 0);
        });

        return unsubscribe;
    }, [storageKey]);

    return offset;
};

export default useFontSizeOffset;
