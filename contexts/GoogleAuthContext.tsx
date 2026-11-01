import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from 'react';
import { message } from 'antd';
import { GoogleDriveService } from '~utils/google-drive';
import useI18n from '~utils/i18n';
import {
  GoogleStorageKey,
  restoreGoogleSession,
  signInGoogle,
  signOutGoogle,
  type GoogleUser,
} from '~utils/google-account';

interface GoogleAuthContextType {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  loading: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {}
});

export const useGoogleAuth = () => useContext(GoogleAuthContext);

interface GoogleAuthProviderProps {
  children: ReactNode;
}

/** Drive's view of the extension's one Google sign-in (utils/google-account). */
export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const { t } = useI18n();
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const driveService = GoogleDriveService.getInstance();

  /** Makes Drive use the signed-in account, or forgets it when there is none. */
  const applyUser = useCallback(async (next: GoogleUser | null) => {
    if (next) await driveService.authenticate(false);
    setUser(next);
  }, [driveService]);

  useEffect(() => {
    // 延迟一点检查认证状态，确保Chrome API已加载
    const timer = setTimeout(async () => {
      if (!window.chrome?.identity) {
        setLoading(false);
        return;
      }
      try {
        await applyUser(await restoreGoogleSession());
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [applyUser]);

  // Another page (the options header, the Calendar page) signed in or out
  useEffect(() => {
    const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === 'local' && GoogleStorageKey.USER in changes) {
        applyUser((changes[GoogleStorageKey.USER].newValue as GoogleUser | undefined) ?? null);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [applyUser]);

  const login = async (): Promise<boolean> => {
    setLoading(true);
    try {
      await applyUser(await signInGoogle());
      return true;
    } catch (error) {
      message.error(`${t('google_sign_in_failed')} ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOutGoogle();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleAuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export default GoogleAuthContext;
