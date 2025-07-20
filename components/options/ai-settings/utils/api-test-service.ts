import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';

export interface APITestResult {
  isValid: boolean;
  errorMessage?: string;
  isWarning?: boolean;
}

// 测试OpenAI API密钥
export const testOpenAIKey = async (apiKey: string): Promise<APITestResult> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { isValid: true };
    } else {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      return { 
        isValid: false, 
        errorMessage: error.error?.message || 'API key invalid' 
      };
    }
  } catch (error) {
    console.error('Error testing OpenAI API key:', error);
    return { 
      isValid: false, 
      errorMessage: 'Network error' 
    };
  }
};

// 测试Gemini API密钥
export const testGeminiKey = async (apiKey: string): Promise<APITestResult> => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    
    if (response.ok) {
      return { isValid: true };
    } else {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      return { 
        isValid: false, 
        errorMessage: error.error?.message || 'API key invalid' 
      };
    }
  } catch (error) {
    console.error('Error testing Gemini API key:', error);
    return { 
      isValid: false, 
      errorMessage: error.message || 'Network error' 
    };
  }
};

// 测试xAI API密钥（简单格式验证）
export const testXAIKey = async (apiKey: string): Promise<APITestResult> => {
  // xAI暂时没有简单的测试端点，进行格式验证
  if (apiKey.length > 20) {
    return { 
      isValid: true, 
      isWarning: true,
      errorMessage: 'API key format valid but not tested' 
    };
  } else {
    return { 
      isValid: false, 
      errorMessage: 'API key format invalid' 
    };
  }
};

// 测试API密钥的统一入口
export const testAPIKey = async (service: AIServiceType, apiKey: string): Promise<APITestResult> => {
  if (!apiKey) {
    return { 
      isValid: false, 
      errorMessage: 'Please enter API key first' 
    };
  }

  switch (service) {
    case 'openai':
      return testOpenAIKey(apiKey);
    case 'gemini':
      return testGeminiKey(apiKey);
    case 'xai':
      return testXAIKey(apiKey);
    default:
      return { 
        isValid: false, 
        errorMessage: 'Unsupported service' 
      };
  }
};
