import React, { useState, useEffect } from 'react';
import { ServiceList } from '~/components/options/ai-settings/components/ServiceList';
import { ServiceConfigPanel } from '~/components/options/ai-settings/components/ServiceConfigPanel';
import { useFetchModels } from '~/components/options/ai-settings/hooks';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';
import messageManager from '~/utils/message-manager';

import StyledTitle from '~/components/common/StyledTitle';
import useI18n from '~/utils/i18n';

interface AIServiceConfig {
    apiKey: string;
    modelName: string;
}

const AISettings: React.FC = () => {
    const { t } = useI18n();
    const [configuredServices, setConfiguredServices] = useState<Record<string, AIServiceConfig>>({});
    const [activeService, setActiveService] = useState<string>('gemini');
    const [currentEditService, setCurrentEditService] = useState<string>('gemini');
    const [apiKey, setApiKey] = useState<string>('');
    const [modelName, setModelName] = useState<string>('');

    useFetchModels(currentEditService as AIServiceType, apiKey);

    useEffect(() => {
        import('~/utils/getAPIkey').then(({ getAllAIServiceConfigs }) => {
            getAllAIServiceConfigs().then(({ aiServices, activeAIService }) => {
                setConfiguredServices(aiServices);
                setActiveService(activeAIService);

                if (activeAIService && aiServices[activeAIService]) {
                    const service = activeAIService;
                    setCurrentEditService(service);
                    setApiKey(aiServices[service].apiKey || '');
                    setModelName(aiServices[service].modelName || '');
                }
            });
        });
    }, []);

    const handleServiceChange = (service: AIServiceType) => {
        setCurrentEditService(service);

        if (configuredServices[service]) {
            setApiKey(configuredServices[service].apiKey || '');
            setModelName(configuredServices[service].modelName || '');
        } else {
            setApiKey('');
            setModelName('');
        }
    };

    const handleSaveService = () => {
        import('~/utils/getAPIkey').then(({ saveAIServiceConfig }) => {
            const isActivating = currentEditService === activeService;

            saveAIServiceConfig(
                currentEditService, 
                apiKey, 
                isActivating,
                { modelName }
            ).then(() => {
                messageManager.success(t('configuration_saved'));

                setConfiguredServices(prev => ({
                    ...prev,
                    [currentEditService]: {
                        apiKey,
                        modelName
                    }
                }));

                const hadNoConfiguredServices = Object.values(configuredServices)
                    .every(svc => !svc?.apiKey);

                if (hadNoConfiguredServices) {
                    setActiveService(currentEditService);
                }

                
                chrome.runtime.sendMessage({
                    type: 'apiKeyUpdated',
                });
            });
        });
    };

    const handleSetAsDefault = () => {
        if (configuredServices[currentEditService]?.apiKey) {
            import('~/utils/getAPIkey').then(({ saveAIServiceConfig }) => {
                saveAIServiceConfig(
                    currentEditService, 
                    apiKey, 
                    true,
                    { modelName }
                ).then(() => {
                    messageManager.success(t('active_service_changed'));
                    setActiveService(currentEditService);
                    
                    chrome.runtime.sendMessage({
                        type: 'apiKeyUpdated',
                    });
                });
            });
        } else {
            messageManager.info(t('please_configure_api_key_first'));
        }
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 30px", borderBottom: "1px solid #f0f0f0" }}>
                <StyledTitle>
                    {t('active_ai_service')}
                </StyledTitle>
            </div>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                height: "calc(100% - 100px)", 
                overflow: "hidden"
            }}>
                <ServiceList
                    configuredServices={configuredServices}
                    activeService={activeService}
                    currentEditService={currentEditService}
                    onServiceChange={handleServiceChange}
                    t={t}
                />
                <ServiceConfigPanel
                    service={currentEditService as AIServiceType}
                    configuredServices={configuredServices}
                    activeService={activeService}
                    apiKey={apiKey}
                    modelName={modelName}
                    onApiKeyChange={setApiKey}
                    onModelNameChange={setModelName}
                    onSaveService={handleSaveService}
                    onSetAsDefault={handleSetAsDefault}
                    t={t}
                />
            </div>
        </div>
    );
};

export default AISettings;

