import type { IAIService, AIServiceConfig } from './AIServiceInterface';
import getMeetingCaptions from '../getCaptions';

/**
 * 基础AI服务抽象类
 * 实现一些通用的功能，让子类继承和扩展
 */
export abstract class BaseAIService implements IAIService {
  protected aiConversations: Record<string, any> = {};
  protected config: AIServiceConfig;
  protected isInitialized: boolean = false;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * 初始化服务 - 由子类实现具体逻辑
   */
  abstract init(): void;

  /**
   * 检查服务是否准备好
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 初始化或重置特定模式的对话 - 子类需要覆盖此方法的部分逻辑
   */
  async initConversation(mode: string): Promise<void> {
    if (!this.isReady()) {
      console.error('AI service not initialized');
      return;
    }
    
    try {
      // 获取会议记录
      const meetingContent = await getMeetingCaptions();
      
      // 子类需要实现的创建对话逻辑
      await this.createConversation(mode, meetingContent);
      
      console.log(`AI conversation for ${mode} initialized`);
    } catch (error) {
      console.error(`Error initializing conversation: ${error}`);
    }
  }

  /**
   * 创建对话 - 由子类实现
   */
  protected abstract createConversation(mode: string, meetingContent: any): Promise<void>;

  /**
   * 获取特定模式的对话，如果不存在则创建
   */
  async getConversation(mode: string): Promise<any> {
    if (!this.aiConversations || !this.aiConversations[mode]) {
      await this.initConversation(mode);
    }
    return this.aiConversations[mode];
  }

  /**
   * 清除特定模式的对话
   */
  clearConversation(mode: string): void {
    if (this.aiConversations && this.aiConversations[mode]) {
      delete this.aiConversations[mode];
      console.log(`AI conversation for ${mode} cleared`);
    }
  }

  /**
   * 处理AI响应 - 由子类实现
   */
  protected abstract processResponse(result: any): string;

  /**
   * 生成响应 - 发送提示并获取回答
   * 子类需要覆盖此方法
   */
  abstract generateResponse(prompt: string, mode?: string, useContext?: boolean): Promise<string>;

  /**
   * 获取服务名称
   */
  abstract getServiceName(): string;
} 