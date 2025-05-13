import type { AIServiceConfig } from './AIServiceInterface';
import { BaseAIService } from './BaseAIService';

/**
 * OpenAI服务实现
 */
export class OpenAIService extends BaseAIService {
  private client: any = null;
  
  constructor(config: AIServiceConfig) {
    super(config);
  }

  /**
   * 初始化OpenAI服务
   */
  init(): void {
    try {
      if (!this.config.apiKey) {
        console.error('No OpenAI API key provided');
        return;
      }

      // 这里应该导入和初始化OpenAI客户端
      // 此处使用动态导入，确保只有在真正使用OpenAI时才加载相关库
      import('openai').then(({ OpenAI }) => {
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
        });
        
        // 初始化AI对话实例
        this.aiConversations = {};
        this.isInitialized = true;
        
        console.log('OpenAI service initialized');
      }).catch(error => {
        console.error('Failed to load OpenAI module:', error);
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
    }
  }

  /**
   * 创建对话
   */
  protected async createConversation(mode: string, meetingContent: any): Promise<void> {
    if (!this.client) {
      console.error('OpenAI client not initialized');
      return;
    }
    
    // 为每个模式创建对话历史
    this.aiConversations[mode] = [
      { 
        role: "system", 
        content: "You are a helpful assistant for meeting transcripts."
      },
      { 
        role: "user", 
        content: `这是之前的会议内容: ${JSON.stringify(meetingContent)}`
      },
      { 
        role: "assistant", 
        content: "我已了解会议内容，请问有什么需要我帮助的？" 
      }
    ];
  }

  /**
   * 处理AI响应
   */
  protected processResponse(result: any): string {
    return result.choices[0].message.content;
  }

  /**
   * 生成响应
   */
  async generateResponse(prompt: string, mode?: string, useContext?: boolean): Promise<string> {
    if (!this.isReady() || !this.client) {
      throw new Error('OpenAI service not ready');
    }

    let result;
    
    if (useContext && mode) {
      // 获取或创建该模式的对话历史
      const conversation = await this.getConversation(mode);
      
      // 将新的用户消息添加到对话历史
      conversation.push({ role: "user", content: prompt });
      
      try {
        // 发送完整对话历史，保持上下文连贯性
        result = await this.client.chat.completions.create({
          model: this.config.modelName || "gpt-3.5-turbo",
          messages: conversation,
        });
        
        // 将AI回复添加到对话历史
        conversation.push({ 
          role: "assistant", 
          content: result.choices[0].message.content 
        });
        
        console.log(`Used existing OpenAI conversation for ${mode}`);
      } catch (error) {
        console.error(`Error with OpenAI conversation: ${error.message}`);
        // 如果对话出错，重新初始化并尝试
        await this.initConversation(mode);
        return this.generateResponse(prompt, mode, useContext);
      }
    } else {
      // 普通模式，直接发送提示
      result = await this.client.chat.completions.create({
        model: this.config.modelName || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
      });
    }
    
    return this.processResponse(result);
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'OpenAI';
  }
} 