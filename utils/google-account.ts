/**
 * One Google sign-in for the whole extension.
 *
 * Calendar and Drive share a single token, asked for once with every scope the extension uses. Who is signed in is
 * kept in chrome.storage.local, so the popup and the options page can show it without a network call.
 */

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

export const GoogleStorageKey = {
  USER: 'googleUser',
  CALENDAR_CONNECTED: 'calendarConnected',
  CALENDAR_USER: 'calendarUser',
} as const;

const SESSION_KEYS = Object.values(GoogleStorageKey);

const requestToken = (interactive: boolean): Promise<{ token: string | null; error?: string }> =>
  new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive, scopes: GOOGLE_SCOPES }, (token) => {
      if (chrome.runtime.lastError) {
        console.warn('[GoogleAccount] getAuthToken error:', chrome.runtime.lastError.message);
        resolve({ token: null, error: chrome.runtime.lastError.message });
      } else {
        resolve({ token: token ?? null });
      }
    });
  });

export const getGoogleToken = async (interactive: boolean): Promise<string | null> => (await requestToken(interactive)).token;

const dropCachedToken = (token: string) =>
  new Promise<void>((resolve) => chrome.identity.removeCachedAuthToken({ token }, resolve));

const fetchGoogleUser = async (token: string): Promise<GoogleUser | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { email: data.email, name: data.name, picture: data.picture };
  } catch {
    return null;
  }
};

const sendBackground = (type: string) => {
  chrome.runtime.sendMessage({ type }).catch(() => {/* the service worker may not be awake yet */});
};

/** The signed-in account as last stored; accounts connected through the old Calendar-only flow count too. */
export const readStoredGoogleUser = async (): Promise<GoogleUser | null> => {
  const stored = await chrome.storage.local.get(SESSION_KEYS);
  const user = (stored[GoogleStorageKey.USER] as GoogleUser | undefined)
    ?? (stored[GoogleStorageKey.CALENDAR_CONNECTED] ? (stored[GoogleStorageKey.CALENDAR_USER] as GoogleUser | undefined) : undefined);
  return user ?? null;
};

export const clearGoogleSession = () => chrome.storage.local.remove(SESSION_KEYS);

/** Asks the user to sign in, then lets Calendar start syncing. Throws with Chrome's reason when it doesn't work. */
export const signInGoogle = async (): Promise<GoogleUser> => {
  const stale = await getGoogleToken(false);
  if (stale) await dropCachedToken(stale);

  const { token, error } = await requestToken(true);
  if (!token) throw new Error(error ?? 'No access token');

  const user = await fetchGoogleUser(token);
  if (!user) {
    await dropCachedToken(token);
    throw new Error('Could not read the Google account');
  }

  await chrome.storage.local.set({
    [GoogleStorageKey.USER]: user,
    [GoogleStorageKey.CALENDAR_CONNECTED]: true,
    [GoogleStorageKey.CALENDAR_USER]: user,
  });
  sendBackground('CALENDAR_ALARM_RESCHEDULE');
  sendBackground('CALENDAR_SYNC_NOW');
  return user;
};

/**
 * Forgets the account on this device. Only the cached token is dropped: revoking the grant would end the
 * sign-in for every Chrome profile that uses it.
 */
export const signOutGoogle = async (): Promise<void> => {
  const token = await getGoogleToken(false);
  if (token) await dropCachedToken(token);
  await clearGoogleSession();
  sendBackground('CALENDAR_ALARM_CLEAR');
};

/** Quietly checks that the sign-in still holds, without showing any prompt. */
export const restoreGoogleSession = async (): Promise<GoogleUser | null> => {
  const token = await getGoogleToken(false);
  if (!token) {
    await clearGoogleSession();
    return null;
  }
  const stored = await readStoredGoogleUser();
  if (stored) return stored;

  const user = await fetchGoogleUser(token);
  if (user) {
    await chrome.storage.local.set({
      [GoogleStorageKey.USER]: user,
      [GoogleStorageKey.CALENDAR_CONNECTED]: true,
      [GoogleStorageKey.CALENDAR_USER]: user,
    });
  }
  return user;
};
