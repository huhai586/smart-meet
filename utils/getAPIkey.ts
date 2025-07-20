/**
 * 获取特定AI服务的API密钥
 * @param {string} serviceType - AI服务类型 (gemini, openai, xai等)
 * @returns {Promise<string>} - 返回API密钥
 */
const getAPIkey = (serviceType: string = 'gemini') => {
    const keyName = `${serviceType}ApiKey`;
    
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([keyName], (result) => {
            if (result[keyName]) {
                resolve(result[keyName]);
            } else {
                reject(`${serviceType} API key not found`);
            }
        });
    });
};

/**
 * 获取所有已保存的AI服务配置
 * @returns {Promise<Record<string, any>>} - 返回AI服务配置对象
 */
export const getAllAIServiceConfigs = () => {
    return new Promise<Record<string, any>>((resolve, _reject) => {
        chrome.storage.sync.get(['aiServices', 'activeAIService'], (result) => {
            resolve({
                aiServices: result.aiServices || {},
                activeAIService: result.activeAIService || 'gemini'
            });
        });
    });
};

/**
 * 保存AI服务配置
 * @param {string} serviceType - AI服务类型
 * @param {string} apiKey - API密钥
 * @param {boolean} isActive - 是否设为当前活动服务
 * @param {Record<string, any>} additionalConfig - 额外配置
 */
export const saveAIServiceConfig = (
    serviceType: string,
    apiKey: string,
    isActive: boolean = false,
    additionalConfig: Record<string, any> = {}
) => {
    return new Promise<void>((resolve, _reject) => {
        // 先获取现有配置
        chrome.storage.sync.get(['aiServices'], (result) => {
            const aiServices = result.aiServices || {};
            
            // 更新特定服务的配置
            aiServices[serviceType] = {
                apiKey,
                ...additionalConfig
            };
            
            // 更新存储
            const updateData: Record<string, any> = { aiServices };
            
            // 如果设为活动服务，则同时更新activeAIService
            if (isActive) {
                updateData.activeAIService = serviceType;
            }
            
            chrome.storage.sync.set(updateData, () => {
                resolve();
            });
        });
    });
};

export default getAPIkey;
