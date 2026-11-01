import React, { useState, useEffect, useMemo } from 'react';
import { Switch, Select, Spin, Button, message } from 'antd';
import {
  SyncOutlined,
  LoadingOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  BellOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useI18n from '~utils/i18n';
import useGoogleCalendar from '~hooks/useGoogleCalendar';
import type { CalendarEvent } from '~utils/google-calendar-service';
import { getConfigValue, setConfigValue } from '~utils/appConfig';
import GoogleSignInGate from '~components/options/GoogleSignInGate';
import '~styles/calendar-sync.scss';

/** How many meetings the page lists; the rest are summarised as "N more". */
const MAX_LISTED_EVENTS = 8;

const eventStart = (event: CalendarEvent) => dayjs(event.start?.dateTime ?? event.start?.date);
const eventEnd = (event: CalendarEvent) => dayjs(event.end?.dateTime ?? event.end?.date);
const meetLink = (event: CalendarEvent): string | null =>
  event.hangoutLink ?? event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ?? null;

/** The synced meetings, then the few settings that control the sync and the reminders. */
const CalendarSync: React.FC = () => {
  const { t } = useI18n();
  const {
    isConnected,
    loading,
    settings,
    lastSync,
    syncError,
    syncStatus,
    events,
    updateSettings,
    manualSync,
    clearEvents,
  } = useGoogleCalendar();

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [testingNotif, setTestingNotif] = useState(false);

  useEffect(() => {
    Promise.all([getConfigValue('meetingRemindersEnabled'), getConfigValue('meetingReminderMinutes')]).then(
      ([enabled, minutes]) => {
        setRemindersEnabled(enabled as boolean);
        setReminderMinutes(minutes as number);
      }
    );
  }, []);

  const rescheduleReminders = () => chrome.runtime.sendMessage({ type: 'MEETING_REMINDERS_RESCHEDULE' }).catch(() => {});

  const handleRemindersToggle = async (checked: boolean) => {
    setRemindersEnabled(checked);
    await setConfigValue('meetingRemindersEnabled', checked);
    rescheduleReminders();
  };

  const handleReminderMinutesChange = async (value: number) => {
    setReminderMinutes(value);
    await setConfigValue('meetingReminderMinutes', value);
    rescheduleReminders();
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      await chrome.runtime.sendMessage({ type: 'MEETING_REMINDER_TEST' });
      message.success(t('calendar_test_notif_success'));
    } catch {
      message.error(t('calendar_test_notif_fail'));
    } finally {
      setTestingNotif(false);
    }
  };

  const dayLabel = (day: dayjs.Dayjs): string => {
    const now = dayjs();
    if (day.isSame(now, 'day')) return t('calendar_day_today');
    if (day.isSame(now.add(1, 'day'), 'day')) return t('calendar_day_tomorrow');
    return day.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const timeLabel = (event: CalendarEvent): string =>
    event.start?.dateTime ? `${eventStart(event).format('HH:mm')}–${eventEnd(event).format('HH:mm')}` : t('calendar_all_day');

  // Listed meetings, grouped by the day they start
  const days = useMemo(() => {
    const groups: { key: string; day: dayjs.Dayjs; events: CalendarEvent[] }[] = [];
    events.slice(0, MAX_LISTED_EVENTS).forEach((event) => {
      const day = eventStart(event).startOf('day');
      const key = day.format('YYYY-MM-DD');
      const group = groups.find((g) => g.key === key);
      if (group) group.events.push(event);
      else groups.push({ key, day, events: [event] });
    });
    return groups;
  }, [events]);

  const syncing = syncStatus === 'syncing';

  const options = {
    frequency: [
      { value: '15min', label: t('calendar_frequency_15min') },
      { value: '30min', label: t('calendar_frequency_30min') },
      { value: '1hour', label: t('calendar_frequency_1hour') },
      { value: '2hours', label: t('calendar_frequency_2hours') },
    ],
    range: [
      { value: '7days', label: t('calendar_range_7days') },
      { value: '14days', label: t('calendar_range_14days') },
      { value: '30days', label: t('calendar_range_30days') },
      { value: '60days', label: t('calendar_range_60days') },
    ],
    reminder: [
      { value: 0, label: t('calendar_reminder_on_time') },
      { value: 5, label: t('calendar_reminder_5min') },
      { value: 10, label: t('calendar_reminder_10min') },
      { value: 15, label: t('calendar_reminder_15min') },
      { value: 30, label: t('calendar_reminder_30min') },
    ],
  };

  const header = (
    <div className="cs-header">
      <h1 className="cs-title">{t('calendar_page_title')}</h1>
      <p className="cs-desc">{t('calendar_page_desc')}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="calendar-sync-page">
        {header}
        <div className="cs-loading"><Spin indicator={<LoadingOutlined spin />} /></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="calendar-sync-page">
        {header}
        <GoogleSignInGate />
      </div>
    );
  }

  return (
    <div className="calendar-sync-page">
      {header}

      <section>
        <div className="cs-section-head">
          <h2>{t('calendar_upcoming_meetings')}</h2>
          <div className="cs-section-actions">
            {lastSync && (
              <span className="cs-muted">
                {t('calendar_last_sync').replace('{time}', new Date(lastSync).toLocaleString())}
              </span>
            )}
            <Button size="small" icon={syncing ? <LoadingOutlined spin /> : <SyncOutlined />} onClick={manualSync} disabled={syncing}>
              {syncing ? t('calendar_syncing') : t('calendar_sync_now')}
            </Button>
          </div>
        </div>

        {syncStatus === 'error' && (
          <div className="cs-error">
            <ExclamationCircleOutlined />
            <span>{syncError ?? t('calendar_sync_error_default')}</span>
          </div>
        )}

        <div className="cs-card cs-events">
          {days.length === 0 ? (
            <div className="cs-empty">
              <CalendarOutlined />
              <span>{t('calendar_sync_empty')}</span>
            </div>
          ) : (
            <>
              {days.map(({ key, day, events: dayEvents }) => (
                <div key={key}>
                  <div className="cs-day">{dayLabel(day)}</div>
                  {dayEvents.map((event) => {
                    const link = meetLink(event);
                    const attendees = event.attendees?.length ?? 0;
                    return (
                      <div key={event.id} className="cs-event">
                        <span className="cs-event__time">{timeLabel(event)}</span>
                        <div className="cs-event__body">
                          <div className="cs-event__title">{event.summary ?? t('calendar_event_no_title')}</div>
                          {(attendees > 0 || event.location) && (
                            <div className="cs-event__meta">
                              {attendees > 0 && (
                                <span><TeamOutlined /> {attendees}</span>
                              )}
                              {event.location && (
                                <span className="cs-event__location"><EnvironmentOutlined /> {event.location}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {link && (
                          <Button size="small" icon={<VideoCameraOutlined />} href={link} target="_blank" rel="noreferrer">
                            {t('meetings_join_btn')}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {events.length > MAX_LISTED_EVENTS && (
                <div className="cs-more">{t('calendar_event_more').replace('{n}', String(events.length - MAX_LISTED_EVENTS))}</div>
              )}
            </>
          )}
        </div>
      </section>

      <section>
        <div className="cs-section-head">
          <h2>{t('calendar_settings_group')}</h2>
        </div>
        <div className="cs-card cs-settings">
          <div className="cs-row">
            <span className="cs-row__label">{t('calendar_auto_sync')}</span>
            <Switch checked={settings.autoSync} onChange={(v) => updateSettings({ autoSync: v })} />
          </div>
          <div className="cs-row">
            <span className="cs-row__label">{t('calendar_sync_frequency')}</span>
            <Select
              value={settings.syncFrequency}
              onChange={(v) => updateSettings({ syncFrequency: v })}
              options={options.frequency}
              disabled={!settings.autoSync}
              variant="borderless"
              popupMatchSelectWidth={false}
            />
          </div>
          <div className="cs-row">
            <span className="cs-row__label">{t('calendar_sync_range')}</span>
            <Select
              value={settings.syncRange}
              onChange={(v) => updateSettings({ syncRange: v })}
              options={options.range}
              disabled={!settings.autoSync}
              variant="borderless"
              popupMatchSelectWidth={false}
            />
          </div>
          <div className="cs-row">
            <span className="cs-row__label">{t('calendar_reminders_enable')}</span>
            <Switch checked={remindersEnabled} onChange={handleRemindersToggle} />
          </div>
          <div className="cs-row">
            <span className="cs-row__label">{t('calendar_reminders_advance')}</span>
            <Select
              value={reminderMinutes}
              onChange={handleReminderMinutesChange}
              options={options.reminder}
              disabled={!remindersEnabled}
              variant="borderless"
              popupMatchSelectWidth={false}
            />
          </div>
          <div className="cs-row">
            <span className="cs-row__label">{t('calendar_test_notif')}</span>
            <Button size="small" icon={<BellOutlined />} loading={testingNotif} onClick={handleTestNotification}>
              {t('calendar_test_notif_btn')}
            </Button>
          </div>
        </div>
        <p className="cs-footnote">
          {t('calendar_data_footnote')}
          {(events.length > 0 || lastSync) && (
            <>
              {' · '}
              <button className="cs-link" onClick={clearEvents} disabled={syncing}>
                {t('calendar_clear_events')}
              </button>
            </>
          )}
        </p>
      </section>
    </div>
  );
};

export default CalendarSync;
