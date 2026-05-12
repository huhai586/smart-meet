/**
 * Calendar Auto-Sync Service (Background)
 *
 * Uses chrome.alarms to periodically fetch events from Google Calendar and
 * store them in chrome.storage.local so the options/sidepanel can read them
 * without making live API calls.
 *
 * Alarm name: 'calendarAutoSync'
 * Storage key: 'calendarEvents'  → CalendarEvent[]
 *              'calendarLastSync' → ISO timestamp string
 *              'calendarSyncError' → string | null
 */

import { getConfigValue } from '~utils/appConfig';
import GoogleCalendarService, { type CalendarEvent } from '~utils/google-calendar-service';

const ALARM_NAME = 'calendarAutoSync';
const EVENTS_KEY = 'calendarEvents';
const LAST_SYNC_KEY = 'calendarLastSync';
const SYNC_ERROR_KEY = 'calendarSyncError';

const FREQUENCY_MINUTES: Record<string, number> = {
  '15min':  15,
  '30min':  30,
  '1hour':  60,
  '2hours': 120,
};

const RANGE_DAYS: Record<string, number> = {
  '7days':  7,
  '14days': 14,
  '30days': 30,
  '60days': 60,
};

/** Perform one calendar sync – fetch events and persist them. */
export async function runCalendarSync(): Promise<void> {
  console.log('[CalendarSync] Starting sync...');

  const [autoSync, freq, range] = await Promise.all([
    getConfigValue('calendarAutoSync'),
    getConfigValue('calendarSyncFrequency'),
    getConfigValue('calendarSyncRange'),
  ]);

  if (!autoSync) {
    console.log('[CalendarSync] Auto-sync disabled, skipping.');
    return;
  }

  const daysAhead = RANGE_DAYS[range as string] ?? 30;
  const service = GoogleCalendarService.getInstance();

  // Check that the user is still connected (non-interactive)
  const connected = await service.checkConnection();
  if (!connected) {
    console.warn('[CalendarSync] Not connected to Google Calendar, aborting.');
    await chrome.storage.local.set({ [SYNC_ERROR_KEY]: 'Not connected to Google Calendar' });
    return;
  }

  try {
    const events: CalendarEvent[] = await service.getUpcomingEvents(daysAhead);
    await chrome.storage.local.set({
      [EVENTS_KEY]: events,
      [LAST_SYNC_KEY]: new Date().toISOString(),
      [SYNC_ERROR_KEY]: null,
    });
    console.log(`[CalendarSync] Synced ${events.length} events.`);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[CalendarSync] Sync failed:', msg);
    await chrome.storage.local.set({ [SYNC_ERROR_KEY]: msg });
  }
}

/** Register (or update) the periodic alarm based on current settings. */
export async function scheduleCalendarAlarm(): Promise<void> {
  const [autoSync, freq] = await Promise.all([
    getConfigValue('calendarAutoSync'),
    getConfigValue('calendarSyncFrequency'),
  ]);

  // Clear any existing alarm first
  await chrome.alarms.clear(ALARM_NAME);

  if (!autoSync) {
    console.log('[CalendarSync] Auto-sync off, alarm cleared.');
    return;
  }

  const periodInMinutes = FREQUENCY_MINUTES[freq as string] ?? 15;

  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: periodInMinutes, // first fire after one period
    periodInMinutes,
  });

  console.log(`[CalendarSync] Alarm set: every ${periodInMinutes} minutes.`);
}

/** Cancel the alarm (called on disconnect or when auto-sync is toggled off). */
export async function clearCalendarAlarm(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAME);
  console.log('[CalendarSync] Alarm cleared.');
}

/** Hook into chrome.alarms.onAlarm – must be called from background/index.ts. */
export function initCalendarAutoSync(): void {
  // Restore alarm on service worker restart (alarms survive SW termination,
  // but we re-register to ensure periodInMinutes is up to date).
  scheduleCalendarAlarm();

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
      runCalendarSync();
    }
  });

  // Also respond to messages from the options page
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'CALENDAR_SYNC_NOW') {
      runCalendarSync().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
      return true; // keep channel open
    }
    if (msg?.type === 'CALENDAR_ALARM_RESCHEDULE') {
      scheduleCalendarAlarm().then(() => sendResponse({ ok: true }));
      return true;
    }
    if (msg?.type === 'CALENDAR_ALARM_CLEAR') {
      clearCalendarAlarm().then(() => sendResponse({ ok: true }));
      return true;
    }
  });

  console.log('[CalendarSync] Auto-sync service initialized.');
}
