import React, { useState, useCallback, useEffect } from 'react';
import { SyncOutlined as ReloadIcon } from '@ant-design/icons';
import '~styles/sidebar.scss';
import useI18n from '~utils/i18n';
import { GROUP_TITLES, OPTIONS_PAGES, OptionsGroup } from './pages';

interface SidebarProps {
  /** The route of the page that is open. */
  activeKey: string;
  devMode: boolean;
  onDevUnlock: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeKey, devMode, onDevUnlock }) => {
  const { t } = useI18n();
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'latest' | 'available'>('latest');

  useEffect(() => {
    setUpdateStatus('checking');
    chrome.runtime.requestUpdateCheck((status) => {
      if (status === 'update_available') {
        setUpdateStatus('available');
      } else {
        // 'no_update' or 'throttled' (dev mode) — both mean no update needed
        setUpdateStatus('latest');
      }
    });
  }, []);

  const handleTitleClick = useCallback(() => {
    if (devMode) return;
    const next = tapCount + 1;
    setTapCount(next);

    if (tapTimer) clearTimeout(tapTimer);
    const timer = setTimeout(() => setTapCount(0), 2000);
    setTapTimer(timer);

    if (next >= 7) {
      setTapCount(0);
      if (tapTimer) clearTimeout(tapTimer);
      onDevUnlock();
    }
  }, [tapCount, tapTimer, devMode, onDevUnlock]);

  const groups = Object.values(OptionsGroup)
    .filter((group) => group !== OptionsGroup.DEVELOPER || devMode)
    .map((group) => ({ group, pages: OPTIONS_PAGES.filter((page) => page.group === group) }));

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="sidebar">
      <div className="sidebar-dev-tap"
        onClick={handleTitleClick}
        title={devMode ? 'Developer mode active' : undefined}
      />

      <div className="sidebar-menu">
        {groups.map(({ group, pages }) => (
          <div key={group} className="menu-category">
            <div className="category-title">{GROUP_TITLES[group].key ? t(GROUP_TITLES[group].key) : GROUP_TITLES[group].text}</div>
            {pages.map((page) => (
              <a
                key={page.route}
                data-key={page.route}
                className={`menu-item ${activeKey === page.route ? 'active' : ''}`}
                href={`#${page.route}`}
              >
                {page.brandIcon ? (
                  <span className="icon icon--brand"><img src={page.brandIcon} alt="" /></span>
                ) : (
                  <span className="icon" style={{ background: page.color }}>{page.icon}</span>
                )}
                <span className="label">{page.labelKey ? t(page.labelKey) : page.label}</span>
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="version-info">
          <span className="version-number">{t('version_label') || 'v'}{version}</span>
          <span className={`version-status${updateStatus === 'available' ? ' version-status--update' : ''}`}>
            {updateStatus === 'checking' ? (
              <>
                <ReloadIcon spin style={{ fontSize: 10 }} />
                {t('version_checking')}
              </>
            ) : updateStatus === 'available' ? (
              <>
                <span className="status-dot status-dot--update" />
                <a
                  href="https://chromewebstore.google.com/detail/google-meet-caption-pro/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#FF9500', textDecoration: 'none' }}
                >
                  {t('version_update_available')}
                </a>
              </>
            ) : (
              <>
                <span className="status-dot" />
                {t('version_latest')}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
