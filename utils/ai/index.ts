// 导出接口
export type { IAIService, GenerateResponseOptions } from './UnifiedAIService';

// 导出统一服务实现
export { UnifiedAIService } from './UnifiedAIService';

// 导出调用层（原生 SDK）
export { generateChatCompletion, testConnection, fetchAvailableModels } from './model-factory';
export type { ModelConfig, ChatMessage } from './model-factory';

// 导出 Provider 注册表
export { providerRegistry } from './provider-registry';
export type { ProviderDefinition, ProviderCategory, ProviderType } from './provider-registry';

// 导出服务管理类
export { AIServiceManager } from './AIServiceManager';

// 默认导出：服务管理器单例
import { AIServiceManager } from './AIServiceManager';
export default AIServiceManager.getInstance();
