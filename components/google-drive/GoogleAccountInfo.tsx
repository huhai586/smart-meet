import React from 'react';
import { Avatar, Popover, Divider, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import styled from 'styled-components';

const { Text } = Typography;

const AvatarTrigger = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;

  &:hover {
    background: rgba(60, 60, 67, 0.08);
  }
`;

const PopoverBody = styled.div`
  min-width: 210px;
  margin: -12px -16px;
`;

const UserInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
`;

const SignOutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 0;
  font-size: 14px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  color: #FF3B30;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 59, 48, 0.06);
  }
`;

const GoogleAccountInfo: React.FC = () => {
  const { isAuthenticated, user, logout } = useGoogleAuth();

  if (!isAuthenticated || !user) return null;

  const popoverContent = (
    <PopoverBody>
      <UserInfoRow>
        <Avatar src={user.picture} size={38}>
          {!user.picture && user.name.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '1.3',
            color: '#1C1C1E',
            fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {user.name}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text>
        </div>
      </UserInfoRow>
      <Divider style={{ margin: 0, borderColor: 'rgba(60, 60, 67, 0.12)' }} />
      <div style={{ padding: '4px 0' }}>
        <SignOutBtn onClick={() => logout()}>
          <LogoutOutlined />
          Sign out
        </SignOutBtn>
      </div>
    </PopoverBody>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      placement="bottomRight"
      overlayInnerStyle={{ padding: '12px 16px', borderRadius: 12, overflow: 'hidden' }}
    >
      <AvatarTrigger>
        <Avatar src={user.picture} size={26}>
          {!user.picture && user.name.charAt(0).toUpperCase()}
        </Avatar>
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#1C1C1E',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.name.split(' ')[0]}
        </span>
      </AvatarTrigger>
    </Popover>
  );
};

export default GoogleAccountInfo;