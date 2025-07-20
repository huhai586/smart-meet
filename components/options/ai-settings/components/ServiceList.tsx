import React from 'react';
import { Typography, theme } from 'antd';
import { ServiceListItem, StatusBadge, ServiceIcon } from '~/components/options/ai-settings/components/StyledComponents';
import { getServiceDisplayName, getServiceIcon } from '~/components/options/ai-settings/utils/service-helpers';
import { SUPPORTED_SERVICES, type AIServiceType } from '~/components/options/ai-settings/utils/constants';

const { Text } = Typography;
const { useToken } = theme;

interface ServiceListProps {
  configuredServices: Record<string, { apiKey: string }>;
  activeService: string;
  currentEditService: string;
  onServiceChange: (service: AIServiceType) => void;
  t: (key: string) => string;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  configuredServices,
  activeService,
  currentEditService,
  onServiceChange,
  t
}) => {
  const { token } = useToken();

  return (
    <div style={{ 
      width: '250px', 
      borderRight: '1px solid #f0f0f0', 
      padding: '20px', 
      overflowY: 'auto',
      height: "100%"
    }}>
      <Text strong style={{ marginBottom: '15px', display: 'block', fontSize: '16px' }}>
        {t('service_list')}
      </Text>
      
      {SUPPORTED_SERVICES.map(service => {
        const isConfigured = !!configuredServices[service]?.apiKey;
        const isActive = activeService === service;
        
        return (
          <ServiceListItem 
            key={service}
            active={isActive}
            configured={isConfigured}
            selected={currentEditService === service}
            onClick={() => onServiceChange(service)}
            className="service-list-item"
          >
            <ServiceIcon configured={isConfigured}>
              {getServiceIcon(service)}
            </ServiceIcon>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {getServiceDisplayName(service)}
              </div>
              <StatusBadge isSuccess={isConfigured}>
                {isConfigured ? t('configured') : t('not_configured')}
              </StatusBadge>
            </div>
            {isActive && (
              <div style={{ 
                marginLeft: '5px', 
                color: token.colorPrimary,
                fontSize: '18px'
              }}>
                ★
              </div>
            )}
          </ServiceListItem>
        );
      })}
    </div>
  );
};
