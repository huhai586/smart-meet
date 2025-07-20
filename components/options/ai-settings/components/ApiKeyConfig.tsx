import React, { useState } from 'react';
import { Alert, Typography, Input, Button } from 'antd';
import { getApiKeySourceUrl } from '~/components/options/ai-settings/utils/service-helpers';
import { testAPIKey } from '~/components/options/ai-settings/utils/api-test-service';
import messageManager from '~/utils/message-manager';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';

const { Text } = Typography;

interface ApiKeyConfigProps {
  service: AIServiceType;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  t: (key: string, params?: any) => string;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({
  service,
  apiKey,
  onApiKeyChange,
  t
}) => {
  const [testingApiKey, setTestingApiKey] = useState(false);

  const handleTestApiKey = async () => {
    setTestingApiKey(true);
    
    try {
      const result = await testAPIKey(service, apiKey);
      
      if (result.isValid) {
        if (result.isWarning) {
          messageManager.warning(t(result.errorMessage || 'api_key_format_valid_but_not_tested'));
        } else {
          messageManager.success(t('api_key_valid'));
        }
      } else {
        messageManager.error(t(result.errorMessage || 'api_key_invalid'));
      }
    } finally {
      setTestingApiKey(false);
    }
  };

  return (
    <div>
      <Alert
        style={{ marginBottom: "25px", borderRadius: "10px" }}
        message={t('api_key_info')}
        description={
          <Text type="secondary">
            {t('api_key_source')}{' '}
            <a href={getApiKeySourceUrl(service)} target="_blank" rel="noopener noreferrer">
              {getApiKeySourceUrl(service)}
            </a>
          </Text>
        }
        type="info"
        showIcon
      />

      <div style={{ display: 'flex', marginBottom: "25px" }}>
        <Input.Password
          size="large"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={t('enter_api_key')}
          style={{ 
            height: '50px',
            borderRadius: '8px',
            flex: 1
          }}
        />
        <Button
          size="large"
          type="default"
          onClick={handleTestApiKey}
          loading={testingApiKey}
          disabled={!apiKey}
          style={{ 
            marginLeft: '10px',
            height: '50px',
            borderRadius: '8px'
          }}
        >
          {t('test_api_key')}
        </Button>
      </div>
    </div>
  );
};
