import type { GenerateResponseOptions } from './UnifiedAIService';
import { UnifiedAIService, type IAIService } from './UnifiedAIService';

// AIServiceConfig 直接在此定义，不再依赖 AIServiceInterface
export interface AIServiceConfig {
  apiKey: string;
  modelName?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

/**
 * AI服务管理类
 * 用于管理和提供AI服务实例
 */
export class AIServiceManager {
  private static instance: AIServiceManager;
  private currentServiceType: string = '';
  private services: Map<string, IAIService> = new Map();

  private constructor() {}

  /**
   * 获取服务管理器实例（单例模式）
   */
  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * 初始化指定类型的AI服务
   */
  public async initService(type: string, config: AIServiceConfig): Promise<IAIService | null> {
    // 如果服务已存在，先清除它
    if (this.services.has(type)) {
      this.services.delete(type);
    }

    // 使用 UnifiedAIService 创建服务
    try {
      const service = new UnifiedAIService(type, {
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
        modelName: config.modelName,
      });
      service.init();
      this.services.set(type, service);
      console.log(`AI service ${type} initialized`);
      return service;
    } catch (error) {
      console.error(`Failed to initialize AI service: ${type}`, error);
      return null;
    }
  }

  /**
   * 设置当前使用的AI服务类型
   */
  public setCurrentServiceType(type: string): void {
    if (!this.services.has(type)) {
      console.warn(`AI service ${type} not initialized, cannot set as current service`);
      return;
    }
    this.currentServiceType = type;
    console.log(`Current AI service set to ${type}`);
  }

  /**
   * 获取当前的AI服务类型
   */
  public getCurrentServiceType(): string {
    return this.currentServiceType;
  }

  /**
   * 获取指定类型的AI服务实例
   */
  public getService(type?: string): IAIService | null {
    const serviceType = type || this.currentServiceType;
    const service = this.services.get(serviceType);

    if (!service) {
      console.error(`AI service ${serviceType} not found`);
      return null;
    }

    return service;
  }

  /**
   * 获取当前AI服务实例
   */
  public getCurrentService(): IAIService | null {
    return this.getService();
  }

  /**
   * 获取所有已初始化的AI服务类型
   */
  public getInitializedServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 检查指定类型的服务是否已初始化
   */
  public isServiceInitialized(type: string): boolean {
    const service = this.services.get(type);
    return !!service && service.isReady();
  }

  /**
   * 向当前AI服务发送请求
   */
  public async generateResponse(options: GenerateResponseOptions): Promise<string> {
    const service = this.getCurrentService();
    if (!service) {
      throw new Error('No active AI service available');
    }

    if (!service.isReady()) {
      throw new Error('Current AI service is not ready');
    }

    return service.generateResponse(options);
  }
}