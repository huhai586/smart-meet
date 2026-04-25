import { useEffect, useState } from 'react';

/**
 * Reads a numeric font-size offset (in px) from chrome.storage.local
 * and re-syncs whenever another page (e.g. options) writes a new value.
 */
const useFontSizeOffset = (storageKey: string): number => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        chrome.storage.local.get([storageKey], (result) => {
            setOffset(result[storageKey] ?? 0);
        });

        const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
            if (storageKey in changes) {
                setOffset(changes[storageKey].newValue ?? 0);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, [storageKey]);

    return offset;
};

export default useFontSizeOffset;
