import React from 'react';
import { Input, Typography, theme } from 'antd';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';

const { Text } = Typography;
const { useToken } = theme;

interface ProxyUrlConfigProps {
  service: AIServiceType;
  baseUrl?: string;
  onBaseUrlChange: (value: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const ProxyUrlConfig: React.FC<ProxyUrlConfigProps> = ({
  service,
  baseUrl,
  onBaseUrlChange,
  t
}) => {
  const { token } = useToken();

  // 只对 Gemini 服务显示此配置
  if (service !== 'gemini') {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Text strong style={{ fontSize: '15px' }}>
          {t('proxy_url_label')}
        </Text>
        <Text type="secondary" style={{ marginLeft: '8px', fontSize: '13px' }}>
          ({t('optional')})
        </Text>
      </div>
      <Input
        placeholder={t('proxy_url_placeholder')}
        value={baseUrl || ''}
        onChange={(e) => onBaseUrlChange(e.target.value)}
        size="large"
        style={{
          borderRadius: '8px',
          fontSize: '15px'
        }}
      />
      <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginTop: '6px' }}>
        {t('proxy_url_hint')}
      </Text>
    </div>
  );
};
