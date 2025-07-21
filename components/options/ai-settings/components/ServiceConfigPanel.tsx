import React from 'react';
import { Typography, theme } from 'antd';
import { ActiveServiceBadge, ConfigButton, DefaultServiceButton } from '~/components/options/ai-settings/components/StyledComponents';
import { getServiceDisplayName, getServiceIcon } from '~/components/options/ai-settings/utils/service-helpers';
import { ApiKeyConfig } from '~/components/options/ai-settings/components/ApiKeyConfig';
import { ModelSelector } from '~/components/options/ai-settings/components/ModelSelector';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';
import { type AIsConfig, type AIServiceConfig } from '~/utils/getAI';

const { Title, Text } = Typography;
const { useToken } = theme;

interface ServiceConfigPanelProps {
  service: AIServiceType;
  aisConfig: AIsConfig;
  currentAI: AIServiceConfig;
  onApiKeyChange: (value: string) => void;
  onModelNameChange: (value: string) => void;
  onSaveService: () => void;
  onSetAsDefault: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const ServiceConfigPanel: React.FC<ServiceConfigPanelProps> = ({
  service,
  aisConfig,
  currentAI,
  onApiKeyChange,
  onModelNameChange,
  onSaveService,
  onSetAsDefault,
  t
}) => {
  const { token } = useToken();

  // Check if current service is configured
  const isServiceConfigured = !!currentAI.apiKey;
  const isActiveService = aisConfig.active === service;

  return (
    <div className="service-config-panel">
      <div className="service-config-panel__header">
        <div 
          className="service-config-panel__icon"
          style={{ background: `${token.colorPrimary}10` }}
        >
          {getServiceIcon(service)}
        </div>
        <div>
          <Title level={4} className="service-config-panel__title">
            {t('configure_service', { service: getServiceDisplayName(service) })}
          </Title>
          <Text type="secondary" className="service-config-panel__subtitle">
            {isServiceConfigured 
              ? t('service_configured_and_ready') 
              : t('service_needs_configuration')}
          </Text>
        </div>
        {isServiceConfigured && isActiveService && (
          <ActiveServiceBadge className="service-config-panel__active-badge">
            <span>★</span>
            {t('currently_default_service')}
          </ActiveServiceBadge>
        )}
      </div>

      {/* 服务配置区域 */}
      <div className="service-config-panel__config-area">
        <ApiKeyConfig
          service={service}
          apiKey={currentAI.apiKey}
          onApiKeyChange={onApiKeyChange}
          t={t}
        />

        <ModelSelector
          service={service}
          apiKey={currentAI.apiKey}
          modelName={currentAI.modelName}
          onModelNameChange={onModelNameChange}
          t={t}
        />

        <div className="service-config-panel__default-checkbox">
          <input 
            type="checkbox" 
            id="setAsDefault"
            checked={isActiveService}
            onChange={(e) => {
              if (e.target.checked && currentAI.apiKey) {
                onSetAsDefault();
              }
            }}
          />
          <label htmlFor="setAsDefault">
            {t('set_as_default_service')}
          </label>
        </div>

        <div className="service-config-panel__buttons">
          <ConfigButton
            type="primary"
            size="large"
            onClick={onSaveService}
            disabled={!currentAI.apiKey}
            className="config-button"
          >
            {t('save_configuration')}
          </ConfigButton>

          {isServiceConfigured && !isActiveService && (
            <DefaultServiceButton
              size="large"
              onClick={onSetAsDefault}
              className="default-service-button"
            >
              {t('set_as_default')}
            </DefaultServiceButton>
          )}
        </div>
      </div>
    </div>
  );
};
