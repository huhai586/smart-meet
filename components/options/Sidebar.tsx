import React from 'react';
import {
  SettingOutlined,
  LayoutOutlined,
  RobotOutlined,
  CalendarOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import '~styles/sidebar.scss';
import useI18n from '~utils/i18n';

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

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onChange }) => {
  const { t } = useI18n();

  const menuItems: MenuItem[] = [
    {
      key: '1',
      icon: <SettingOutlined />,
      label: t('tab_general'),
      route: 'general',
    },
    {
      key: '2',
      icon: <LayoutOutlined />,
      label: t('tab_interface'),
      route: 'interface',
    },
    {
      key: '3',
      icon: <RobotOutlined />,
      label: t('tab_ai_translation'),
      route: 'ai-translation',
    },
    {
      key: '4',
      icon: <CalendarOutlined />,
      label: t('tab_history'),
      route: 'history',
    },
    {
      key: '5',
      icon: <CloudOutlined />,
      label: t('tab_cloud_sync'),
      route: 'cloud-sync',
    },
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
        <div className="version">Version {chrome.runtime.getManifest().version}</div>
      </div>
    </div>
  );
};

export default Sidebar;
