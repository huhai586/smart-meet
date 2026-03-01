import type { AIServiceConfig, GenerateResponseOptions } from './AIServiceInterface';
import type { Dayjs } from 'dayjs';
import { BaseAIService } from './BaseAIService';
import { getCurrentUILanguage } from '../../hooks/useUILanguage';
import { getTranslation } from '../i18n';
import OpenAI from 'openai';

/**
 * OpenAI服务实现
 */
export class OpenAIService extends BaseAIService {
  private client: OpenAI | null = null;

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

      if (!OpenAI) {
        console.error('OpenAI library not properly loaded');
        return;
      }

      try {
        // 初始化OpenAI客户端
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          dangerouslyAllowBrowser: true
        });

        // 初始化AI对话实例
        this.aiConversations = {};
        this.isInitialized = true;

        console.log('OpenAI service initialized');
      } catch (initError) {
        console.error('Failed to initialize OpenAI client:', initError);
        return;
      }
    } catch (error) {
      console.error('Fatal error initializing OpenAI service:', error);
    }
  }

  /**
   * 检查服务是否准备就绪，增加客户端检查
   */
  isReady(): boolean {
    return this.isInitialized && !!this.client;
  }

  /**
   * 创建对话
   */
  protected async createConversation(mode: string, meetingContent: unknown): Promise<void> {
    if (!this.client) {
      console.error('OpenAI client not initialized');
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

    const conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: messages.systemPromptMeeting
      },
      {
        role: "user",
        content: `${messages.meetingContentIntro}${JSON.stringify(meetingContent)}`
      },
      {
        role: "assistant",
        content: messages.assistantReady
      }
    ];
    // 为每个模式创建对话历史
    this.aiConversations[mode] = conversationHistory;
  }

  /**
   * 处理AI响应
   */
  protected processResponse(result: unknown): string {
    type OpenAIResult = { choices: Array<{ message: { content: string } }> };
    const r = result as OpenAIResult;
    try {
      if (r && r.choices && r.choices.length > 0 &&
        r.choices[0].message && r.choices[0].message.content) {
        return r.choices[0].message.content;
      }
      console.error('Unexpected OpenAI response format:', result);
      return "Error processing response from OpenAI.";
    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      return "Error processing response from OpenAI.";
    }
  }

  /**
   * 生成响应
   */
  async generateResponse(options: GenerateResponseOptions): Promise<string> {
    const { prompt, mode, useContext, date } = options;

    if (!this.isReady() || !this.client) {
      throw new Error('OpenAI service not ready');
    }

    let result;

    try {
      if (useContext && mode) {
        // 获取或创建该模式的对话历史
        const conversation = await this.getConversation(mode, date) as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

        // 将新的用户消息添加到对话历史
        conversation.push({ role: "user", content: prompt });

        try {
          // 发送完整对话历史，保持上下文连贯性
          result = await this.client.chat.completions.create({
            model: this.config.modelName || "gpt-3.5-turbo",
            messages: conversation,
          });

          // 将AI回复添加到对话历史
          if (result && result.choices && result.choices.length > 0 && result.choices[0].message) {
            conversation.push({
              role: "assistant",
              content: result.choices[0].message.content
            });
          }

          console.log(`Used existing OpenAI conversation for ${mode}`);
        } catch (error) {
          console.error(`Error with OpenAI conversation: ${error.message}`);
          // 如果对话出错，重新初始化并尝试
          await this.initConversation(mode, date);
          return this.generateResponse(options);
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
    } catch (error) {
      console.error('Error generating response from OpenAI:', error);
      throw new Error(`OpenAI Error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'OpenAI';
  }
}
