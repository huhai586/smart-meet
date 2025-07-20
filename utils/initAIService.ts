import getAPIkey, { getAllAIServiceConfigs } from './getAPIkey';
import aiServiceManager from './ai';

/**
 * 初始化AI服务
 * 会尝试加载储存的配置并初始化相应的AI服务
 */
const initAIService = async () => {
  try {
    // 获取所有AI服务配置
    const { aiServices, activeAIService } = await getAllAIServiceConfigs();
    
    // 如果没有配置，尝试从旧配置中获取
    if (Object.keys(aiServices).length === 0) {
      try {
        const geminiApiKey = await getAPIkey('gemini');
        
        // 初始化Gemini服务
        await aiServiceManager.initService('gemini', { apiKey: geminiApiKey as string });
        aiServiceManager.setCurrentServiceType('gemini');
        
        console.log('AI service initialized with legacy configuration');
        return true;
      } catch (error) {
        console.warn('No legacy API key found:', error);
        return false;
      }
    }
    
    // 初始化所有已配置的服务
    const initPromises = Object.entries(aiServices).map(([type, config]) => {
      return aiServiceManager.initService(type, config as unknown);
    });
    
    await Promise.allSettled(initPromises);
    
    // 设置活动服务
    if (activeAIService && aiServiceManager.isServiceInitialized(activeAIService)) {
      aiServiceManager.setCurrentServiceType(activeAIService);
      console.log(`Set active AI service to ${activeAIService}`);
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