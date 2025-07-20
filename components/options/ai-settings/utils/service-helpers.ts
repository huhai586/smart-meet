import { SERVICE_DISPLAY_INFO, PREDEFINED_MODELS } from '~/components/options/ai-settings/utils/constants';
import type { AIServiceType } from '~/components/options/ai-settings/utils/constants';

// 获取服务显示名称
export const getServiceDisplayName = (service: AIServiceType): string => {
  return SERVICE_DISPLAY_INFO[service]?.name || service;
};

// 获取服务图标
export const getServiceIcon = (service: AIServiceType): string => {
  return SERVICE_DISPLAY_INFO[service]?.icon || '🔧';
};

// 获取服务默认模型名称
export const getDefaultModelName = (service: AIServiceType): string => {
  return SERVICE_DISPLAY_INFO[service]?.defaultModel || '';
};

// 获取服务API密钥获取网址
export const getApiKeySourceUrl = (service: AIServiceType): string => {
  return SERVICE_DISPLAY_INFO[service]?.apiKeyUrl || '';
};

// 获取预定义模型列表
export const getPredefinedModels = (service: AIServiceType): string[] => {
  return PREDEFINED_MODELS[service] || [];
};
