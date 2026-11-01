import { useCallback, useEffect, useState } from 'react';
import { getConfigValue, setConfigValue } from '~utils/appConfig';
import { useGoogleAuth } from '~contexts/GoogleAuthContext';
import { VOCAB_LAST_SYNC_KEY, VocabSyncAction, type VocabSyncResult } from '~background/vocab-drive-sync';

/** The Drive backup of the vocabulary: whether it is on, when it last ran, and a way to run it now. */
const useVocabDriveSync = () => {
  const { isAuthenticated, login } = useGoogleAuth();
  const [enabled, setEnabled] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getConfigValue('vocabDriveSync').then((value) => setEnabled(value === true));
    chrome.storage.local.get(VOCAB_LAST_SYNC_KEY).then((stored) => setLastSyncAt(stored[VOCAB_LAST_SYNC_KEY] ?? 0));
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[VOCAB_LAST_SYNC_KEY]) setLastSyncAt(changes[VOCAB_LAST_SYNC_KEY].newValue ?? 0);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const syncNow = useCallback(async (): Promise<VocabSyncResult> => {
    setSyncing(true);
    try {
      const response = await chrome.runtime.sendMessage({ action: VocabSyncAction.SyncNow });
      return response?.result ?? 'failed';
    } catch {
      return 'failed';
    } finally {
      setSyncing(false);
    }
  }, []);

  /** Turning it on asks for the Google sign-in first; without it nothing is switched on. */
  const turnOn = useCallback(async (): Promise<VocabSyncResult> => {
    if (!isAuthenticated && !(await login())) return 'unauthorized';
    await setConfigValue('vocabDriveSync', true);
    setEnabled(true);
    return syncNow();
  }, [isAuthenticated, login, syncNow]);

  const turnOff = useCallback(async () => {
    await setConfigValue('vocabDriveSync', false);
    setEnabled(false);
  }, []);

  return { enabled, lastSyncAt, syncing, turnOn, turnOff, syncNow };
};

export default useVocabDriveSync;
