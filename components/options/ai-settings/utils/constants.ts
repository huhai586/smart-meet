/**
 * AI 服务类型现在是字符串（provider ID from provider-registry）
 * 保留这个类型别名和旧常量以便向后兼容
 */
export type AIServiceType = string;

// Legacy: 旧的 3 个服务，保留用于迁移兼容
export const SUPPORTED_SERVICES = ['google-gemini', 'openai', 'xai-grok'] as const;

// 重导出 provider registry 功能
export { providerRegistry } from '~/utils/ai/provider-registry';
export type { ProviderDefinition, ProviderCategory } from '~/utils/ai/provider-registry';

// Legacy: 保留用于向后兼容的显示信息（新代码应使用 providerRegistry）
export const SERVICE_DISPLAY_INFO = {
  'google-gemini': {
    name: 'Google Gemini',
    icon: '💎',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    defaultModel: 'gemini-2.5-flash'
  },
  openai: {
    name: 'OpenAI GPT',
    icon: '🤖',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini'
  },
  'xai-grok': {
    name: 'xAI Grok',
    icon: '✨',
    apiKeyUrl: 'https://x.ai/api',
    defaultModel: 'grok-3-mini'
  }
} as const;

// Legacy: 保留用于向后兼容
export const PREDEFINED_MODELS = {
  'google-gemini': [
    'gemini-2.5-flash', 'gemini-2.5-pro',
    'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro',
  ],
  openai: [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4',
    'gpt-3.5-turbo', 'o1', 'o1-mini', 'o3-mini',
  ],
  'xai-grok': ['grok-3', 'grok-3-mini', 'grok-2']
} as const;
