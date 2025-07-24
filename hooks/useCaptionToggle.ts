import { useState, useEffect } from 'react';

const STORAGE_KEY = 'captionToggleEnabled';

export const useCaptionToggle = () => {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    // 从存储中加载设置
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      setEnabled(result[STORAGE_KEY] || false); // 默认关闭
    });

    // 监听存储变化
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEY]) {
        setEnabled(changes[STORAGE_KEY].newValue || false);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const setEnabledValue = (value: boolean) => {
    setEnabled(value);
    chrome.storage.local.set({ [STORAGE_KEY]: value });
  };

  return [enabled, setEnabledValue] as const;
};

export default useCaptionToggle;