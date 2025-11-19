import React, { useState, useEffect } from 'react';
import { ServiceList } from '~/components/options/ai-settings/components/ServiceList';
import { ServiceConfigPanel } from '~/components/options/ai-settings/components/ServiceConfigPanel';
import { useFetchModels } from '~/components/options/ai-settings/hooks';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';
import { 
    type AIServiceConfig, 
    type AIsConfig,
    getAllAIServiceConfigs,
    saveAIServiceConfig,
    setActiveAIService
} from '~/utils/getAI';
import messageManager from '~/utils/message-manager';

import StyledTitle from '~/components/common/StyledTitle';
import useI18n from '~/utils/i18n';
import './ai-settings.scss';

const AISettings: React.FC = () => {
    const { t } = useI18n();
    const [aisConfig, setAisConfig] = useState<AIsConfig>({
        active: 'gemini',
        data: []
    });
    const [currentAI, setCurrentAI] = useState<AIServiceConfig>({
        apiKey: '',
        modelName: '',
        aiName: 'gemini'
    });

    useFetchModels(currentAI.aiName, currentAI.apiKey);

    useEffect(() => {
        getAllAIServiceConfigs().then((config: AIsConfig) => {
            setAisConfig(config);
            
            // Set current AI to active service or first available
            const activeService = config.active;
            
            // Find and set current service config
            const activeConfig = config.data.find(item => item.aiName === activeService);
            if (activeConfig) {
                setCurrentAI(activeConfig);
            } else {
                // If no active config found, create default for current service
                setCurrentAI({
                    apiKey: '',
                    modelName: '',
                    aiName: activeService
                });
            }
        });
    }, []);

    const handleAiTabChange = (aiName: AIServiceType) => {
        // Find existing config for this service
        const existingConfig = aisConfig.data.find(item => item.aiName === aiName);
        if (existingConfig) {
            setCurrentAI(existingConfig);
        } else {
            // Create new config for this service
            setCurrentAI({
                apiKey: '',
                modelName: '',
                aiName
            });
        }
    };

    const handleSaveAi = () => {
        const isActivating = currentAI.aiName === aisConfig.active;

        saveAIServiceConfig(currentAI, isActivating).then(() => {
            messageManager.success(t('configuration_saved'));

            // Update local state
            setAisConfig(prev => {
                const newData = [...prev.data];
                const existingIndex = newData.findIndex(item => item.aiName === currentAI.aiName);
                
                if (existingIndex >= 0) {
                    newData[existingIndex] = currentAI;
                } else {
                    newData.push(currentAI);
                }

                // If this was the first service configured, make it active
                const hadNoConfiguredServices = prev.data.every(svc => !svc.apiKey);
                const newActive = hadNoConfiguredServices ? currentAI.aiName : prev.active;

                return {
                    active: newActive,
                    data: newData
                };
            });

            // Send message to background script
            chrome.runtime.sendMessage({
                type: 'apiKeyUpdated',
            });
        });
    };

    const handleSetAsDefault = () => {
        if (currentAI.apiKey) {
            setActiveAIService(currentAI.aiName).then(() => {
                messageManager.success(t('active_service_changed'));
                
                // Update local state
                setAisConfig(prev => ({
                    ...prev,
                    active: currentAI.aiName
                }));
                
                chrome.runtime.sendMessage({
                    type: 'apiKeyUpdated',
                });
            });
        } else {
            messageManager.info(t('please_configure_api_key_first'));
        }
    };

    const handleApiKeyChange = (apiKey: string) => {
        setCurrentAI(prev => ({
            ...prev,
            apiKey
        }));
    };

    const handleModelNameChange = (modelName: string) => {
        setCurrentAI(prev => ({
            ...prev,
            modelName
        }));
    };

    const handleBaseUrlChange = (baseUrl: string) => {
        setCurrentAI(prev => ({
            ...prev,
            baseUrl: baseUrl.trim() || undefined
        }));
    };

    return (
        <div className="ai-settings">
            <div className="ai-settings__header">
                <StyledTitle>
                    {t('active_ai_service')}
                </StyledTitle>
            </div>
            <div className="ai-settings__content">
                <ServiceList
                    aisConfig={aisConfig}
                    currentEditService={currentAI.aiName}
                    onAiTabChange={handleAiTabChange}
                    t={t}
                />
                <ServiceConfigPanel
                    service={currentAI.aiName}
                    aisConfig={aisConfig}
                    currentAI={currentAI}
                    onApiKeyChange={handleApiKeyChange}
                    onModelNameChange={handleModelNameChange}
                    onBaseUrlChange={handleBaseUrlChange}
                    onSaveService={handleSaveAi}
                    onSetAsDefault={handleSetAsDefault}
                    t={t}
                />
            </div>
        </div>
    );
};

export default AISettings;

