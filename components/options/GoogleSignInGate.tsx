import React, { useState } from 'react';
import { Spin } from 'antd';
import { CheckCircleFilled, GoogleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import { useGoogleAuth } from '~contexts/GoogleAuthContext';

const Gate = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 44px 24px 56px;
  border-radius: 16px;
  background: var(--opt-bg-card);
  border: 0.5px solid var(--opt-border-subtle);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const GateIcon = styled.div`
  width: 72px;
  height: 72px;
  margin-bottom: 24px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(175deg, #5BA4F9 0%, #4285F4 100%);
  box-shadow: 0 4px 16px rgba(66, 133, 244, 0.28);
  color: #fff;
  font-size: 32px;
`;

const GateTitle = styled.h2`
  margin: 0 0 6px;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--opt-text-primary);
`;

const GateDesc = styled.p`
  margin: 0 0 22px;
  max-width: 340px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--opt-text-secondary);
`;

const Benefits = styled.ul`
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
  text-align: left;

  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 4px 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--opt-text-primary);
  }

  .anticon {
    margin-top: 4px;
    font-size: 14px;
    color: #16a34a;
  }
`;

const SignInButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  min-width: 240px;
  padding: 0 28px;
  border: none;
  border-radius: 14px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #007AFF;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease, opacity 0.18s ease;

  &:hover:not(:disabled) {
    background: #0071E3;
    transform: scale(1.015);
  }

  &:active:not(:disabled) {
    transform: scale(0.985);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Hint = styled.p`
  margin: 14px 0 0;
  max-width: 320px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--opt-text-secondary);
`;

/** What the Calendar and Drive pages show until the user signs in: both use the same Google account. */
const GoogleSignInGate: React.FC = () => {
  const { t } = useI18n();
  const { login } = useGoogleAuth();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      await login();
    } finally {
      setBusy(false);
    }
  };

  const benefits = ['google_gate_benefit_calendar', 'google_gate_benefit_backup', 'google_gate_benefit_devices'];

  return (
    <Gate>
      <GateIcon>
        <GoogleOutlined />
      </GateIcon>
      <GateTitle>{t('google_gate_title')}</GateTitle>
      <GateDesc>{t('google_gate_desc')}</GateDesc>
      <Benefits>
        {benefits.map((key) => (
          <li key={key}>
            <CheckCircleFilled />
            <span>{t(key)}</span>
          </li>
        ))}
      </Benefits>
      <SignInButton onClick={signIn} disabled={busy}>
        {busy ? <Spin size="small" style={{ filter: 'brightness(0) invert(1)' }} /> : <GoogleOutlined />}
        {busy ? t('logging_in') : t('login_with_google')}
      </SignInButton>
      <Hint>{t('google_account_chrome_hint')}</Hint>
    </Gate>
  );
};

export default GoogleSignInGate;
