import React, { useState, useCallback } from 'react';
import {
  SettingOutlined,
  RobotOutlined,
  CalendarOutlined,
  CloudOutlined,
  CodeOutlined,
  FontSizeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import '~styles/sidebar.scss';
import useI18n from '~utils/i18n';

interface SidebarProps {
  activeKey: string;
  onChange: (key: string) => void;
  devMode: boolean;
  onDevUnlock: () => void;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  route: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onChange, devMode, onDevUnlock }) => {
  const { t } = useI18n();
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  const menuCategories: MenuCategory[] = [
    {
      title: t('sidebar_category_general'),
      items: [
        {
          key: '1',
          icon: <SettingOutlined />,
          label: t('tab_general'),
          route: 'general',
        },
        {
          key: '3',
          icon: <RobotOutlined />,
          label: t('tab_ai_models_nav'),
          route: 'ai-translation',
        },
        {
          key: '2',
          icon: <FontSizeOutlined />,
          label: t('tab_captions_translation'),
          route: 'interface',
        },
      ],
    },
    {
      title: t('sidebar_category_integration'),
      items: [
        {
          key: 'calendar',
          icon: <CalendarOutlined />,
          label: t('tab_calendar'),
          route: 'calendar',
        },
        {
          key: '4',
          icon: <SyncOutlined />,
          label: t('tab_data_sync'),
          route: 'history',
        },
        {
          key: '5',
          icon: <CloudOutlined />,
          label: t('tab_google_drive'),
          route: 'cloud-sync',
        },
      ],
    },
    ...(devMode ? [{
      title: 'Dev',
      items: [{
        key: 'dev',
        icon: <CodeOutlined />,
        label: 'Developer',
        route: 'developer',
      }],
    }] : []),
  ];

  const handleMenuItemClick = (key: string, route: string) => {
    onChange(key);
    window.location.hash = route;
  };

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="sidebar">
      <div className="sidebar-dev-tap"
        onClick={handleTitleClick}
        title={devMode ? 'Developer mode active' : undefined}
      />

      <div className="sidebar-menu">
        {menuCategories.map((category, idx) => (
          <div key={idx} className="menu-category">
            <div className="category-title">{category.title}</div>
            {category.items.map(item => (
              <a
                key={item.key}
                data-key={item.key}
                className={`menu-item ${activeKey === item.key ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(item.key, item.route)}
                href={`#${item.route}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="version-info">
          <span className="version-number">版本 {version}</span>
          <span className="version-status">
            <span className="status-dot" />
            {t('version_latest')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
