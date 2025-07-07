import type { AIServiceConfig } from './AIServiceInterface';
import { BaseAIService } from './BaseAIService';
import { getCurrentUILanguage } from '../../hooks/useUILanguage';
import { getTranslation } from '../i18n';

const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Gemini AI服务实现
 */
export class GeminiAIService extends BaseAIService {
  private model: any = null;

  constructor(config: AIServiceConfig) {
    super(config);
  }

  /**
   * 初始化Gemini AI服务
   */
  init(): void {
    try {
      if (!this.config.apiKey) {
        console.error('No Gemini API key provided');
        return;
      }

      const genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = genAI.getGenerativeModel({ 
        model: this.config.modelName || "gemini-2.0-flash" 
      });
      
      // 初始化AI对话实例
      this.aiConversations = {};
      this.isInitialized = true;
      
      console.log('Gemini AI service initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini AI service:', error);
    }
  }

  /**
   * 创建对话
   */
  protected async createConversation(mode: string, meetingContent: any): Promise<void> {
    if (!this.model) {
      console.error('Gemini model not initialized');
      return;
    }
    
    // 获取多语言消息
    const currentUILanguage = await getCurrentUILanguage();
    const langCode = currentUILanguage.code;
    const messages = {
      meetingContentIntro: getTranslation('ai_meeting_content_intro', langCode),
      assistantReady: getTranslation('ai_meeting_assistant_ready', langCode),
      systemPromptMeeting: getTranslation('ai_system_prompt_meeting', langCode)
    };
    
    // 创建新对话并插入会议记录作为上下文
    try {
      const chat = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `${messages.meetingContentIntro}${JSON.stringify(meetingContent)}` }],
          },
          {
            role: "model", 
            parts: [{ text: messages.assistantReady }],
          }
        ],
      });
      
      this.aiConversations[mode] = chat;
    } catch (error) {
      console.error(`Error creating Gemini conversation: ${error}`);
      throw error;
    }
  }

  /**
   * 处理AI响应
   */
  protected processResponse(result: any): string {
    return result.response.text();
  }

  /**
   * 生成响应
   */
  async generateResponse(prompt: string, mode?: string, useContext?: boolean): Promise<string> {
    if (!this.isReady() || !this.model) {
      throw new Error('Gemini AI service not ready');
    }

    let result;
    
    if (useContext && mode) {
      // 获取或创建该模式的AI对话
      const conversation = await this.getConversation(mode);
      
      // 使用已有对话发送消息，保持上下文连贯性
      try {
        result = await conversation.sendMessage(prompt);
        console.log(`Used existing Gemini AI conversation for ${mode}`);
      } catch (error) {
        console.error(`Error with Gemini AI conversation: ${error.message}`);
        // 如果对话出错，重新初始化并尝试
        await this.initConversation(mode);
        const newConversation = await this.getConversation(mode);
        result = await newConversation.sendMessage(prompt);
      }
    } else {
      // 普通模式，直接发送提示
      result = await this.model.generateContent(prompt);
    }
    
    return this.processResponse(result);
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'Gemini';
  }
} 