import React from 'react';
import {
  ApiOutlined,
  UserOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  KeyOutlined,
  CalendarOutlined,
  SettingOutlined,
  TranslationOutlined,
  GlobalOutlined,
  DeleteOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import '../styles/sidebar.scss';
import useI18n from '../utils/i18n';

interface SidebarProps {
  activeKey: string;
  onChange: (key: string) => void;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  route: string;
}

// 路由映射表（与options.tsx中保持一致）
const KEY_TO_ROUTE = {
  '1': 'ai-settings',
  '2': 'google-drive',
  '3': 'calendar',
  '4': 'translation',
  '5': 'ui-language',
  '6': 'extension',
  '7': 'clear-captions'
};

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onChange }) => {
  const { t } = useI18n();

  const menuItems: MenuItem[] = [
    {
      key: '1',
      icon: <ApiOutlined />,
      label: t('ai_settings'),
      route: 'ai-settings'
    },
    {
      key: '2',
      icon: <CloudSyncOutlined />,
      label: t('google_drive_integration'),
      route: 'google-drive'
    },
    {
      key: '3',
      icon: <CalendarOutlined />,
      label: t('calendar_view'),
      route: 'calendar'
    },
    {
      key: '4',
      icon: <TranslationOutlined />,
      label: t('translation_language'),
      route: 'translation'
    },
    {
      key: '5',
      icon: <GlobalOutlined />,
      label: t('ui_language'),
      route: 'ui-language'
    },
    {
      key: '6',
      icon: <RollbackOutlined />,
      label: t('extension'),
      route: 'extension'
    },
    {
      key: '7',
      icon: <DeleteOutlined />,
      label: t('clear_captions'),
      route: 'clear-captions'
    }
  ];

  // 处理菜单项点击
  const handleMenuItemClick = (key: string, route: string) => {
    onChange(key);
    // 更新URL哈希（可以由父组件处理，但这里为了兼容性也添加）
    window.location.hash = route;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo">
          <div className="logo-icon">
            <SettingOutlined style={{ fontSize: '24px', color: '#fff' }} />
          </div>
          <h1>Google Meet Caption Pro</h1>
        </div>
        <div className="sidebar-description">
          {t('configure_assistant')}
        </div>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => (
          <a
            key={item.key}
            className={`menu-item ${activeKey === item.key ? 'active' : ''}`}
            onClick={() => handleMenuItemClick(item.key, item.route)}
            href={`#${item.route}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </a>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="version">Version 1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;
