import React, { useState, useEffect, useMemo } from 'react';
import { Switch, Select, Spin, message } from 'antd';
import {
  SyncOutlined,
  LoadingOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  BellOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  NotificationOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useI18n from '~utils/i18n';
import useGoogleCalendar from '~hooks/useGoogleCalendar';
import type { CalendarEvent } from '~utils/google-calendar-service';
import { getConfigValue, setConfigValue } from '~utils/appConfig';
import GoogleSignInGate from '~components/options/GoogleSignInGate';
import PageShell, { PageWidth } from '~components/options/PageShell';
import { OptionsRoute } from '~utils/options-routes';
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

  const dayLabel = (day: dayjs.Dayjs): { label: string; date: number; month: string; isToday: boolean } => {
    const now = dayjs();
    const date = day.toDate();
    const isToday = day.isSame(now, 'day');
    const label = isToday
      ? t('calendar_day_today')
      : day.isSame(now.add(1, 'day'), 'day')
        ? t('calendar_day_tomorrow')
        : date.toLocaleDateString(undefined, { weekday: 'short' });
    return { label, date: day.date(), month: date.toLocaleDateString(undefined, { month: 'short' }), isToday };
  };

  /** The start time with the end under it; all-day events have only a label. */
  const timeParts = (event: CalendarEvent): { start: string; end?: string } =>
    event.start?.dateTime
      ? { start: eventStart(event).format('HH:mm'), end: eventEnd(event).format('HH:mm') }
      : { start: t('calendar_all_day') };

  const isLive = (event: CalendarEvent) => !!event.start?.dateTime && eventStart(event).isBefore(dayjs()) && eventEnd(event).isAfter(dayjs());

  // Listed meetings, grouped by the day they start
  const days = useMemo(() => {
    const groups: { key: string; day: dayjs.Dayjs; events: CalendarEvent[]; showMonth: boolean }[] = [];
    events.slice(0, MAX_LISTED_EVENTS).forEach((event) => {
      const day = eventStart(event).startOf('day');
      const key = day.format('YYYY-MM-DD');
      const group = groups.find((g) => g.key === key);
      if (group) group.events.push(event);
      else groups.push({ key, day, events: [event], showMonth: false });
    });
    // The month is only spelled out where it begins, so single-meeting days stay short
    groups.forEach((group, i) => {
      group.showMonth = i === 0 || group.day.month() !== groups[i - 1].day.month();
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

  if (loading) {
    return (
      <PageShell route={OptionsRoute.CALENDAR} subtitle={t('calendar_page_desc')} width={PageWidth.WIDE}>
        <div className="calendar-sync-page">
          <div className="cs-loading"><Spin indicator={<LoadingOutlined spin />} /></div>
        </div>
      </PageShell>
    );
  }

  if (!isConnected) {
    return (
      <PageShell route={OptionsRoute.CALENDAR} subtitle={t('calendar_page_desc')} width={PageWidth.WIDE}>
        <GoogleSignInGate />
      </PageShell>
    );
  }

  const settingRows: { key: string; color: string; icon: React.ReactNode; label: string; control: React.ReactNode }[] = [
    {
      key: 'auto-sync', color: '#007AFF', icon: <SyncOutlined />, label: t('calendar_auto_sync'),
      control: <Switch checked={settings.autoSync} onChange={(v) => updateSettings({ autoSync: v })} />,
    },
    {
      key: 'frequency', color: '#FF9500', icon: <ClockCircleOutlined />, label: t('calendar_sync_frequency'),
      control: (
        <Select value={settings.syncFrequency} onChange={(v) => updateSettings({ syncFrequency: v })} options={options.frequency}
          disabled={!settings.autoSync} variant="borderless" popupMatchSelectWidth={false} />
      ),
    },
    {
      key: 'range', color: '#34C759', icon: <CalendarOutlined />, label: t('calendar_sync_range'),
      control: (
        <Select value={settings.syncRange} onChange={(v) => updateSettings({ syncRange: v })} options={options.range}
          disabled={!settings.autoSync} variant="borderless" popupMatchSelectWidth={false} />
      ),
    },
    {
      key: 'reminders', color: '#FF3B30', icon: <BellOutlined />, label: t('calendar_reminders_enable'),
      control: <Switch checked={remindersEnabled} onChange={handleRemindersToggle} />,
    },
    {
      key: 'advance', color: '#AF52DE', icon: <FieldTimeOutlined />, label: t('calendar_reminders_advance'),
      control: (
        <Select value={reminderMinutes} onChange={handleReminderMinutesChange} options={options.reminder}
          disabled={!remindersEnabled} variant="borderless" popupMatchSelectWidth={false} />
      ),
    },
    {
      key: 'test', color: '#8E8E93', icon: <NotificationOutlined />, label: t('calendar_test_notif'),
      control: (
        <button className="cs-pill" onClick={handleTestNotification} disabled={testingNotif}>
          {testingNotif ? <LoadingOutlined spin /> : <BellOutlined />}
          {t('calendar_test_notif_btn')}
        </button>
      ),
    },
  ];

  return (
    <PageShell route={OptionsRoute.CALENDAR} subtitle={t('calendar_page_desc')} width={PageWidth.WIDE}>
      <div className="calendar-sync-page">
        <div className="cs-layout">
          <section className="cs-meetings">
            <div className="cs-section-head">
              <h2>{t('calendar_upcoming_meetings')}</h2>
              <div className="cs-section-actions">
                {lastSync && (
                  <span className="cs-muted">
                    {t('calendar_last_sync').replace('{time}', new Date(lastSync).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}
                  </span>
                )}
                <button className="cs-pill" onClick={manualSync} disabled={syncing}>
                  {syncing ? <LoadingOutlined spin /> : <SyncOutlined />}
                  {syncing ? t('calendar_syncing') : t('calendar_sync_now')}
                </button>
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
                  {days.map(({ key, day, events: dayEvents, showMonth }) => {
                    const label = dayLabel(day);
                    return (
                      <div key={key} className="cs-day-group">
                        <div className={`cs-day${label.isToday ? ' is-today' : ''}`}>
                          <span className="cs-day__label">{label.label}</span>
                          <span className="cs-day__date">{label.date}</span>
                          {showMonth && <span className="cs-day__month">{label.month}</span>}
                        </div>
                        <div className="cs-day-events">
                          {dayEvents.map((event) => {
                            const link = meetLink(event);
                            const attendees = event.attendees?.length ?? 0;
                            const time = timeParts(event);
                            const live = isLive(event);
                            return (
                              <div key={event.id} className={`cs-event${live ? ' is-live' : ''}`}>
                                <div className="cs-event__time">
                                  <b>{time.start}</b>
                                  {time.end && <span>{time.end}</span>}
                                </div>
                                <span className="cs-event__bar" />
                                <div className="cs-event__main">
                                  {live && <span className="cs-badge">{t('meetings_in_progress')}</span>}
                                  <span className="cs-event__title">{event.summary ?? t('calendar_event_no_title')}</span>
                                  {attendees > 0 && <span className="cs-event__meta"><TeamOutlined /> {attendees}</span>}
                                  {event.location && (
                                    <span className="cs-event__meta cs-event__location"><EnvironmentOutlined /> {event.location}</span>
                                  )}
                                </div>
                                {link && (
                                  <a className="cs-pill cs-pill--accent" href={link} target="_blank" rel="noreferrer">
                                    <VideoCameraOutlined />
                                    {t('meetings_join_btn')}
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {events.length > MAX_LISTED_EVENTS && (
                    <div className="cs-more">{t('calendar_event_more').replace('{n}', String(events.length - MAX_LISTED_EVENTS))}</div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="cs-side">
            <div className="cs-section-head">
              <h2>{t('calendar_settings_group')}</h2>
            </div>
            <div className="cs-card cs-settings">
              {settingRows.map((row) => (
                <div key={row.key} className="cs-row">
                  <span className="cs-icon" style={{ background: row.color }}>{row.icon}</span>
                  <span className="cs-row__label">{row.label}</span>
                  {row.control}
                </div>
              ))}
            </div>
            <p className="cs-footnote">
              <SafetyCertificateOutlined />
              <span>
                {t('calendar_data_footnote')}
                {(events.length > 0 || lastSync) && (
                  <>
                    {' · '}
                    <button className="cs-link" onClick={clearEvents} disabled={syncing}>
                      {t('calendar_clear_events')}
                    </button>
                  </>
                )}
              </span>
            </p>
          </section>
      </div>
      </div>
    </PageShell>
  );
};

export default CalendarSync;
