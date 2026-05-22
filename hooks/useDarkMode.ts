import { useState, useEffect } from 'react';
import { getConfigValue, setConfigValue, onConfigChanged } from '~/utils/appConfig';

const CLASS = 'dark-mode';

function applyClass(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add(CLASS);
  } else {
    document.documentElement.classList.remove(CLASS);
  }
}

export function useDarkMode(): { isDark: boolean; toggle: () => void } {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getConfigValue('darkMode').then((v) => {
      setIsDark(v);
      applyClass(v);
    });

    const unsub = onConfigChanged((changes) => {
      if (changes.darkMode !== undefined) {
        const v = changes.darkMode.value;
        setIsDark(v);
        applyClass(v);
      }
    });

    return unsub;
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      applyClass(next);
      setConfigValue('darkMode', next);
      return next;
    });
  };

  return { isDark, toggle };
}
