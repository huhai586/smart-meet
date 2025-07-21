import { getAllAIServiceConfigs } from './getAI';
import aiServiceManager from './ai';

/**
 * 初始化AI服务
 * 会尝试加载储存的配置并初始化相应的AI服务
 */
const initAIService = async () => {
  try {
    // 获取所有AI服务配置
    const aisConfig = await getAllAIServiceConfigs();
    
    // 如果没有配置的服务，直接返回false
    if (aisConfig.data.length === 0) {
      console.log('No AI services configured');
      return false;
    }
    
    // 初始化所有已配置的服务
    const initPromises = aisConfig.data.map((serviceConfig) => {
      return aiServiceManager.initService(serviceConfig.aiName, {
        apiKey: serviceConfig.apiKey,
        modelName: serviceConfig.modelName
      });
    });
    
    await Promise.allSettled(initPromises);
    
    // 设置活动服务
    const activeService = aisConfig.active;
    if (activeService && aiServiceManager.isServiceInitialized(activeService)) {
      aiServiceManager.setCurrentServiceType(activeService);
      console.log(`Set active AI service to ${activeService}`);
    } else {
      // 如果当前没有活动服务或活动服务未初始化，尝试使用第一个可用的服务
      const availableServices = aiServiceManager.getInitializedServices();
      if (availableServices.length > 0) {
        aiServiceManager.setCurrentServiceType(availableServices[0]);
        console.log(`Fallback to available AI service: ${availableServices[0]}`);
      } else {
        console.error('No AI services were successfully initialized');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize AI services:', error);
    return false;
  }
};

export default initAIService; 