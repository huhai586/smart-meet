import React, { useState, useEffect } from "react";
import { Alert, Typography, Input, Button, Space, Card, theme, message, Popover, Spin, Select } from "antd";
import styled from '@emotion/styled';
import useI18n from '../utils/i18n';
import StyledTitle from './common/StyledTitle';

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: none;
  
  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }
`;

// 类型声明与样式组件
interface CustomTheme {
  colorPrimary: string;
  colorSuccess: string;
  colorError: string;
  t: (key: string) => string;
}

const ServiceListItem = styled.div<{ 
  active: boolean, 
  configured: boolean, 
  selected: boolean 
}>`
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  background: ${props => props.selected ? 'rgba(22, 119, 255, 0.1)' : 'white'};
  border: 1px solid ${props => props.selected ? '#1677ff' : '#f0f0f0'};
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

const ConfigArea = styled.div`
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
`;

const StatusBadge = styled.div<{ isSuccess: boolean }>`
  font-size: 12px; 
  padding: 2px 8px;
  border-radius: 20px;
  display: inline-block;
  background-color: ${props => props.isSuccess ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 79, 0.2)'};
  color: ${props => props.isSuccess ? '#52c41a' : '#ff4d4f'};
`;

const ActiveServiceBadge = styled.div`
  margin-left: auto;
  background-color: rgba(22, 119, 255, 0.1);
  color: #1677ff;
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
`;

const ServiceIcon = styled.div<{ configured: boolean }>`
  font-size: 28px;
  margin-right: 12px;
  opacity: ${props => props.configured ? 1 : 0.6};
  filter: ${props => !props.configured ? 'grayscale(60%)' : 'none'};
  transition: all 0.3s ease;
`;

const ConfigButton = styled(Button)`
  min-width: 200px;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const DefaultServiceButton = styled(Button)`
  border-radius: 20px;
  padding: 4px 16px;
  height: auto;
  transition: all 0.25s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const AISettings: React.FC = () => {
    const [status, setStatus] = useState('');
    const { token } = useToken();
    const { t } = useI18n();
    const [messageApi, contextHolder] = message.useMessage();

    // CSS 样式
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerHTML = `
            .service-list-item {
                position: relative;
                overflow: hidden;
            }
        `;
        document.head.appendChild(styleSheet);
        
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    // 支持的AI服务类型列表
    const [supportedServices, setSupportedServices] = useState<string[]>(['gemini', 'openai', 'xai']);
    // 当前配置的AI服务
    const [configuredServices, setConfiguredServices] = useState<Record<string, any>>({});
    // 当前活动的AI服务
    const [activeService, setActiveService] = useState<string>('gemini');
    // 当前选中要编辑的服务
    const [currentEditService, setCurrentEditService] = useState<string>('gemini');
    // 当前编辑服务的API密钥
    const [currentApiKey, setCurrentApiKey] = useState<string>('');
    // 当前编辑服务的模型名称（对于支持多模型的服务）
    const [currentModelName, setCurrentModelName] = useState<string>('');
    // 可用模型列表
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    // 模型加载状态
    const [loadingModels, setLoadingModels] = useState<boolean>(false);
    // 模型加载错误信息
    const [modelLoadError, setModelLoadError] = useState<string>('');

    // 测试API密钥是否可用
    const [testingApiKey, setTestingApiKey] = useState<boolean>(false);
    
    // 测试特定服务的API密钥
    const [testingServiceKey, setTestingServiceKey] = useState<string | null>(null);
    
    const testApiKey = async () => {
        if (!currentApiKey) {
            messageApi.error(t('please_enter_api_key_first'));
            return;
        }
        
        setTestingApiKey(true);
        
        try {
            let isValid = false;
            let errorMessage = '';
            
            if (currentEditService === 'openai') {
                try {
                    // 测试OpenAI API密钥
                    const response = await fetch('https://api.openai.com/v1/models', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${currentApiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        isValid = true;
                    } else {
                        const error = await response.json().catch(() => ({ error: { message: t('unknown_error') } }));
                        errorMessage = error.error?.message || t('api_key_invalid');
                    }
                } catch (error) {
                    console.error('Error testing OpenAI API key:', error);
                    errorMessage = t('network_error');
                }
            } else if (currentEditService === 'gemini') {
                try {
                    // 测试Google AI (Gemini) API密钥
                    // 使用一个简单的完成请求测试
                    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + currentApiKey);
                    
                    if (response.ok) {
                        isValid = true;
                    } else {
                        const error = await response.json().catch(() => ({ error: { message: t('unknown_error') } }));
                        errorMessage = error.error?.message || t('api_key_invalid');
                    }
                } catch (error) {
                    console.error('Error testing Gemini API key:', error);
                    errorMessage = t('network_error');
                }
            } else if (currentEditService === 'xai') {
                // xAI暂时没有简单的测试端点，我们假设密钥格式有效就是可用的
                // 在实际应用中，你应该使用xAI提供的适当API端点进行测试
                if (currentApiKey.length > 20) {
                    isValid = true;
                    messageApi.warning(t('api_key_format_valid_but_not_tested'));
                } else {
                    errorMessage = t('api_key_format_invalid');
                }
            }
            
            if (isValid) {
                messageApi.success(t('api_key_valid'));
            } else {
                messageApi.error(errorMessage || t('api_key_invalid'));
            }
        } finally {
            setTestingApiKey(false);
        }
    };

    const testServiceApiKey = async (service: string) => {
        if (!configuredServices[service]?.apiKey) {
            messageApi.error(t('service_not_configured'));
            return;
        }
        
        setTestingServiceKey(service);
        const apiKey = configuredServices[service].apiKey;
        
        try {
            let isValid = false;
            let errorMessage = '';
            
            if (service === 'openai') {
                try {
                    // 测试OpenAI API密钥
                    const response = await fetch('https://api.openai.com/v1/models', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        isValid = true;
                    } else {
                        const error = await response.json().catch(() => ({ error: { message: t('unknown_error') } }));
                        errorMessage = error.error?.message || t('api_key_invalid');
                    }
                } catch (error) {
                    console.error('Error testing OpenAI API key:', error);
                    errorMessage = t('network_error');
                }
            } else if (service === 'gemini') {
                try {
                    // 测试Google AI (Gemini) API密钥
                    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
                    
                    if (response.ok) {
                        isValid = true;
                    } else {
                        const error = await response.json().catch(() => ({ error: { message: t('unknown_error') } }));
                        errorMessage = error.error?.message || t('api_key_invalid');
                    }
                } catch (error) {
                    console.error('Error testing Gemini API key:', error);
                    errorMessage = t('network_error');
                }
            } else if (service === 'xai') {
                // xAI暂时没有简单的测试端点，我们假设密钥格式有效就是可用的
                if (apiKey.length > 20) {
                    isValid = true;
                    messageApi.warning(t('api_key_format_valid_but_not_tested'));
                } else {
                    errorMessage = t('api_key_format_invalid');
                }
            }
            
            if (isValid) {
                messageApi.success(t('api_key_valid_for_service', { service: getServiceDisplayName(service) }));
            } else {
                messageApi.error(errorMessage || t('api_key_invalid_for_service', { service: getServiceDisplayName(service) }));
            }
        } finally {
            setTestingServiceKey(null);
        }
    };

    useEffect(() => {
        // 加载保存的API keys
        import('../utils/getAPIkey').then(({ getAllAIServiceConfigs }) => {
            getAllAIServiceConfigs().then(({ aiServices, activeAIService }) => {
                setConfiguredServices(aiServices);
                setActiveService(activeAIService);
                
                // 默认选择活动服务进行编辑
                if (activeAIService && aiServices[activeAIService]) {
                    const service = activeAIService;
                    setCurrentEditService(service);
                    setCurrentApiKey(aiServices[service].apiKey || '');
                    setCurrentModelName(aiServices[service].modelName || '');
                    
                    // 立即设置预定义的模型列表
                    if (service === 'gemini') {
                        setAvailableModels(predefinedModels.gemini);
                    } else if (service === 'xai') {
                        setAvailableModels(predefinedModels.xai);
                    } else if (service === 'openai') {
                        if (aiServices[service].apiKey) {
                            // 如果有API密钥，稍后会通过API获取
                            // 但先设置一个预设列表，以防API调用失败
                            setAvailableModels(predefinedModels.openai);
                        } else {
                            setAvailableModels(predefinedModels.openai);
                        }
                    }
                }
            });
        });
    }, []);
    
    // 强制确保在组件挂载后立即设置预定义模型
    useEffect(() => {
        // 确保初始加载时模型列表不为空
        if (currentEditService === 'gemini' && availableModels.length <= 1) {
            setAvailableModels(predefinedModels.gemini);
        } else if (currentEditService === 'xai' && availableModels.length <= 1) {
            setAvailableModels(predefinedModels.xai);
        } else if (currentEditService === 'openai' && availableModels.length <= 1 && !currentApiKey) {
            setAvailableModels(predefinedModels.openai);
        }
    }, [currentEditService]);
    
    // 当API密钥或服务类型变更时，尝试获取可用模型
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentApiKey) {
                fetchAvailableModels();
            } else {
                // 如果没有API密钥，设置预定义的模型列表
                if (currentEditService === 'gemini') {
                    setAvailableModels(predefinedModels.gemini);
                } else if (currentEditService === 'xai') {
                    setAvailableModels(predefinedModels.xai);
                } else if (currentEditService === 'openai') {
                    setAvailableModels(predefinedModels.openai);
                } else {
                    setAvailableModels([getDefaultModelName(currentEditService)]);
                }
            }
        }, 500); // 添加延迟以防止频繁API调用
        
        return () => clearTimeout(timer);
    }, [currentApiKey, currentEditService]);
    
    // 当服务变更时立即设置对应的预定义模型列表
    useEffect(() => {
        // 先清空，然后立即设置预定义列表，避免任何延迟
        setModelLoadError('');
        
        if (currentEditService === 'gemini') {
            console.log('Setting Gemini models:', predefinedModels.gemini);
            setAvailableModels(predefinedModels.gemini);
        } else if (currentEditService === 'xai') {
            setAvailableModels(predefinedModels.xai);
        } else if (currentEditService === 'openai' && !currentApiKey) {
            setAvailableModels(predefinedModels.openai);
        }
    }, [currentEditService]);

    // 处理服务切换
    const handleServiceChange = (service: string) => {
        setCurrentEditService(service);
        
        // 清空当前错误
        setModelLoadError('');
        
        // 立即设置预定义的模型列表，无需等待API调用
        if (service === 'gemini') {
            setAvailableModels(predefinedModels.gemini);
        } else if (service === 'xai') {
            setAvailableModels(predefinedModels.xai);
        } else if (service === 'openai' && !currentApiKey) {
            // 对于OpenAI，如果没有API密钥，设置预定义的模型列表
            setAvailableModels(predefinedModels.openai);
        }
        
        // 加载选中服务的配置
        if (configuredServices[service]) {
            setCurrentApiKey(configuredServices[service].apiKey || '');
            
            // 确保当前模型名称与所选服务匹配
            const savedModelName = configuredServices[service].modelName || '';
            const defaultModelName = getDefaultModelName(service);
            
            // 检查保存的模型名称是否与当前选择的服务类型相符
            const isValidModelForService = 
                (service === 'gemini' && savedModelName.includes('gemini')) ||
                (service === 'openai' && savedModelName.includes('gpt')) ||
                (service === 'xai' && savedModelName.includes('grok')) ||
                !savedModelName; // 空值也是有效的
                
            setCurrentModelName(isValidModelForService ? savedModelName : '');
        } else {
            setCurrentApiKey('');
            setCurrentModelName('');
        }
    };

    // 保存当前服务配置
    const handleSaveService = () => {
        import('../utils/getAPIkey').then(({ saveAIServiceConfig }) => {
            const isActivating = currentEditService === activeService;
            
            saveAIServiceConfig(
                currentEditService, 
                currentApiKey, 
                isActivating,
                { modelName: currentModelName }
            ).then(() => {
                setStatus('Service configuration saved successfully!');
                
                // 更新本地配置状态
                setConfiguredServices(prev => ({
                    ...prev,
                    [currentEditService]: {
                        apiKey: currentApiKey,
                        modelName: currentModelName
                    }
                }));
                
                // 如果这是第一个配置的服务，自动将其设为活动服务
                const hadNoConfiguredServices = Object.values(configuredServices)
                    .every(svc => !svc?.apiKey);
                
                if (hadNoConfiguredServices) {
                    setActiveService(currentEditService);
                }
                
                messageApi.success(t('configuration_saved'));
                setTimeout(() => setStatus(''), 2000);
                
                // 通知其他部分API密钥已更新
                chrome.runtime.sendMessage({
                    type: 'apiKeyUpdated',
                });
            });
        });
    };

    // 设置当前服务为活动服务
    const handleServiceCardClick = (service: string) => {
        if (configuredServices[service]?.apiKey) {
            // 如果服务已配置，将其设置为活动服务
            import('../utils/getAPIkey').then(({ saveAIServiceConfig }) => {
                saveAIServiceConfig(
                    service,
                    configuredServices[service].apiKey,
                    true,
                    configuredServices[service]
                ).then(() => {
                    setActiveService(service);
                    messageApi.success(t('active_service_changed'));
                    setTimeout(() => setStatus(''), 2000);
                    
                    // 通知其他部分API密钥已更新
                    chrome.runtime.sendMessage({
                        type: 'apiKeyUpdated',
                    });
                });
            });
        } else {
            // 如果服务未配置，显示提示消息
            messageApi.info(t('please_configure_api_key_first'));
        }
    };

    // 获取服务显示名称
    const getServiceDisplayName = (service: string): string => {
        const serviceNames = {
            'gemini': 'Google Gemini',
            'openai': 'OpenAI GPT',
            'xai': 'xAI Grok',
        };
        return serviceNames[service] || service;
    };

    // 获取服务默认模型名称
    const getDefaultModelName = (service: string): string => {
        const defaultModels = {
            'gemini': 'gemini-2.0-flash',
            'openai': 'gpt-3.5-turbo',
            'xai': 'grok-1',
        };
        return defaultModels[service] || '';
    };

    // 获取服务API密钥获取网址
    const getApiKeySourceUrl = (service: string): string => {
        const sourceUrls = {
            'gemini': 'https://aistudio.google.com/apikey',
            'openai': 'https://platform.openai.com/api-keys',
            'xai': 'https://x.ai/api',  // 假设的URL
        };
        return sourceUrls[service] || '';
    };

    // 获取服务图标
    const getServiceIcon = (service: string): string => {
        const icons = {
            'gemini': '🧠',
            'openai': '🤖',
            'xai': '✨',
        };
        return icons[service] || '🔧';
    };

    // 预定义模型列表 - 如果服务商没有提供获取模型列表的API，则使用这些预定义列表
    // 当服务商发布新模型时，可以在这里更新
    const predefinedModels = {
        // Gemini 模型 - 来源: https://ai.google.dev/models/gemini
        gemini: [
            'gemini-1.0-pro', 
            'gemini-1.5-flash', 
            'gemini-1.5-pro',
            'gemini-2.0-flash',
            'gemini-2.0-pro'
        ],
        // OpenAI 模型 - 仅作为备用，优先通过API获取
        openai: [
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k',
            'gpt-4',
            'gpt-4-turbo',
            'gpt-4-32k',
            'gpt-4o',
            'gpt-4o-mini'
        ],
        // xAI Grok 模型
        xai: ['grok-1', 'grok-1.5', 'grok-2']
    };

    // 获取可用模型列表
    const fetchAvailableModels = async () => {
        if (!currentApiKey) {
            setAvailableModels([]);
            return;
        }

        console.log(`Fetching models for ${currentEditService}...`);
        setLoadingModels(true);
        setModelLoadError('');
        
        try {
            let models: string[] = [];
            
            if (currentEditService === 'openai') {
                try {
                    // OpenAI提供了获取模型列表的API
                    console.log('Fetching OpenAI models via API...');
                    const response = await fetch('https://api.openai.com/v1/models', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${currentApiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        // 处理特定错误情况
                        if (response.status === 401) {
                            // API密钥无效
                            throw new Error(t('invalid_api_key'));
                        } else {
                            const errorData = await response.json().catch(() => null);
                            const errorMessage = errorData?.error?.message || `${t('failed_to_fetch_models')}: ${response.status}`;
                            throw new Error(errorMessage);
                        }
                    }
                    
                    const data = await response.json();
                    // 过滤出仅支持聊天的模型
                    models = data.data
                        .filter((model: any) => 
                            model.id.includes('gpt') && !model.id.includes('deprecated'))
                        .map((model: any) => model.id)
                        .sort();
                    console.log('OpenAI models fetched:', models);
                } catch (error) {
                    console.error('Error fetching OpenAI models:', error);
                    // 对于API密钥错误，使用预设的常用模型列表作为后备
                    models = predefinedModels.openai;
                    console.log('Using predefined OpenAI models due to error:', models);
                    // 仍然抛出错误，但已准备好后备模型列表
                    throw error;
                }
                
            } else if (currentEditService === 'gemini') {
                // Gemini没有提供模型列表API，使用预设的模型列表
                console.log('Using predefined Gemini models:', predefinedModels.gemini);
                models = [...predefinedModels.gemini]; // 使用展开运算符确保创建新数组
                
                // 直接设置这些模型，不需要进一步过滤
                setAvailableModels(models);
                console.log('Set Gemini models to:', models);
                setLoadingModels(false);
                return;
                
            } else if (currentEditService === 'xai') {
                // xAI没有提供模型列表API，使用预设的模型列表
                console.log('Using predefined xAI models:', predefinedModels.xai);
                models = [...predefinedModels.xai]; // 使用展开运算符确保创建新数组
                
                // 同样，可以直接设置
                setAvailableModels(models);
                console.log('Set xAI models to:', models);
                setLoadingModels(false);
                return;
            }
            
            // 确保只显示当前服务对应的模型 (主要用于OpenAI，其他服务已直接返回)
            const filteredModels = models.filter(model => {
                if (currentEditService === 'openai') return model.includes('gpt');
                return true; // 其他服务不应该走到这里
            });
            
            console.log(`Setting filtered models for ${currentEditService}:`, filteredModels);
            setAvailableModels(filteredModels);
        } catch (error) {
            console.error('Error fetching models:', error);
            setModelLoadError(error.message || t('failed_to_fetch_models'));
            
            // 即使有错误，也设置一个默认的模型列表
            // 这样用户仍然可以从预设列表中选择，即使API密钥错误
            if (currentEditService === 'openai') {
                console.log('Setting OpenAI models (after error):', predefinedModels.openai);
                setAvailableModels([...predefinedModels.openai]);
            } else if (currentEditService === 'gemini') {
                console.log('Setting Gemini models (after error):', predefinedModels.gemini);
                setAvailableModels([...predefinedModels.gemini]);
            } else if (currentEditService === 'xai') {
                console.log('Setting xAI models (after error):', predefinedModels.xai);
                setAvailableModels([...predefinedModels.xai]);
            } else {
                setAvailableModels([getDefaultModelName(currentEditService)]);
            }
        } finally {
            setLoadingModels(false);
        }
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            {contextHolder}
            
            <div style={{ padding: "20px 30px", borderBottom: "1px solid #f0f0f0" }}>
                <Title level={3} style={{ margin: 0, fontWeight: "bold", color: "#333" }}>
                    {t('active_ai_service')}
                </Title>
                <Text type="secondary" style={{ fontSize: "16px" }}>
                    {t('select_active_service')}
                </Text>
            </div>
            
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                height: "calc(100% - 100px)", 
                overflow: "hidden"
            }}>
                {/* 左侧服务列表 */}
                <div style={{ 
                    width: '250px', 
                    borderRight: '1px solid #f0f0f0', 
                    padding: '20px', 
                    overflowY: 'auto',
                    height: "100%"
                }}>
                    <Text strong style={{ marginBottom: '15px', display: 'block', fontSize: '16px' }}>{t('service_list')}</Text>
                    {supportedServices.map(service => {
                        const isConfigured = !!configuredServices[service]?.apiKey;
                        const isActive = activeService === service;
                        
                        return (
                            <ServiceListItem 
                                key={service}
                                active={isActive}
                                configured={isConfigured}
                                selected={currentEditService === service}
                                onClick={() => handleServiceChange(service)}
                                className="service-list-item"
                            >
                                <ServiceIcon configured={isConfigured}>
                                    {getServiceIcon(service)}
                                </ServiceIcon>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {getServiceDisplayName(service)}
                                    </div>
                                    <StatusBadge 
                                        isSuccess={isConfigured}
                                    >
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
                
                {/* 右侧服务详情和配置 */}
                <div style={{ 
                    flex: 1, 
                    padding: '30px 40px', 
                    overflowY: 'auto',
                    height: "100%"
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        marginBottom: '30px'
                    }}>
                        <div style={{ 
                            fontSize: '36px', 
                            marginRight: '15px',
                            width: '60px',
                            height: '60px',
                            background: `${token.colorPrimary}10`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {getServiceIcon(currentEditService)}
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                                {t('configure_service', { service: getServiceDisplayName(currentEditService) })}
                            </Title>
                            <Text type="secondary" style={{ fontSize: '15px' }}>
                                {!!configuredServices[currentEditService]?.apiKey 
                                    ? t('service_configured_and_ready') 
                                    : t('service_needs_configuration')}
                            </Text>
                        </div>
                        {!!configuredServices[currentEditService]?.apiKey && activeService === currentEditService && (
                            <ActiveServiceBadge>
                                <span style={{ marginRight: '5px' }}>★</span>
                                {t('currently_default_service')}
                            </ActiveServiceBadge>
                        )}
                    </div>

                    {/* 服务配置区域 */}
                    <div style={{ maxWidth: "680px" }}>
                        <Alert
                            style={{ marginBottom: "25px", borderRadius: "10px" }}
                            message={t('api_key_info')}
                            description={
                                <Text type="secondary">
                                    {t('api_key_source')}{' '}
                                    <a href={getApiKeySourceUrl(currentEditService)} target="_blank" rel="noopener noreferrer">
                                        {getApiKeySourceUrl(currentEditService)}
                                    </a>
                                </Text>
                            }
                            type="info"
                            showIcon
                        />

                        <div style={{ display: 'flex', marginBottom: "25px" }}>
                            <Input.Password
                                size="large"
                                value={currentApiKey}
                                onChange={(e) => setCurrentApiKey(e.target.value)}
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
                                onClick={testApiKey}
                                loading={testingApiKey}
                                disabled={!currentApiKey}
                                style={{ 
                                    marginLeft: '10px',
                                    height: '50px',
                                    borderRadius: '8px'
                                }}
                            >
                                {t('test_api_key')}
                            </Button>
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ fontWeight: 500 }}>{t('model_name')}:</label>
                                {loadingModels && (
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <Spin size="small" style={{ marginRight: '8px' }} />
                                        <Text type="secondary" style={{ fontSize: '13px' }}>{t('loading_models')}</Text>
                                    </div>
                                )}
                                {!loadingModels && currentApiKey && (
                                    <Button 
                                        type="link" 
                                        size="small" 
                                        onClick={fetchAvailableModels}
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
                                        <Button size="small" onClick={fetchAvailableModels} type="primary" ghost>
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
                                        value={currentModelName || undefined}
                                        onChange={(value) => {
                                            console.log('Model selected:', value);
                                            setCurrentModelName(value);
                                        }}
                                        placeholder={getDefaultModelName(currentEditService)}
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
                                        open={undefined} // 不设置open属性，让组件自己控制
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
                                    value={currentModelName}
                                    onChange={(e) => setCurrentModelName(e.target.value)}
                                    placeholder={getDefaultModelName(currentEditService)}
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

                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '25px',
                            padding: '12px 16px',
                            background: '#f9f9f9',
                            borderRadius: '8px'
                        }}>
                            <input 
                                type="checkbox" 
                                id="setAsDefault"
                                checked={activeService === currentEditService}
                                onChange={(e) => {
                                    if (e.target.checked && currentApiKey) {
                                        handleServiceCardClick(currentEditService);
                                    }
                                }}
                                style={{ 
                                    marginRight: '10px',
                                    width: '18px',
                                    height: '18px'
                                }}
                                disabled={!currentApiKey}
                            />
                            <label 
                                htmlFor="setAsDefault" 
                                style={{ 
                                    cursor: currentApiKey ? 'pointer' : 'not-allowed',
                                    opacity: currentApiKey ? 1 : 0.6
                                }}
                            >
                                {t('set_as_default_service')}
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                            <ConfigButton
                                type="primary"
                                onClick={handleSaveService}
                                disabled={!currentApiKey}
                            >
                                {t('save_service_config')}
                            </ConfigButton>
                        </div>

                        {!!configuredServices[currentEditService]?.apiKey && activeService !== currentEditService && (
                            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                <DefaultServiceButton
                                    type="default"
                                    onClick={() => handleServiceCardClick(currentEditService)}
                                >
                                    {t('set_as_default_service')}
                                </DefaultServiceButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings; 