import React from 'react';
import { Typography, theme } from 'antd';
import { ActiveServiceBadge, ConfigButton, DefaultServiceButton } from '~/components/options/ai-settings/components/StyledComponents';
import { getServiceDisplayName, getServiceIcon } from '~/components/options/ai-settings/utils/service-helpers';
import { ApiKeyConfig } from '~/components/options/ai-settings/components/ApiKeyConfig';
import { ModelSelector } from '~/components/options/ai-settings/components/ModelSelector';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';

const { Title, Text } = Typography;
const { useToken } = theme;

interface ServiceConfigPanelProps {
  service: AIServiceType;
  configuredServices: Record<string, { apiKey: string; modelName: string; }>;
  activeService: string;
  apiKey: string;
  modelName: string;
  onApiKeyChange: (value: string) => void;
  onModelNameChange: (value: string) => void;
  onSaveService: () => void;
  onSetAsDefault: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const ServiceConfigPanel: React.FC<ServiceConfigPanelProps> = ({
  service,
  configuredServices,
  activeService,
  apiKey,
  modelName,
  onApiKeyChange,
  onModelNameChange,
  onSaveService,
  onSetAsDefault,
  t
}) => {
  const { token } = useToken();

  return (
    <div style={{ 
      flex: 1, 
      padding: '30px 40px', 
      overflowY: 'auto',
      height: "100%"
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ 
          fontSize: '36px', 
          marginRight: '15px',
          width: '60px',
          height: '60px',
          background: `${token.colorPrimary}10`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {getServiceIcon(service)}
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
            {t('configure_service', { service: getServiceDisplayName(service) })}
          </Title>
          <Text type="secondary" style={{ fontSize: '15px' }}>
            {!!configuredServices[service]?.apiKey 
              ? t('service_configured_and_ready') 
              : t('service_needs_configuration')}
          </Text>
        </div>
        {!!configuredServices[service]?.apiKey && activeService === service && (
          <ActiveServiceBadge>
            <span style={{ marginRight: '5px' }}>★</span>
            {t('currently_default_service')}
          </ActiveServiceBadge>
        )}
      </div>

      {/* 服务配置区域 */}
      <div style={{ maxWidth: "680px" }}>
        <ApiKeyConfig
          service={service}
          apiKey={apiKey}
          onApiKeyChange={onApiKeyChange}
          t={t}
        />

        <ModelSelector
          service={service}
          apiKey={apiKey}
          modelName={modelName}
          onModelNameChange={onModelNameChange}
          t={t}
        />

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '25px',
          padding: '12px 16px',
          background: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <input 
            type="checkbox" 
            id="setAsDefault"
            checked={activeService === service}
            onChange={(e) => {
              if (e.target.checked && apiKey) {
                onSetAsDefault();
              }
            }}
            style={{ 
              marginRight: '10px',
              width: '18px',
              height: '18px'
            }}
            disabled={!apiKey}
          />
          <label 
            htmlFor="setAsDefault" 
            style={{ 
              cursor: apiKey ? 'pointer' : 'not-allowed',
              opacity: apiKey ? 1 : 0.6
            }}
          >
            {t('set_as_default_service')}
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <ConfigButton
            type="primary"
            onClick={onSaveService}
            disabled={!apiKey}
          >
            {t('save_service_config')}
          </ConfigButton>
        </div>

        {!!configuredServices[service]?.apiKey && activeService !== service && (
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <DefaultServiceButton
              type="default"
              onClick={onSetAsDefault}
            >
              {t('set_as_default_service')}
            </DefaultServiceButton>
          </div>
        )}
      </div>
    </div>
  );
};
