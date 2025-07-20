import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';
import { getPredefinedModels } from '~/components/options/ai-settings/utils/service-helpers';

export interface ModelFetchResult {
  models: string[];
  error?: string;
}

// 获取OpenAI模型列表
export const fetchOpenAIModels = async (apiKey: string): Promise<ModelFetchResult> => {
  try {
    console.log('Fetching OpenAI models via API...');
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `Failed to fetch models: ${response.status}`;
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    // 过滤出仅支持聊天的模型
    const models = data.data
      .filter((model: any) => 
        model.id.includes('gpt') && !model.id.includes('deprecated'))
      .map((model: any) => model.id)
      .sort();
    
    console.log('OpenAI models fetched:', models);
    return { models };
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    // 返回预定义模型作为后备
    const fallbackModels = getPredefinedModels('openai');
    console.log('Using predefined OpenAI models due to error:', fallbackModels);
    return { 
      models: fallbackModels, 
      error: error.message || 'Failed to fetch models'
    };
  }
};

// 获取模型列表的统一入口
export const fetchAvailableModels = async (
  service: AIServiceType, 
  apiKey?: string
): Promise<ModelFetchResult> => {
  // 如果没有API密钥，返回预定义模型
  if (!apiKey) {
    return { models: getPredefinedModels(service) };
  }

  console.log(`Fetching models for ${service}...`);
  
  try {
    let result: ModelFetchResult;
    
    switch (service) {
      case 'openai':
        result = await fetchOpenAIModels(apiKey);
        break;
      case 'gemini':
      case 'xai':
        // 这些服务没有提供模型列表API，使用预设的模型列表
        console.log(`Using predefined ${service} models:`, getPredefinedModels(service));
        result = { models: getPredefinedModels(service) };
        break;
      default:
        result = { models: [], error: 'Unsupported service' };
    }
    
    // 确保只显示当前服务对应的模型
    const filteredModels = result.models.filter(model => {
      if (service === 'openai') return model.includes('gpt');
      if (service === 'gemini') return model.includes('gemini');
      if (service === 'xai') return model.includes('grok');
      return true;
    });
    
    console.log(`Setting filtered models for ${service}:`, filteredModels);
    return { ...result, models: filteredModels };
    
  } catch (error) {
    console.error('Error fetching models:', error);
    // 即使有错误，也设置一个默认的模型列表
    const fallbackModels = getPredefinedModels(service);
    console.log(`Setting ${service} models (after error):`, fallbackModels);
    return { 
      models: fallbackModels, 
      error: error.message || 'Failed to fetch models' 
    };
  }
};
