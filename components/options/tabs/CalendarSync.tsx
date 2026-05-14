import React, { useState, useEffect } from 'react';
import { Switch, Select, Typography, Spin, Button, message } from 'antd';
import {
  GoogleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  BellOutlined,
} from '@ant-design/icons';
import useI18n from '~utils/i18n';
import useGoogleCalendar from '~hooks/useGoogleCalendar';
import type { CalendarEvent } from '~utils/google-calendar-service';
import { getConfigValue, setConfigValue } from '~utils/appConfig';
import '~styles/calendar-sync.scss';

const { Text } = Typography;

const CalendarSync: React.FC = () => {
  const { t } = useI18n();
  const {
    isConnected,
    user,
    loading,
    connecting,
    settings,
    lastSync,
    syncError,
    syncStatus,
    events,
    connect,
    disconnect,
    updateSettings,
    manualSync,
  } = useGoogleCalendar();

  const [showTip, setShowTip] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [testingNotif, setTestingNotif] = useState(false);

  // Load reminder settings on mount
  useEffect(() => {
    Promise.all([
      getConfigValue('meetingRemindersEnabled'),
      getConfigValue('meetingReminderMinutes'),
    ]).then(([enabled, minutes]) => {
      setRemindersEnabled(enabled as boolean);
      setReminderMinutes(minutes as number);
    });
  }, []);

  const handleRemindersToggle = async (checked: boolean) => {
    setRemindersEnabled(checked);
    await setConfigValue('meetingRemindersEnabled', checked);
    chrome.runtime.sendMessage({ type: 'MEETING_REMINDERS_RESCHEDULE' }).catch(() => {});
  };

  const handleReminderMinutesChange = async (val: number) => {
    setReminderMinutes(val);
    await setConfigValue('meetingReminderMinutes', val);
    chrome.runtime.sendMessage({ type: 'MEETING_REMINDERS_RESCHEDULE' }).catch(() => {});
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      await chrome.runtime.sendMessage({ type: 'MEETING_REMINDER_TEST' });
      message.success('测试通知已发送，请查看系统通知');
    } catch {
      message.error('发送失败，请确认已授予通知权限');
    } finally {
      setTestingNotif(false);
    }
  };

  const frequencyOptions = [
    { value: '15min', label: t('calendar_frequency_15min') },
    { value: '30min', label: t('calendar_frequency_30min') },
    { value: '1hour', label: t('calendar_frequency_1hour') },
    { value: '2hours', label: t('calendar_frequency_2hours') },
  ];

  const rangeOptions = [
    { value: '7days', label: t('calendar_range_7days') },
    { value: '14days', label: t('calendar_range_14days') },
    { value: '30days', label: t('calendar_range_30days') },
    { value: '60days', label: t('calendar_range_60days') },
  ];

  const syncContentItems = [
    { key: 'title', label: t('calendar_content_title') },
    { key: 'time', label: t('calendar_content_time') },
    { key: 'link', label: t('calendar_content_link') },
    { key: 'attendees', label: t('calendar_content_attendees') },
    { key: 'location', label: t('calendar_content_location') },
  ];

  const statusDesc = isConnected && user
    ? user.email
    : t('calendar_not_connected_desc');

  const formatEventTime = (event: CalendarEvent): string => {
    const start = event.start?.dateTime ?? event.start?.date ?? '';
    if (!start) return '';
    const d = new Date(start);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getMeetLink = (event: CalendarEvent): string | null => {
    if (event.hangoutLink) return event.hangoutLink;
    const entry = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video');
    return entry?.uri ?? null;
  };

  return (
    <div className="calendar-sync-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('calendar_page_title')}</h1>
        <p className="page-desc">{t('calendar_page_desc')}</p>
      </div>

      {/* Connection Status Card */}
      <div className="connection-card">
        <h3 className="card-title">{t('calendar_connection_status')}</h3>

        <div className="connection-status">
          <div className="status-left">
            <div className="calendar-icon-wrapper">
              <img
                src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png"
                alt="Google Calendar"
                className="google-calendar-icon"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.innerHTML = '<span class="fallback-icon">31</span>';
                  }
                }}
              />
            </div>
            <div className="status-info">
              {loading ? (
                <Spin indicator={<LoadingOutlined spin />} size="small" />
              ) : (
                <>
                  <span className="status-label">
                    {isConnected ? t('calendar_connected') : t('calendar_not_connected')}
                  </span>
                  <span className="status-desc">{statusDesc}</span>
                </>
              )}
            </div>
          </div>

          <button
            className={`connect-button ${isConnected ? 'connected' : ''} ${connecting ? 'loading' : ''}`}
            onClick={isConnected ? disconnect : connect}
            disabled={loading || connecting}
          >
            {connecting ? (
              <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} size="small" />
            ) : (
              !isConnected && <GoogleOutlined />
            )}
            {connecting
              ? t('logging_in')
              : isConnected
                ? t('calendar_disconnect_button')
                : t('calendar_connect_button')}
          </button>
        </div>

        <div className="privacy-note">
          <SafetyCertificateOutlined className="privacy-icon" />
          <span>{t('calendar_privacy_note')}</span>
          <a className="learn-more" href="#" onClick={(e) => e.preventDefault()}>
            {t('calendar_learn_more')}
          </a>
        </div>
      </div>

      {/* Sync Settings Card */}
      <div className="settings-card">
        <h3 className="card-title">{t('calendar_sync_settings')}</h3>

        <div className="setting-item">
          <div className="setting-left">
            <SyncOutlined className="setting-icon" />
            <div className="setting-info">
              <span className="setting-label">{t('calendar_auto_sync')}</span>
              <span className="setting-desc">{t('calendar_auto_sync_desc')}</span>
            </div>
          </div>
          <Switch
            checked={settings.autoSync}
            onChange={(v) => updateSettings({ autoSync: v })}
          />
        </div>

        <div className="setting-item">
          <div className="setting-left">
            <ClockCircleOutlined className="setting-icon" />
            <div className="setting-info">
              <span className="setting-label">{t('calendar_sync_frequency')}</span>
              <span className="setting-desc">{t('calendar_sync_frequency_desc')}</span>
            </div>
          </div>
          <Select
            value={settings.syncFrequency}
            onChange={(v) => updateSettings({ syncFrequency: v })}
            options={frequencyOptions}
            className="setting-select"
            disabled={!settings.autoSync}
          />
        </div>

        <div className="setting-item">
          <div className="setting-left">
            <CalendarOutlined className="setting-icon" />
            <div className="setting-info">
              <span className="setting-label">{t('calendar_sync_range')}</span>
              <span className="setting-desc">{t('calendar_sync_range_desc')}</span>
            </div>
          </div>
          <Select
            value={settings.syncRange}
            onChange={(v) => updateSettings({ syncRange: v })}
            options={rangeOptions}
            className="setting-select"
            disabled={!settings.autoSync}
          />
        </div>
      </div>

      {/* Meeting Reminder Settings Card */}
      <div className="settings-card">
        <h3 className="card-title"><BellOutlined style={{ marginRight: 8 }} />会议提醒</h3>

        <div className="setting-item">
          <div className="setting-left">
            <BellOutlined className="setting-icon" />
            <div className="setting-info">
              <span className="setting-label">启用会议提醒</span>
              <span className="setting-desc">在会议开始前发送系统通知</span>
            </div>
          </div>
          <Switch checked={remindersEnabled} onChange={handleRemindersToggle} />
        </div>

        <div className="setting-item">
          <div className="setting-left">
            <ClockCircleOutlined className="setting-icon" />
            <div className="setting-info">
              <span className="setting-label">提前提醒时间</span>
              <span className="setting-desc">在会议开始前多少分钟发送通知</span>
            </div>
          </div>
          <Select
            value={reminderMinutes}
            onChange={handleReminderMinutesChange}
            className="setting-select"
            disabled={!remindersEnabled}
            options={[
              { value: 5,  label: '提前 5 分钟' },
              { value: 10, label: '提前 10 分钟' },
              { value: 15, label: '提前 15 分钟' },
              { value: 30, label: '提前 30 分钟' },
            ]}
          />
        </div>

        <div className="setting-item">
          <div className="setting-left">
            <BellOutlined className="setting-icon" />
            <div className="setting-info">
              <span className="setting-label">测试通知</span>
              <span className="setting-desc">立即发送一条测试提醒，验证通知是否正常工作</span>
            </div>
          </div>
          <Button
            icon={<BellOutlined />}
            loading={testingNotif}
            onClick={handleTestNotification}
          >
            发送测试通知
          </Button>
        </div>
      </div>

      {/* Sync Content Card */}
      <div className="sync-content-card">
        <h3 className="card-title">{t('calendar_sync_content')}</h3>

        <div className="content-layout">
          <div className="content-list">
            {syncContentItems.map(item => (
              <div key={item.key} className="content-item">
                <CheckCircleFilled className="check-icon" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="content-illustration">
            <div className="illustration-placeholder">
              <CalendarOutlined style={{ fontSize: 48, color: '#1a73e8', opacity: 0.3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Sync Card */}
      <div className="manual-sync-card">
        <div className="manual-sync-header">
          <div className="manual-sync-title-row">
            <h3 className="card-title" style={{ margin: 0 }}>同步状态</h3>
            {lastSync && (
              <span className="last-sync-time">
                上次同步：{new Date(lastSync).toLocaleString()}
              </span>
            )}
          </div>
          <button
            className={`manual-sync-btn ${syncStatus === 'syncing' ? 'syncing' : ''}`}
            onClick={manualSync}
            disabled={!isConnected || syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing'
              ? <Spin indicator={<LoadingOutlined spin />} size="small" />
              : <SyncOutlined />}
            {syncStatus === 'syncing' ? '同步中…' : '立即同步'}
          </button>
        </div>

        {/* Status Banner */}
        {syncStatus === 'success' && (
          <div className="sync-status-banner success">
            <CheckCircleOutlined />
            <span>同步成功，共获取 <strong>{events.length}</strong> 个日历事件</span>
          </div>
        )}
        {syncStatus === 'error' && (
          <div className="sync-status-banner error">
            <ExclamationCircleOutlined />
            <span>{syncError ?? '同步失败，请重试'}</span>
          </div>
        )}
        {syncStatus === 'syncing' && (
          <div className="sync-status-banner syncing">
            <LoadingOutlined spin />
            <span>正在从 Google Calendar 获取事件…</span>
          </div>
        )}

        {/* Event List */}
        {events.length > 0 && syncStatus !== 'syncing' && (
          <div className="event-list">
            {events.slice(0, 10).map(event => (
              <div key={event.id} className="event-item">
                <div className="event-time">{formatEventTime(event)}</div>
                <div className="event-body">
                  <div className="event-title">{event.summary ?? '(无标题)'}</div>
                  <div className="event-meta">
                    {event.attendees && event.attendees.length > 0 && (
                      <span className="event-meta-item">
                        <TeamOutlined /> {event.attendees.length} 位参与者
                      </span>
                    )}
                    {event.location && (
                      <span className="event-meta-item">
                        <EnvironmentOutlined /> {event.location}
                      </span>
                    )}
                    {getMeetLink(event) && (
                      <a
                        className="event-meta-item meet-link"
                        href={getMeetLink(event)!}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkOutlined /> Meet 链接
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {events.length > 10 && (
              <div className="event-more">还有 {events.length - 10} 个事件（已在 console 输出完整列表）</div>
            )}
          </div>
        )}

        {syncStatus === 'idle' && events.length === 0 && (
          <div className="sync-empty">
            <CalendarOutlined className="sync-empty-icon" />
            <span>点击「立即同步」获取即将到来的会议</span>
          </div>
        )}
      </div>

      {/* Tip Bar */}
      {showTip && (
        <div className="tip-bar">
          <div className="tip-content">
            <InfoCircleOutlined className="tip-icon" />
            <span>{t('calendar_tip')}</span>
          </div>
          <CloseOutlined className="tip-close" onClick={() => setShowTip(false)} />
        </div>
      )}
    </div>
  );
};

export default CalendarSync;
