/**
 * AI服务接口
 * 定义所有AI服务必须实现的方法
 */
export interface IAIService {
  // 初始化AI服务
  init(): void;
  
  // 检查AI服务是否已准备好
  isReady(): boolean;
  
  // 初始化或重置特定模式的对话
  initConversation(mode: string): Promise<void>;
  
  // 获取特定模式的对话
  getConversation(mode: string): Promise<unknown>;
  
  // 清除特定模式的对话
  clearConversation(mode: string): void;
  
  // 向AI发送提问并获取回答
  generateResponse(prompt: string, mode?: string, useContext?: boolean): Promise<string>;
  
  // 获取服务名称
  getServiceName(): string;
}

/**
 * AI服务配置接口
 */
export interface AIServiceConfig {
  apiKey: string;
  modelName?: string;
  [key: string]: unknown; // 允许其他配置项
}

/**
 * AI服务工厂接口
 */
export interface IAIServiceFactory {
  // 创建AI服务实例
  createService(config: AIServiceConfig): IAIService;
  
  // 获取支持的服务类型
  getSupportedServiceType(): string;
} 