import React, { useEffect } from 'react';
import { Button, Avatar, Dropdown, Space, Spin, Typography, message } from 'antd';
import { GoogleOutlined, LogoutOutlined } from '@ant-design/icons';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import styled from 'styled-components';
import type { MenuProps } from 'antd';

const { Text } = Typography;

const AccountContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  min-width: 180px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const StyledAvatar = styled(Avatar)`
  cursor: pointer;
`;

const GoogleAccountInfo: React.FC = () => {
  const { isAuthenticated, user, loading, login, logout } = useGoogleAuth();

  // 组件挂载时记录认证状态
  useEffect(() => {
    console.log('GoogleAccountInfo mounted - Auth State:', { isAuthenticated, user, loading });
  }, [isAuthenticated, user, loading]);

  // 监控认证状态变化
  useEffect(() => {
    console.log('GoogleAccountInfo - Auth State changed:', { isAuthenticated, user, loading });
  }, [isAuthenticated, user, loading]);

  const handleLogin = async () => {
    try {
      console.log('Attempting to login...');
      const success = await login();
      console.log('Login result:', success);
      
      if (success) {
        message.success('Successfully logged in to Google');
      } else {
        message.error('Failed to login to Google');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Error during login process');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logout();
      message.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Error during logout process');
    }
  };

  if (loading) {
    return (
      <AccountContainer>
        <Space>
          <Spin size="small" />
          <Text>Loading account info...</Text>
        </Space>
      </AccountContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AccountContainer>
        <Button 
          type="primary" 
          icon={<GoogleOutlined />} 
          onClick={handleLogin}
          size="middle"
          style={{ width: '100%' }}
        >
          Login with Google
        </Button>
      </AccountContainer>
    );
  }

  const items: MenuProps['items'] = [
    {
      key: 'email',
      label: user.email,
      disabled: true,
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          Sign out
        </Space>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <AccountContainer>
      <Dropdown menu={{ items }} placement="bottomRight" arrow trigger={['click']}>
        <UserInfo>
          <StyledAvatar src={user.picture} size="small">
            {!user.picture && user.name.charAt(0).toUpperCase()}
          </StyledAvatar>
          <Text strong style={{ flex: 1 }}>{user.name}</Text>
        </UserInfo>
      </Dropdown>
    </AccountContainer>
  );
};

export default GoogleAccountInfo; 