/**
 * ProviderConfigPanel - 右侧 Provider 配置面板
 * 显示选中 provider 的配置表单（API Key、Model、Base URL 等）
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Select, Button, Switch, Tooltip, message } from 'antd';
import { LinkOutlined, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { providerRegistry, type ProviderDefinition } from '~/utils/ai/provider-registry';
import ProviderIcon from '~/components/common/ProviderIcon';
import { fetchAvailableModels, testConnection, type ModelConfig } from '~/utils/ai/model-factory';
import type { AIServiceConfig, AIsConfig } from '~/utils/getAI';

interface ProviderConfigPanelProps {
  providerId: string;
  aisConfig: AIsConfig;
  onSave: (config: AIServiceConfig) => void;
  onSetActive: (providerId: string) => void;
  onRemove: (providerId: string) => void;
  t: (key: string) => string;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

const ProviderConfigPanel: React.FC<ProviderConfigPanelProps> = ({
  providerId,
  aisConfig,
  onSave,
  onSetActive,
  onRemove,
  t,
}) => {
  const provider = useMemo(() => providerRegistry.getById(providerId), [providerId]);

  // Local form state
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsFromCache, setModelsFromCache] = useState(false);
  const [modelsFetching, setModelsFetching] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');

  // provider 切换时：加载已保存的配置，并设置预定义模型作为初始列表
  useEffect(() => {
    if (!provider) return;

    const existing = aisConfig.data.find(d => d.aiName === providerId);
    const savedKey = existing?.apiKey || '';
    setApiKey(savedKey);
    setModelName(existing?.modelName || provider.defaultModel);
    setBaseUrl(existing?.baseUrl || '');
    setTestStatus('idle');
    setTestError('');
    setAvailableModels(provider.models.length > 0 ? [...provider.models] : [provider.defaultModel]);
    setModelsFromCache(false);
    setModelsFetching(false);

    // 有 API Key 时自动拉取一次（走缓存）
    if (savedKey || !provider.requiresApiKey) {
      const config: ModelConfig = { apiKey: savedKey, baseURL: existing?.baseUrl || undefined };
      setModelsFetching(true);
      fetchAvailableModels(providerId, config, { forceRefresh: false })
        .then(result => {
          if (result.models.length > 0) {
            setAvailableModels(result.models);
            setModelsFromCache(result.fromCache ?? false);
          }
        })
        .catch(console.error)
        .finally(() => setModelsFetching(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  // 手动刷新：强制绕过缓存重新请求
  const handleRefreshModels = useCallback(async () => {
    if (!provider || modelsFetching) return;
    setModelsFetching(true);
    try {
      const config: ModelConfig = { apiKey, baseURL: baseUrl || undefined };
      const result = await fetchAvailableModels(providerId, config, { forceRefresh: true });
      if (result.error) {
        void message.error(result.error);
      }
      if (result.models.length > 0) {
        setAvailableModels(result.models);
        setModelsFromCache(false);
        setModelName(prev => result.models.includes(prev) ? prev : result.models[0]);
      }
    } catch (err) {
      console.error('Failed to refresh models:', err);
      const msg = err instanceof Error ? err.message : String(err);
      void message.error(msg);
    } finally {
      setModelsFetching(false);
    }
  }, [providerId, apiKey, baseUrl, provider, modelsFetching]);

  const isActive = aisConfig.active === providerId;
  const isConfigured = aisConfig.data.some(d => d.aiName === providerId && d.apiKey);

  const handleTest = useCallback(async () => {
    setTestStatus('loading');
    const config: ModelConfig = { apiKey, baseURL: baseUrl || undefined, modelName };
    const result = await testConnection(providerId, config);
    if (result.success) {
      setTestStatus('success');
      setTestError('');
    } else {
      setTestStatus('error');
      setTestError(result.error || 'Connection failed');
    }
  }, [providerId, apiKey, baseUrl, modelName]);

  const handleSave = useCallback(() => {
    onSave({
      apiKey,
      modelName,
      aiName: providerId,
      baseUrl: baseUrl || undefined,
    });
  }, [apiKey, modelName, providerId, baseUrl, onSave]);

  if (!provider) {
    return (
      <div className="provider-config">
        <div className="provider-config__empty">
          <div className="provider-config__empty-icon"><ProviderIcon providerId="" size={40} /></div>
          <div className="provider-config__empty-text">
            {t('select_provider_hint') || 'Select a provider to configure'}
          </div>
          <div className="provider-config__empty-hint">
            {t('select_provider_desc') || 'Choose from the list on the left'}
          </div>
        </div>
      </div>
    );
  }

  const modelOptions = availableModels.map(m => ({ label: m, value: m }));

  return (
    <div className="provider-config">
      {/* Header */}
      <div className="provider-config__header">
        <div className="provider-config__icon"><ProviderIcon providerId={provider.id} size={32} /></div>
        <div className="provider-config__title-area">
          <h2 className="provider-config__title">{provider.name}</h2>
          <div className="provider-config__subtitle">
            {provider.nameZh && `${provider.nameZh} · `}
            {provider.type === 'ollama' ? 'Local Model' : 'Cloud API'}
          </div>
        </div>
      </div>

      {/* Active Toggle */}
      <div className="provider-config__active-toggle">
        <div>
          <div className="provider-config__active-toggle-label">
            {t('set_as_default') || 'Set as default service'}
          </div>
          <div className="provider-config__active-toggle-desc">
            {t('default_service_desc') || 'Use this provider for all AI features'}
          </div>
        </div>
        <Switch
          checked={isActive}
          onChange={(checked) => {
            if (checked) onSetActive(providerId);
          }}
          disabled={!isConfigured && !apiKey}
        />
      </div>

      {/* Configuration Card */}
      <div className="provider-config__section">
        <div className="provider-config__section-title">
          {t('configuration') || 'Configuration'}
        </div>
        <div className="provider-config__card">
          {/* API Key Field */}
          {provider.requiresApiKey && (
            <div className="provider-config__field">
              <div className="provider-config__field-label">
                API Key
              </div>
              <Input.Password
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('enter_api_key') || 'Enter your API key'}
              />
              {provider.apiKeyUrl && (
                <div className="provider-config__field-hint">
                  <a href={provider.apiKeyUrl} target="_blank" rel="noopener noreferrer">
                    <LinkOutlined /> {t('get_api_key') || 'Get API key'} →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Model Selector */}
          <div className="provider-config__field">
            <div className="provider-config__field-label">
              {t('model') || 'Model'}
              <Tooltip title={modelsFromCache ? 'Cached · click to refresh' : 'Live'}>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined spin={modelsFetching} />}
                  onClick={handleRefreshModels}
                  disabled={modelsFetching}
                  style={{ marginLeft: 4, color: modelsFromCache ? '#86868b' : '#34c759' }}
                />
              </Tooltip>
            </div>
            <Select
              value={modelName}
              onChange={setModelName}
              options={modelOptions}
              showSearch
              loading={modelsFetching}
              placeholder={t('select_model') || 'Select a model'}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
            {modelsFromCache && (
              <div className="provider-config__field-hint">
                {t('models_from_cache') || 'Model list from cache · updates every 24h'}
              </div>
            )}
          </div>

          {/* Base URL (optional) */}
          <div className="provider-config__field">
            <div className="provider-config__field-label">
              {provider.type === 'ollama' ? 'Ollama URL' : `${t('base_url') || 'Base URL'} (${t('optional') || 'Optional'})`}
            </div>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider.defaultBaseURL}
            />
            <div className="provider-config__field-hint">
              {t('base_url_hint') || 'Override the default API endpoint (e.g., for proxy)'}
            </div>
          </div>

          {/* Connection Test */}
          {testStatus !== 'idle' && (
            <div className={`provider-config__test provider-config__test--${testStatus}`}>
              {testStatus === 'loading' && <><LoadingOutlined /> {t('testing') || 'Testing connection...'}</>}
              {testStatus === 'success' && <><CheckCircleFilled /> {t('connection_success') || 'Connection successful'}</>}
              {testStatus === 'error' && <><CloseCircleFilled /> {testError}</>}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="provider-config__actions">
        <Button type="primary" onClick={handleSave}>
          {t('save_configuration') || 'Save Configuration'}
        </Button>
        <Button onClick={handleTest}>
          {t('test_connection') || 'Test Connection'}
        </Button>
        {isConfigured && (
          <Button danger onClick={() => onRemove(providerId)}>
            {t('remove') || 'Remove'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProviderConfigPanel;
