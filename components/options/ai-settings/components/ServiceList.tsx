import React from 'react';
import { theme } from 'antd';
import { ServiceListItem, StatusBadge, ServiceIcon } from '~/components/options/ai-settings/components/StyledComponents';
import { getServiceDisplayName, getServiceIcon } from '~/components/options/ai-settings/utils/service-helpers';
import { SUPPORTED_SERVICES, type AIServiceType } from '~/components/options/ai-settings/utils/constants';
import { type AIsConfig } from '~/utils/getAI';

const { useToken } = theme;

interface ServiceListProps {
  aisConfig: AIsConfig;
  currentEditService: string;
  onAiTabChange: (service: AIServiceType) => void;
  t: (key: string) => string;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  aisConfig,
  currentEditService,
  onAiTabChange,
  t
}) => {
  const { token } = useToken();

  // Helper function to check if a service is configured
  const isServiceConfigured = (serviceName: AIServiceType): boolean => {
    const serviceConfig = aisConfig.data.find(config => config.aiName === serviceName);
    return !!(serviceConfig?.apiKey);
  };

  return (
    <div className="service-list">
      {SUPPORTED_SERVICES.map((service) => {
        const isConfigured = isServiceConfigured(service);
        const isActive = aisConfig.active === service;
        
        return (
          <ServiceListItem 
            key={service}
            active={isActive}
            configured={isConfigured}
            selected={currentEditService === service}
            onClick={() => onAiTabChange(service)}
            className="service-list-item"
          >
            <ServiceIcon configured={isConfigured}>
              {getServiceIcon(service)}
            </ServiceIcon>
            <div className="service-list__item-content">
              <div className="service-list__item-title">
                {getServiceDisplayName(service)}
              </div>
              <StatusBadge isSuccess={isConfigured}>
                {isConfigured ? t('configured') : t('not_configured')}
              </StatusBadge>
            </div>
            {isActive && (
              <div 
                className="service-list__item-active-indicator"
                style={{ color: token.colorPrimary }}
              >
                ★
              </div>
            )}
          </ServiceListItem>
        );
      })}
    </div>
  );
};
