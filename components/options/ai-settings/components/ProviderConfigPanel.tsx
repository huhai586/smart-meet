/**
 * ProviderConfigPanel - 右侧 Provider 配置面板
 * 显示选中 provider 的配置表单（API Key、Model、Base URL 等）
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Select, Button, Switch, Tooltip, message, Dropdown } from 'antd';
import { LinkOutlined, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { providerRegistry, type ProviderDefinition } from '~/utils/ai/provider-registry';
import ProviderIcon from '~/components/common/ProviderIcon';
import { fetchAvailableModels, testConnection, type ModelConfig } from '~/utils/ai/model-factory';
import type { AIServiceConfig, AIsConfig } from '~/utils/getAI';

interface ProviderConfigPanelProps {
  providerId: string;
  aisConfig: AIsConfig;
  onSave: (config: AIServiceConfig) => void;
  onActivate: (config: AIServiceConfig) => void;
  onUnsetActive: () => void;
  onRemove: (providerId: string) => void;
  t: (key: string) => string;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

const ProviderConfigPanel: React.FC<ProviderConfigPanelProps> = ({
  providerId,
  aisConfig,
  onSave,
  onActivate,
  onUnsetActive,
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

  // aisConfig 异步加载完成后（如从 sync 存储同步到新设备），补填 apiKey
  // 仅在 apiKey 当前为空时更新，避免覆盖用户正在输入的内容
  useEffect(() => {
    if (apiKey) return;
    const existing = aisConfig.data.find(d => d.aiName === providerId);
    if (existing?.apiKey) {
      setApiKey(existing.apiKey);
    }
  }, [aisConfig, providerId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const isConfigured = aisConfig.data.some(d => d.aiName === providerId && (d.apiKey || !provider?.requiresApiKey));

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

  const moreMenuItems: MenuProps['items'] = isConfigured ? [
    {
      key: 'remove',
      label: t('remove') || 'Remove',
      danger: true,
      onClick: () => onRemove(providerId),
    },
  ] : [];

  return (
    <div className="provider-config">
      {/* Sticky Header — Mica backdrop blur */}
      <div className="provider-config__header">
        <div className="provider-config__icon-squircle">
          <ProviderIcon providerId={provider.id} size={28} />
        </div>
        <div className="provider-config__title-area">
          <h2 className="provider-config__title">{provider.name}</h2>
          <div className="provider-config__subtitle">
            {provider.nameZh && `${provider.nameZh} · `}
            {provider.type === 'ollama' ? 'Local Model' : 'Cloud API'}
          </div>
        </div>
        <div className="provider-config__header-actions">
          <Button type="primary" onClick={handleSave}>
            {t('save_configuration') || 'Save'}
          </Button>
          {moreMenuItems.length > 0 && (
            <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} className="provider-config__more-btn" />
            </Dropdown>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="provider-config__body">

        {/* Group 1: Set as Default — standalone first group */}
        <div className="provider-config__group">
          <div className="provider-config__list">
            <div className="provider-config__row provider-config__row--switch">
              <span className="provider-config__row-label provider-config__row-label--fill">
                {t('set_as_default') || 'Set as default'}
              </span>
              <Switch
                checked={isActive}
                onChange={(checked) => {
                  if (checked) onActivate({ apiKey, modelName, aiName: providerId, baseUrl: baseUrl || undefined });
                  else onUnsetActive();
                }}
              />
            </div>
          </div>
          <p className="provider-config__group-footer">
            {t('default_service_desc') || 'Use this provider for all AI features'}
          </p>
        </div>

        {/* Group 2: Configuration */}
        <div className="provider-config__group">
          <div className="provider-config__group-header">
            {t('configuration') || 'Configuration'}
          </div>
          <div className="provider-config__list">
            {/* API Key */}
            {provider.requiresApiKey && (
              <div className="provider-config__row">
                <span className="provider-config__row-label">API Key</span>
                <div className="provider-config__row-control">
                  <Input.Password
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t('enter_api_key') || 'Enter your API key'}
                  />
                </div>
              </div>
            )}

            {/* Model */}
            <div className="provider-config__row">
              <span className="provider-config__row-label">
                {t('model') || 'Model'}
              </span>
              <div className="provider-config__row-control provider-config__row-control--model">
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
                <Tooltip title={modelsFromCache ? (t('models_from_cache') || 'Cached · click refresh') : 'Live'}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined spin={modelsFetching} />}
                    onClick={handleRefreshModels}
                    disabled={modelsFetching}
                    className={modelsFromCache ? 'provider-config__refresh-btn--cached' : 'provider-config__refresh-btn--live'}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Base URL */}
            <div className="provider-config__row">
              <span className="provider-config__row-label">
                {provider.type === 'ollama' ? 'Ollama URL' : (t('base_url') || 'Base URL')}
              </span>
              <div className="provider-config__row-control">
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={provider.defaultBaseURL || (t('optional') || 'Optional')}
                />
              </div>
            </div>

            {/* Connection test result — last row inside card */}
            {testStatus !== 'idle' && (
              <div className={`provider-config__test-row provider-config__test-row--${testStatus}`}>
                {testStatus === 'loading' && <><LoadingOutlined /> {t('testing') || 'Testing...'}</>}
                {testStatus === 'success' && <><CheckCircleFilled /> {t('connection_success') || 'Connection successful'}</>}
                {testStatus === 'error' && <><CloseCircleFilled /> {testError}</>}
              </div>
            )}
          </div>

          {/* Footer hints */}
          <p className="provider-config__group-footer">
            {provider.requiresApiKey && provider.apiKeyUrl && (
              <>
                <a href={provider.apiKeyUrl} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined /> {t('get_api_key') || 'Get API key'} →
                </a>
                {' · '}
              </>
            )}
            {t('base_url_hint') || 'Base URL overrides the default API endpoint'}
          </p>
        </div>

        {/* Test Connection — blue text link */}
        <div className="provider-config__test-link">
          <Button
            type="link"
            onClick={handleTest}
            loading={testStatus === 'loading'}
          >
            {t('test_connection') || 'Test Connection'}…
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ProviderConfigPanel;
