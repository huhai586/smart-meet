import React from 'react';
import { 
  ApiOutlined, 
  UserOutlined, 
  CloudSyncOutlined, 
  DatabaseOutlined,
  KeyOutlined,
  CalendarOutlined,
  SettingOutlined
} from '@ant-design/icons';
import '../styles/sidebar.scss';

interface SidebarProps {
  activeKey: string;
  onChange: (key: string) => void;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onChange }) => {
  const menuItems: MenuItem[] = [
    {
      key: '1',
      icon: <ApiOutlined />,
      label: 'AI Settings'
    },
    {
      key: '2',
      icon: <CloudSyncOutlined />,
      label: 'Google Drive Sync'
    },
    {
      key: '3',
      icon: <CalendarOutlined />,
      label: 'Calendar View'
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo">
          <div className="logo-icon">
            <SettingOutlined style={{ fontSize: '24px', color: '#fff' }} />
          </div>
          <h1>Smart Meet</h1>
        </div>
        <div className="sidebar-description">
          Configure your meeting assistant
        </div>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => (
          <div 
            key={item.key}
            className={`menu-item ${activeKey === item.key ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="version">Version 1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar; 