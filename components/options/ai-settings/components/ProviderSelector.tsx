/**
 * ProviderSelector - 左侧 Provider 列表面板
 * Apple-style 分类列表，带搜索和自定义 provider 入口
 */
import React, { useMemo } from 'react';
import { Input } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { providerRegistry, type ProviderDefinition, type ProviderCategory } from '~/utils/ai/provider-registry';
import type { AIsConfig } from '~/utils/getAI';
import ProviderIcon from '~/components/common/ProviderIcon';

interface ProviderSelectorProps {
  aisConfig: AIsConfig;
  selectedProvider: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProvider: (providerId: string) => void;
  onAddCustom: () => void;
  t: (key: string) => string;
}

const CATEGORY_KEYS: Record<ProviderCategory, string> = {
  international: 'category_international',
  chinese: 'category_chinese',
  local: 'category_local',
  custom: 'category_custom',
};

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  aisConfig,
  selectedProvider,
  searchQuery,
  onSearchChange,
  onSelectProvider,
  onAddCustom,
  t,
}) => {
  const filteredProviders = useMemo(() => {
    return providerRegistry.search(searchQuery);
  }, [searchQuery]);

  const groupedProviders = useMemo(() => {
    const groups: Record<string, ProviderDefinition[]> = {};
    for (const p of filteredProviders) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return groups;
  }, [filteredProviders]);

  const configuredSet = useMemo(() => {
    return new Set(aisConfig.data.filter(d => d.apiKey).map(d => d.aiName));
  }, [aisConfig.data]);

  const categoryOrder: ProviderCategory[] = ['local', 'international', 'chinese', 'custom'];

  return (
    <div className="provider-selector">
      <div className="provider-selector__search">
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('search_providers') || 'Search providers...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
        />
      </div>

      <div className="provider-selector__list">
        {categoryOrder.map((category) => {
          const providers = groupedProviders[category];
          if (!providers || providers.length === 0) return null;

          return (
            <div key={category} className="provider-selector__category">
              <div className="provider-selector__category-label">
                {t(CATEGORY_KEYS[category]) || category}
              </div>
              {providers.map((provider) => (
                <ProviderItem
                  key={provider.id}
                  provider={provider}
                  isSelected={selectedProvider === provider.id}
                  isConfigured={configuredSet.has(provider.id)}
                  isActive={aisConfig.active === provider.id}
                  onClick={() => onSelectProvider(provider.id)}
                  t={t}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="provider-selector__add-custom">
        <button className="ant-btn" onClick={onAddCustom}>
          <PlusOutlined /> {t('add_custom_provider') || 'Add Custom Provider'}
        </button>
      </div>
    </div>
  );
};

// Provider item sub-component
const ProviderItem: React.FC<{
  provider: ProviderDefinition;
  isSelected: boolean;
  isConfigured: boolean;
  isActive: boolean;
  onClick: () => void;
  t: (key: string) => string;
}> = ({ provider, isSelected, isConfigured, isActive, onClick, t }) => {
  const classNames = [
    'provider-item',
    isSelected && 'provider-item--selected',
    isConfigured && 'provider-item--configured',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      <div className="provider-item__icon"><ProviderIcon providerId={provider.id} size={20} /></div>
      <div className="provider-item__info">
        <div className="provider-item__name">{provider.name}</div>
        {provider.description && (
          <div className="provider-item__desc">{provider.description}</div>
        )}
      </div>
      <div className="provider-item__status">
        {isActive && <span className="provider-item__active-badge">{t('active_badge')}</span>}
        {isConfigured && !isActive && <span>✓</span>}
      </div>
    </div>
  );
};

export default ProviderSelector;
