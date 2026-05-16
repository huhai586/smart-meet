/**
 * Meeting Reminder Service (Background)
 *
 * Reads calendarEvents from chrome.storage.local, schedules chrome.alarms
 * N minutes before each upcoming event, and fires a chrome.notifications
 * system notification when the alarm triggers.
 *
 * Alarm name format: `meetingReminder:EVENT_ID`
 * Storage key: 'calendarEvents' → CalendarEvent[]
 */

import { getConfigValue } from '~utils/appConfig';
import type { CalendarEvent } from '~utils/google-calendar-service';

const ALARM_PREFIX = 'meetingReminder:';
const EVENTS_KEY = 'calendarEvents';

/** Build the alarm name for a given event id. */
function alarmName(eventId: string): string {
  return `${ALARM_PREFIX}${eventId}`;
}

/** Parse the event id back out of an alarm name. */
function eventIdFromAlarm(name: string): string | null {
  return name.startsWith(ALARM_PREFIX) ? name.slice(ALARM_PREFIX.length) : null;
}

/** Get start time (ms) from a CalendarEvent, or null if unavailable. */
function getStartMs(event: CalendarEvent): number | null {
  const raw = event.start?.dateTime ?? event.start?.date ?? null;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return isNaN(ms) ? null : ms;
}

/** Schedule reminder alarms for all upcoming events. Clears stale alarms first. */
export async function scheduleReminderAlarms(): Promise<void> {
  const [enabled, minutesBefore] = await Promise.all([
    getConfigValue('meetingRemindersEnabled'),
    getConfigValue('meetingReminderMinutes'),
  ]);

  // Clear all existing reminder alarms
  const allAlarms = await chrome.alarms.getAll();
  await Promise.all(
    allAlarms
      .filter(a => a.name.startsWith(ALARM_PREFIX))
      .map(a => chrome.alarms.clear(a.name))
  );

  if (!enabled) {
    console.log('[MeetingReminders] Reminders disabled, alarms cleared.');
    return;
  }

  const stored = await chrome.storage.local.get(EVENTS_KEY);
  const events: CalendarEvent[] = stored[EVENTS_KEY] ?? [];

  const now = Date.now();
  const offsetMs = (minutesBefore as number) * 60 * 1000;
  let scheduled = 0;

  for (const event of events) {
    if (!event.id) continue;
    const startMs = getStartMs(event);
    if (startMs === null) continue;

    const fireAt = startMs - offsetMs;
    if (fireAt <= now) continue; // already passed

    chrome.alarms.create(alarmName(event.id), { when: fireAt });
    scheduled++;
  }

  console.log(`[MeetingReminders] Scheduled ${scheduled} reminder alarm(s).`);
}

/** Show a system notification for the given event. */
function showMeetingNotification(event: CalendarEvent, minutesBefore: number): void {
  const title = event.summary ?? '会议提醒';
  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri ??
    null;

  const startRaw = event.start?.dateTime ?? event.start?.date ?? '';
  const startStr = startRaw
    ? new Date(startRaw).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';

  const message = [
    minutesBefore === 0
      ? '会议即将开始'
      : `${minutesBefore} 分钟后开始`,
    startStr ? `开始时间：${startStr}` : null,
    meetLink ? '点击此通知加入会议' : null,
  ]
    .filter(Boolean)
    .join('\n');

  // Use the 128px icon declared in the extension manifest (path includes build hash)
  const manifestIcons = chrome.runtime.getManifest().icons as Record<string, string> | undefined;
  const iconPath = manifestIcons?.['128'] ?? manifestIcons?.['64'] ?? manifestIcons?.['48'] ?? '';
  const iconUrl = iconPath ? chrome.runtime.getURL(iconPath) : chrome.runtime.getURL('images/google-meeting-icon.png');

  const notifOptions: chrome.notifications.NotificationOptions<true> = {
    type: 'basic',
    iconUrl,
    title,
    message,
    priority: 2,
  };

  if (meetLink) {
    notifOptions.buttons = [{ title: '加入会议' }];
  }

  const notifId = `meetingNotif:${event.id}`;

  // Persist the meet link so the top-level click handler can read it
  // even after the service worker is suspended and reawakened.
  if (meetLink) {
    chrome.storage.local.get(['_meetingNotifLinks'], (res) => {
      const links: Record<string, string> = res['_meetingNotifLinks'] ?? {};
      links[notifId] = meetLink;
      chrome.storage.local.set({ _meetingNotifLinks: links });
    });
  }

  chrome.notifications.create(notifId, notifOptions, () => {
    if (chrome.runtime.lastError) {
      console.warn('[MeetingReminders] Notification error:', chrome.runtime.lastError.message);
    }
  });
}

/** Send a test notification immediately (called from options page). */
export async function sendTestNotification(): Promise<void> {
  const minutesBefore = (await getConfigValue('meetingReminderMinutes')) as number;

  const fakeEvent: CalendarEvent = {
    id: 'test-event',
    summary: '📅 测试会议提醒',
    start: { dateTime: new Date(Date.now() + minutesBefore * 60 * 1000).toISOString() },
    hangoutLink: 'https://meet.google.com/niz-frpv-jry?authuser=0',
  };

  showMeetingNotification(fakeEvent, minutesBefore);
}

/** Hook into chrome.alarms.onAlarm and chrome.storage.onChanged. */
export function initMeetingReminders(): void {
  // Schedule on startup
  scheduleReminderAlarms();

  // Re-schedule whenever calendar events are updated
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && EVENTS_KEY in changes) {
      scheduleReminderAlarms();
    }
  });

  // Handle alarm firing
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    const eventId = eventIdFromAlarm(alarm.name);
    if (!eventId) return;

    const [enabled, minutesBefore, stored] = await Promise.all([
      getConfigValue('meetingRemindersEnabled'),
      getConfigValue('meetingReminderMinutes'),
      chrome.storage.local.get(EVENTS_KEY),
    ]);

    if (!enabled) return;

    const events: CalendarEvent[] = stored[EVENTS_KEY] ?? [];
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    showMeetingNotification(event, minutesBefore as number);
  });

  /**
   * Persistent top-level button-click handler.
   * Must be registered at top level (not inside a closure) so it survives
   * MV3 service worker suspension/reactivation.
   */
  const openMeetLink = async (notifId: string) => {
    const res = await chrome.storage.local.get('_meetingNotifLinks');
    const links: Record<string, string> = res['_meetingNotifLinks'] ?? {};
    const url = links[notifId];
    if (url) {
      chrome.tabs.create({ url });
      chrome.notifications.clear(notifId);
      // Clean up stored link
      delete links[notifId];
      chrome.storage.local.set({ _meetingNotifLinks: links });
    }
  };

  // "Join" button click
  chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    if (btnIdx === 0) openMeetLink(notifId);
  });

  // Clicking the notification body itself also joins
  chrome.notifications.onClicked.addListener((notifId) => {
    openMeetLink(notifId);
  });

  // Handle messages from options page
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'MEETING_REMINDER_TEST') {
      sendTestNotification()
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
    if (msg?.type === 'MEETING_REMINDERS_RESCHEDULE') {
      scheduleReminderAlarms()
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
  });

  console.log('[MeetingReminders] Service initialized.');
}
