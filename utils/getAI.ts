/**
 * AI service configuration types (now using string-based provider IDs)
 */
import { getConfigValue, setConfigValue } from '~/utils/appConfig';

// Define the new AI configuration structure
export interface AIServiceConfig {
    apiKey: string;
    modelName: string;
    aiName: string; // provider ID from provider-registry, e.g. 'openai', 'google-gemini', 'deepseek'
    baseUrl?: string; // 自定义API端点URL（用于代理）
}

export interface AIsConfig {
    active: string;
    data: AIServiceConfig[];
}


/**
 * Get API key for specific AI service or active service
 * @param {string} serviceType - AI provider ID, if not provided, use active service
 * @returns {Promise<string>} - Returns API key
 */
const getAPIkey = async (serviceType?: string): Promise<string> => {
    const aisConfig = await getAllAIServiceConfigs();
    if (!aisConfig.data || aisConfig.data.length === 0) {
        throw new Error('No AI services configured');
    }
    const targetService = serviceType || aisConfig.active;
    const serviceConfig = aisConfig.data.find(config => config.aiName === targetService);
    if (serviceConfig && serviceConfig.apiKey) {
        return serviceConfig.apiKey;
    }
    throw new Error(`${targetService} API key not found`);
};

/**
 * Get all AI service configurations
 */
export const getAllAIServiceConfigs = async (): Promise<AIsConfig> => {
    const v = await getConfigValue('AIs');
    if (v && Array.isArray(v.data)) {
        return v;
    }
    return { active: '', data: [] };
};

/**
 * Save AI service configuration
 */
export const saveAIServiceConfig = async (
    serviceConfig: AIServiceConfig,
    setAsActive: boolean = false
): Promise<void> => {
    const currentConfig = await getAllAIServiceConfigs();
    const existingIndex = currentConfig.data.findIndex(
        config => config.aiName === serviceConfig.aiName
    );
    if (existingIndex >= 0) {
        currentConfig.data[existingIndex] = serviceConfig;
    } else {
        currentConfig.data.push(serviceConfig);
    }
    if (setAsActive) {
        currentConfig.active = serviceConfig.aiName;
    }
    await setConfigValue('AIs', currentConfig);
};

/**
 * Remove AI service configuration
 */
export const removeAIServiceConfig = async (aiName: string): Promise<void> => {
    const currentConfig = await getAllAIServiceConfigs();
    currentConfig.data = currentConfig.data.filter(config => config.aiName !== aiName);
    if (currentConfig.active === aiName) {
        currentConfig.active = currentConfig.data.length > 0
            ? currentConfig.data[0].aiName
            : 'google-gemini';
    }
    await setConfigValue('AIs', currentConfig);
};

/**
 * Set active AI service
 */
export const setActiveAIService = async (aiName: string): Promise<void> => {
    const currentConfig = await getAllAIServiceConfigs();
    const serviceExists = currentConfig.data.some(config => config.aiName === aiName);
    if (!serviceExists) {
        throw new Error(`Service ${aiName} not found in configuration`);
    }
    currentConfig.active = aiName;
    await setConfigValue('AIs', currentConfig);
};

/**
 * Clear active AI service (set active to empty string)
 */
export const clearActiveAIService = async (): Promise<void> => {
    const currentConfig = await getAllAIServiceConfigs();
    currentConfig.active = '';
    await setConfigValue('AIs', currentConfig);
};

/**
 * Get active AI service configuration
 */
export const getActiveAIServiceConfig = async (): Promise<AIServiceConfig> => {
    const aisConfig = await getAllAIServiceConfigs();
    const activeConfig = aisConfig.data.find(config => config.aiName === aisConfig.active);
    if (activeConfig) {
        return activeConfig;
    }
    throw new Error(`Active service ${aisConfig.active} configuration not found`);
};

export default getAPIkey;
