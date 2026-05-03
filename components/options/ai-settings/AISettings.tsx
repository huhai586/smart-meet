import React, { useState, useEffect } from 'react';
import ProviderSelector from '~/components/options/ai-settings/components/ProviderSelector';
import ProviderConfigPanel from '~/components/options/ai-settings/components/ProviderConfigPanel';
import CustomProviderDialog from '~/components/options/ai-settings/components/CustomProviderDialog';
import {
    type AIServiceConfig,
    type AIsConfig,
    getAllAIServiceConfigs,
    saveAIServiceConfig,
    clearActiveAIService,
    removeAIServiceConfig,
} from '~/utils/getAI';
import messageManager from '~/utils/message-manager';

import StyledTitle from '~/components/common/StyledTitle';
import useI18n from '~/utils/i18n';
import './ai-settings.scss';

interface AISettingsProps {
    hideHeader?: boolean;
}

const AISettings: React.FC<AISettingsProps> = ({ hideHeader = false }) => {
    const { t } = useI18n();
    const [aisConfig, setAisConfig] = useState<AIsConfig>({
        active: 'google-gemini',
        data: []
    });
    const [selectedProvider, setSelectedProvider] = useState('google-gemini');
    const [searchQuery, setSearchQuery] = useState('');
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        getAllAIServiceConfigs().then((config: AIsConfig) => {
            setAisConfig(config);
            // Select the active service by default
            if (config.active) {
                setSelectedProvider(config.active);
            }
            setConfigLoaded(true);
        });
    }, []);

    const handleSave = (serviceConfig: AIServiceConfig) => {
        // Set as active if: this is currently the active service, OR no active service is set yet
        const shouldSetActive = serviceConfig.aiName === aisConfig.active || !aisConfig.active;

        saveAIServiceConfig(serviceConfig, shouldSetActive).then(() => {
            messageManager.success(t('configuration_saved'));

            setAisConfig(prev => {
                const newData = [...prev.data];
                const existingIndex = newData.findIndex(item => item.aiName === serviceConfig.aiName);

                if (existingIndex >= 0) {
                    newData[existingIndex] = serviceConfig;
                } else {
                    newData.push(serviceConfig);
                }

                // If this was the first service configured, make it active
                const hadNoConfiguredServices = prev.data.every(svc => !svc.apiKey);
                const newActive = hadNoConfiguredServices ? serviceConfig.aiName : prev.active;

                return { active: newActive, data: newData };
            });

            chrome.runtime.sendMessage({ type: 'apiKeyUpdated' });
        });
    };

    const handleActivate = (serviceConfig: AIServiceConfig) => {
        saveAIServiceConfig(serviceConfig, true).then(() => {
            messageManager.success(t('active_service_changed'));
            setAisConfig(prev => {
                const newData = [...prev.data];
                const idx = newData.findIndex(d => d.aiName === serviceConfig.aiName);
                if (idx >= 0) newData[idx] = serviceConfig; else newData.push(serviceConfig);
                return { active: serviceConfig.aiName, data: newData };
            });
            chrome.runtime.sendMessage({ type: 'apiKeyUpdated' });
        });
    };

    const handleUnsetActive = () => {
        clearActiveAIService().then(() => {
            setAisConfig(prev => ({ ...prev, active: '' }));
            chrome.runtime.sendMessage({ type: 'apiKeyUpdated' });
        });
    };

    const handleRemove = (providerId: string) => {
        removeAIServiceConfig(providerId).then(() => {
            messageManager.success(t('configuration_removed'));
            setAisConfig(prev => ({
                ...prev,
                active: prev.active === providerId
                    ? (prev.data.find(d => d.aiName !== providerId && d.apiKey)?.aiName || 'google-gemini')
                    : prev.active,
                data: prev.data.filter(d => d.aiName !== providerId),
            }));
            chrome.runtime.sendMessage({ type: 'apiKeyUpdated' });
        });
    };

    const handleCustomCreated = (providerId: string) => {
        setSelectedProvider(providerId);
    };

    return (
        <div className="ai-settings">
            {!hideHeader && (
                <div className="ai-settings__header">
                    <StyledTitle>
                        {t('active_ai_service')}
                    </StyledTitle>
                </div>
            )}
            <div className="ai-settings__content">
                <ProviderSelector
                    aisConfig={aisConfig}
                    selectedProvider={selectedProvider}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSelectProvider={setSelectedProvider}
                    onAddCustom={() => setCustomDialogOpen(true)}
                    t={t}
                />
                <ProviderConfigPanel
                    key={configLoaded ? `loaded-${selectedProvider}` : 'loading'}
                    providerId={selectedProvider}
                    aisConfig={aisConfig}
                    onSave={handleSave}
                    onActivate={handleActivate}
                    onUnsetActive={handleUnsetActive}
                    onRemove={handleRemove}
                    t={t}
                />
            </div>
            <CustomProviderDialog
                open={customDialogOpen}
                onClose={() => setCustomDialogOpen(false)}
                onCreated={handleCustomCreated}
                t={t}
            />
        </div>
    );
};

export default AISettings;

