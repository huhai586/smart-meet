// AI服务类型定义
export const SUPPORTED_SERVICES = ['gemini', 'openai', 'xai'] as const;
export type AIServiceType = typeof SUPPORTED_SERVICES[number];

// 服务显示信息
export const SERVICE_DISPLAY_INFO = {
  gemini: {
    name: 'Google Gemini',
    icon: '🧠',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    defaultModel: 'gemini-2.5-flash'
  },
  openai: {
    name: 'OpenAI GPT',
    icon: '🤖',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-3.5-turbo'
  },
  xai: {
    name: 'xAI Grok',
    icon: '✨',
    apiKeyUrl: 'https://x.ai/api',
    defaultModel: 'grok-1'
  }
} as const;

// 预定义模型列表
export const PREDEFINED_MODELS = {
  // Gemini 模型 - 来源: https://ai.google.dev/models/gemini
  gemini: [
    'gemini-1.0-pro', 
    'gemini-1.5-flash', 
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-pro',
    'gemini-2.5-flash'
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
} as const;
