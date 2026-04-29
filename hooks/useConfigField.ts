import { useState, useEffect } from 'react';
import {
  getConfigValue,
  setConfigValue,
  onConfigChanged,
  type AppConfigKey,
  type ConfigValue,
} from '~/utils/appConfig';

/**
 * React hook for reading and writing a single appConfig field.
 *
 * Usage:
 *   const [enabled, setEnabled] = useConfigField('captionToggleEnabled', false);
 *
 * - Loads the persisted value on mount.
 * - Keeps in sync with remote changes (other devices via chrome.storage.sync).
 * - Writes immediately update local state and persist to appConfig.
 */
export function useConfigField<K extends AppConfigKey>(
  key: K,
  defaultValue: ConfigValue<K>,
): [ConfigValue<K>, (value: ConfigValue<K>) => void] {
  const [value, setValueState] = useState<ConfigValue<K>>(defaultValue);

  // Load on mount
  useEffect(() => {
    getConfigValue(key).then((v) => {
      setValueState(v !== undefined ? v : defaultValue);
    });

    // Listen for remote sync changes
    const unsubscribe = onConfigChanged((changes) => {
      const field = changes[key] as unknown as { value: ConfigValue<K> } | undefined;
      if (field !== undefined) {
        setValueState(field.value);
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (newValue: ConfigValue<K>) => {
    setValueState(newValue);
    setConfigValue(key, newValue);
  };

  return [value, setValue];
}

export default useConfigField;
