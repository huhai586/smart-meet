/**
 * Chrome extension message and storage types
 */

export interface ChromeMessage {
  action: string;
  data?: unknown;
  date?: string;
  type?: string;
  [key: string]: unknown;
}

export interface ChromeStorageResult {
  [key: string]: unknown;
}

export interface AIServiceConfig {
  apiKey: string;
  modelName?: string;
  [key: string]: unknown;
}

export interface AIServiceConfigs {
  [serviceType: string]: AIServiceConfig;
}

export interface StorageConfigResult {
  aiServices?: AIServiceConfigs;
  activeAIService?: string;
}
