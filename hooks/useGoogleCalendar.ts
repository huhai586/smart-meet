import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import GoogleCalendarService, { type CalendarUser, type CalendarEvent } from '~utils/google-calendar-service';
import { getConfigValue, setConfigValue } from '~utils/appConfig';

export interface CalendarSettings {
  autoSync: boolean;
  syncFrequency: string;
  syncRange: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface UseGoogleCalendarReturn {
  isConnected: boolean;
  user: CalendarUser | null;
  loading: boolean;
  connecting: boolean;
  settings: CalendarSettings;
  lastSync: string | null;
  syncError: string | null;
  syncStatus: SyncStatus;
  events: CalendarEvent[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateSettings: (patch: Partial<CalendarSettings>) => Promise<void>;
  syncNow: () => Promise<void>;
  manualSync: () => Promise<void>;
}

const service = GoogleCalendarService.getInstance();

/** Send a fire-and-forget message to the background service worker. */
function sendBgMessage(type: string): void {
  chrome.runtime.sendMessage({ type }).catch(() => {/* SW may not be awake yet */});
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<CalendarUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({
    autoSync: true,
    syncFrequency: '15min',
    syncRange: '30days',
  });

  // Load persisted state + settings on mount
  useEffect(() => {
    const init = async () => {
      const [persisted, autoSync, syncFrequency, syncRange] = await Promise.all([
        service.getPersistedState(),
        getConfigValue('calendarAutoSync'),
        getConfigValue('calendarSyncFrequency'),
        getConfigValue('calendarSyncRange'),
      ]);

      setIsConnected(persisted.connected);
      setUser(persisted.user);
      setSettings({
        autoSync: autoSync as boolean,
        syncFrequency: syncFrequency as string,
        syncRange: syncRange as string,
      });

      // Load last sync metadata + cached events from local storage
      chrome.storage.local.get(['calendarLastSync', 'calendarSyncError', 'calendarEvents'], (res) => {
        setLastSync(res.calendarLastSync ?? null);
        setSyncError(res.calendarSyncError ?? null);
        if (Array.isArray(res.calendarEvents)) {
          setEvents(res.calendarEvents);
        }
      });

      // Silently verify the token is still valid
      if (persisted.connected) {
        const still = await service.checkConnection();
        if (!still) {
          setIsConnected(false);
          setUser(null);
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { success, user: calUser } = await service.connect();
      if (success) {
        setIsConnected(true);
        setUser(calUser);
        // Schedule the alarm now that we're connected
        sendBgMessage('CALENDAR_ALARM_RESCHEDULE');
        // Do an immediate sync
        sendBgMessage('CALENDAR_SYNC_NOW');
      } else {
        message.error('连接 Google Calendar 失败，请重试');
      }
    } catch (err: any) {
      message.error('连接失败：' + (err?.message ?? '未知错误'));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await service.disconnect();
    setIsConnected(false);
    setUser(null);
    sendBgMessage('CALENDAR_ALARM_CLEAR');
  }, []);

  const updateSettings = useCallback(async (patch: Partial<CalendarSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await Promise.all([
      patch.autoSync !== undefined      ? setConfigValue('calendarAutoSync', patch.autoSync) : Promise.resolve(),
      patch.syncFrequency !== undefined ? setConfigValue('calendarSyncFrequency', patch.syncFrequency) : Promise.resolve(),
      patch.syncRange !== undefined     ? setConfigValue('calendarSyncRange', patch.syncRange) : Promise.resolve(),
    ]);
    // Reschedule (or clear) alarm whenever settings change
    if (patch.autoSync === false) {
      sendBgMessage('CALENDAR_ALARM_CLEAR');
    } else {
      sendBgMessage('CALENDAR_ALARM_RESCHEDULE');
    }
  }, [settings]);

  const syncNow = useCallback(async () => {
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'CALENDAR_SYNC_NOW' }, () => resolve());
    });
    // Refresh last-sync timestamp from storage
    chrome.storage.local.get(['calendarLastSync', 'calendarSyncError', 'calendarEvents'], (res) => {
      setLastSync(res.calendarLastSync ?? null);
      setSyncError(res.calendarSyncError ?? null);
      if (Array.isArray(res.calendarEvents)) setEvents(res.calendarEvents);
    });
  }, []);

  /** Manual sync: calls Calendar API directly so UI gets immediate feedback. */
  const manualSync = useCallback(async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    const rangeDays: Record<string, number> = {
      '7days': 7, '14days': 14, '30days': 30, '60days': 60,
    };
    const daysAhead = rangeDays[settings.syncRange] ?? 30;
    try {
      const fetched = await service.getUpcomingEvents(daysAhead);
      const now = new Date().toISOString();
      console.log(`[CalendarSync] Manual sync completed — ${fetched.length} events:`, fetched);
      await chrome.storage.local.set({
        calendarEvents: fetched,
        calendarLastSync: now,
        calendarSyncError: null,
      });
      setEvents(fetched);
      setLastSync(now);
      setSyncStatus('success');
    } catch (err: any) {
      const errMsg = err?.message ?? String(err);
      console.error('[CalendarSync] Manual sync failed:', errMsg);
      await chrome.storage.local.set({ calendarSyncError: errMsg });
      setSyncError(errMsg);
      setSyncStatus('error');
    }
  }, [settings.syncRange]);

  return { isConnected, user, loading, connecting, settings, lastSync, syncError, syncStatus, events, connect, disconnect, updateSettings, syncNow, manualSync };
}

export default useGoogleCalendar;
