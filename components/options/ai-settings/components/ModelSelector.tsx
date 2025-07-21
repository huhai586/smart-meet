import React, { useState, useEffect, useCallback } from "react"
import { Alert, Typography, Button, Spin, Select, Input } from 'antd';
import { getDefaultModelName } from '~/components/options/ai-settings/utils/service-helpers';
import { fetchAvailableModels } from '~/components/options/ai-settings/utils/model-service';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';

const { Text } = Typography;

interface ModelSelectorProps {
  service: AIServiceType;
  apiKey: string;
  modelName: string;
  onModelNameChange: (value: string) => void;
  t: (key: string) => string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  service,
  apiKey,
  modelName,
  onModelNameChange,
  t
}) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelLoadError, setModelLoadError] = useState('');

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    setModelLoadError('');
    
    try {
      const { models, error } = await fetchAvailableModels(service, apiKey);
      setAvailableModels(models);
      if (error) {
        setModelLoadError(error);
      }
    } finally {
      setLoadingModels(false);
    }
  }, [service, apiKey]);

  useEffect(() => {
    fetchModels();
  }, [service, apiKey, fetchModels]);

  return (
    <div style={{ marginBottom: "25px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ fontWeight: 500 }}>{t('model_name')}:</label>
        {loadingModels && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Spin size="small" style={{ marginRight: '8px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>{t('loading_models')}</Text>
          </div>
        )}
        {!loadingModels && apiKey && (
          <Button 
            type="link" 
            size="small" 
            onClick={fetchModels}
            style={{ padding: '0', height: 'auto' }}
          >
            {t('refresh_models')}
          </Button>
        )}
      </div>
      
      {modelLoadError && (
        <Alert
          message={modelLoadError}
          type="warning"
          showIcon
          style={{ 
            marginBottom: '15px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
          description={t('using_default_model_list')}
          action={
            <Button size="small" onClick={fetchModels} type="primary" ghost>
              {t('retry')}
            </Button>
          }
        />
      )}
      
      {/* 显示模型选择下拉框 */}
      {availableModels.length > 0 ? (
        <div>
          <Select
            id="model-selector"
            data-testid="model-selector"
            size="large"
            value={modelName || undefined}
            onChange={(value) => {
              console.log('Model selected:', value);
              onModelNameChange(value);
            }}
            placeholder={getDefaultModelName(service)}
            style={{ 
              width: '100%',
              height: '50px',
              borderRadius: '8px'
            }}
            allowClear
            showSearch
            optionFilterProp="children"
            loading={loadingModels}
            notFoundContent={loadingModels ? <Spin size="small" /> : t('no_models_found')}
            suffixIcon={loadingModels ? <Spin size="small" /> : <span style={{ fontSize: '16px' }}>⌄</span>}
          >
            {availableModels.map(model => (
              <Select.Option key={model} value={model}>
                {model}
              </Select.Option>
            ))}
          </Select>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '5px' }}>
            {availableModels.length} {t('models_available')}
          </Text>
        </div>
      ) : (
        <Input
          size="large"
          value={modelName}
          onChange={(e) => onModelNameChange(e.target.value)}
          placeholder={getDefaultModelName(service)}
          style={{ 
            height: '50px',
            borderRadius: '8px'
          }}
          disabled={loadingModels}
        />
      )}
      
      <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginTop: '8px' }}>
        {t('leave_empty_for_default')}
      </Text>
    </div>
  );
};
