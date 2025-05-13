import type { IAIService, IAIServiceFactory, AIServiceConfig } from './AIServiceInterface';
import { GeminiAIService } from './GeminiAIService';
import { OpenAIService } from './OpenAIService';
import { XAIService } from './XAIService';

/**
 * Gemini AI服务工厂
 */
export class GeminiAIServiceFactory implements IAIServiceFactory {
  createService(config: AIServiceConfig): IAIService {
    return new GeminiAIService(config);
  }

  getSupportedServiceType(): string {
    return 'gemini';
  }
}

/**
 * OpenAI服务工厂
 */
export class OpenAIServiceFactory implements IAIServiceFactory {
  createService(config: AIServiceConfig): IAIService {
    return new OpenAIService(config);
  }

  getSupportedServiceType(): string {
    return 'openai';
  }
}

/**
 * XAI服务工厂
 */
export class XAIServiceFactory implements IAIServiceFactory {
  createService(config: AIServiceConfig): IAIService {
    return new XAIService(config);
  }

  getSupportedServiceType(): string {
    return 'xai';
  }
}

/**
 * AI服务工厂管理类
 * 用于注册和获取不同类型的AI服务工厂
 */
export class AIServiceFactoryManager {
  private static instance: AIServiceFactoryManager;
  private factories: Map<string, IAIServiceFactory> = new Map();

  private constructor() {
    // 注册默认的工厂
    this.registerFactory(new GeminiAIServiceFactory());
    this.registerFactory(new OpenAIServiceFactory());
    this.registerFactory(new XAIServiceFactory());
  }

  /**
   * 获取工厂管理器实例（单例模式）
   */
  public static getInstance(): AIServiceFactoryManager {
    if (!AIServiceFactoryManager.instance) {
      AIServiceFactoryManager.instance = new AIServiceFactoryManager();
    }
    return AIServiceFactoryManager.instance;
  }

  /**
   * 注册AI服务工厂
   */
  public registerFactory(factory: IAIServiceFactory): void {
    this.factories.set(factory.getSupportedServiceType(), factory);
  }

  /**
   * 获取指定类型的AI服务工厂
   */
  public getFactory(type: string): IAIServiceFactory | undefined {
    return this.factories.get(type);
  }

  /**
   * 获取所有支持的AI服务类型
   */
  public getSupportedTypes(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * 创建指定类型的AI服务
   */
  public createService(type: string, config: AIServiceConfig): IAIService | null {
    const factory = this.getFactory(type);
    if (!factory) {
      console.error(`No factory found for AI service type: ${type}`);
      return null;
    }
    return factory.createService(config);
  }
} 