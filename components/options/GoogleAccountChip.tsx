import React, { useState } from 'react';
import { Avatar, Dropdown, type MenuProps } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import useI18n from '~utils/i18n';
import useGoogleAccount from '~hooks/useGoogleAccount';
import { signInGoogle, signOutGoogle } from '~utils/google-account';

/** Who is signed in to Google, at the top of every settings page; Calendar and Drive share this one sign-in. */
const GoogleAccountChip: React.FC = () => {
  const { t } = useI18n();
  const { loading, user } = useGoogleAccount();
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  if (!user) {
    const signIn = async () => {
      setBusy(true);
      try {
        await signInGoogle();
      } finally {
        setBusy(false);
      }
    };
    return (
      <button className="header-account header-account--out" onClick={signIn} disabled={busy}>
        <UserOutlined />
        <span>{t('google_account_signed_out')}</span>
        <strong>{t('popup_sign_in')}</strong>
      </button>
    );
  }

  const items: MenuProps['items'] = [
    { key: 'sign-out', icon: <LogoutOutlined />, label: t('google_account_sign_out'), danger: true, onClick: () => signOutGoogle() },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button className="header-account" title={user.email}>
        <Avatar src={user.picture} size={22}>
          {user.name?.charAt(0).toUpperCase()}
        </Avatar>
        <span className="header-account__email">{user.email}</span>
      </button>
    </Dropdown>
  );
};

export default GoogleAccountChip;
