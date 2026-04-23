/**
 * AI service configuration types (now using string-based provider IDs)
 */

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
const getAPIkey = (serviceType?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['AIs'], (result) => {
            if (!result.AIs || !result.AIs.data || result.AIs.data.length === 0) {
                reject('No AI services configured');
                return;
            }

            const aisConfig: AIsConfig = result.AIs;
            const targetService = serviceType || aisConfig.active;
            
            // Find the service configuration
            const serviceConfig = aisConfig.data.find(config => config.aiName === targetService);
            
            if (serviceConfig && serviceConfig.apiKey) {
                resolve(serviceConfig.apiKey);
            } else {
                reject(`${targetService} API key not found`);
            }
        });
    });
};

/**
 * Get all AI service configurations
 */
export const getAllAIServiceConfigs = (): Promise<AIsConfig> => {
    return new Promise<AIsConfig>((resolve) => {
        chrome.storage.sync.get(['AIs'], (result) => {
            if (result.AIs && Array.isArray(result.AIs.data)) {
                resolve(result.AIs);
            } else {
                resolve({ active: '', data: [] });
            }
        });
    });
};

/**
 * Save AI service configuration
 * @param {AIServiceConfig} serviceConfig - AI service configuration
 * @param {boolean} setAsActive - Whether to set as active service
 */
export const saveAIServiceConfig = (
    serviceConfig: AIServiceConfig,
    setAsActive: boolean = false
): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        // Get current configuration
        getAllAIServiceConfigs().then((currentConfig) => {
            // Update or add the service configuration
            const existingIndex = currentConfig.data.findIndex(
                config => config.aiName === serviceConfig.aiName
            );
            
            if (existingIndex >= 0) {
                // Update existing configuration
                currentConfig.data[existingIndex] = serviceConfig;
            } else {
                // Add new configuration
                currentConfig.data.push(serviceConfig);
            }
            
            // Update active service if requested
            if (setAsActive) {
                currentConfig.active = serviceConfig.aiName;
            }
            
            // Save to storage
            chrome.storage.sync.set({ AIs: currentConfig }, () => {
                resolve();
            });
        }).catch(reject);
    });
};

/**
 * Remove AI service configuration
 * @param {string} aiName - AI service name to remove
 */
export const removeAIServiceConfig = (aiName: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        getAllAIServiceConfigs().then((currentConfig) => {
            // Remove the service configuration
            currentConfig.data = currentConfig.data.filter(
                config => config.aiName !== aiName
            );
            
            // If the removed service was active, set first available as active
            if (currentConfig.active === aiName) {
                currentConfig.active = currentConfig.data.length > 0 
                    ? currentConfig.data[0].aiName 
                    : 'google-gemini';
            }
            
            // Save to storage
            chrome.storage.sync.set({ AIs: currentConfig }, () => {
                resolve();
            });
        }).catch(reject);
    });
};

/**
 * Set active AI service
 * @param {string} aiName - AI service name to set as active
 */
export const setActiveAIService = (aiName: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        getAllAIServiceConfigs().then((currentConfig) => {
            // Check if the service exists in configuration
            const serviceExists = currentConfig.data.some(
                config => config.aiName === aiName
            );
            
            if (serviceExists) {
                currentConfig.active = aiName;
                chrome.storage.sync.set({ AIs: currentConfig }, () => {
                    resolve();
                });
            } else {
                reject(new Error(`Service ${aiName} not found in configuration`));
            }
        }).catch(reject);
    });
};

/**
 * Get active AI service configuration
 * @returns {Promise<AIServiceConfig>} - Returns active service configuration
 */
export const getActiveAIServiceConfig = (): Promise<AIServiceConfig> => {
    return new Promise<AIServiceConfig>((resolve, reject) => {
        getAllAIServiceConfigs().then((aisConfig) => {
            const activeConfig = aisConfig.data.find(config => config.aiName === aisConfig.active);
            
            if (activeConfig) {
                resolve(activeConfig);
            } else {
                reject(new Error(`Active service ${aisConfig.active} configuration not found`));
            }
        }).catch(reject);
    });
};

export default getAPIkey;
