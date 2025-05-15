import type { AIServiceConfig } from './AIServiceInterface';
import { BaseAIService } from './BaseAIService';

/**
 * XAI (xAI/Grok) 服务实现
 */
export class XAIService extends BaseAIService {
  private client: any = null;
  
  constructor(config: AIServiceConfig) {
    super(config);
  }

  /**
   * 初始化XAI服务
   */
  init(): void {
    try {
      if (!this.config.apiKey) {
        console.error('No xAI API key provided');
        return;
      }

      // Initialize xAI client config
      this.client = {
        apiKey: this.config.apiKey,
        model: this.config.modelName || 'grok-1',
        /**
         * Send a chat completion request to xAI API
         * @param prompt User's question or prompt
         * @param options Additional options for the request
         */
        createCompletion: async (prompt: string, options: any = {}) => {
          const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: this.config.modelName || 'grok-1',
              messages: [
                { role: 'user', content: prompt }
              ],
              ...options
            })
          });

          if (!response.ok) {
            let errorMsg = 'xAI API request failed';
            try {
              const error = await response.json();
              errorMsg = error.error?.message || errorMsg;
            } catch {}
            throw new Error(errorMsg);
          }

          const data = await response.json();
          return {
            text: data.choices?.[0]?.message?.content || '',
            finish_reason: data.choices?.[0]?.finish_reason || 'stop',
          };
        },
        /**
         * Create a conversation object for multi-turn chat
         */
        createConversation: () => {
          return {
            messages: [],
            /**
             * Add a message to the conversation
             */
            addMessage: function(message: { role: string, content: string }) {
              this.messages.push(message);
              return this;
            },
            /**
             * Execute the conversation by sending all messages to xAI API
             */
            execute: async function() {
              const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${this.apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: this.model,
                  messages: this.messages
                })
              });
              if (!response.ok) {
                let errorMsg = 'xAI API request failed';
                try {
                  const error = await response.json();
                  errorMsg = error.error?.message || errorMsg;
                } catch {}
                throw new Error(errorMsg);
              }
              const data = await response.json();
              return {
                text: data.choices?.[0]?.message?.content || '',
                finish_reason: data.choices?.[0]?.finish_reason || 'stop',
              };
            },
            apiKey: this.config.apiKey,
            model: this.config.modelName || 'grok-1',
          };
        }
      };
      // Initialize AI conversation instances
      this.aiConversations = {};
      this.isInitialized = true;
      console.log('XAI service initialized');
    } catch (error) {
      console.error('Failed to initialize XAI service:', error);
    }
  }

  /**
   * 创建对话
   */
  protected async createConversation(mode: string, meetingContent: any): Promise<void> {
    if (!this.client) {
      console.error('XAI client not initialized');
      return;
    }
    
    // 创建对话并初始化
    const conversation = this.client.createConversation();
    
    // 添加系统消息和会议内容
    conversation.addMessage({
      role: 'system',
      content: 'You are a helpful assistant for meeting transcripts.'
    });
    
    conversation.addMessage({
      role: 'user',
      content: `这是之前的会议内容: ${JSON.stringify(meetingContent)}`
    });
    
    conversation.addMessage({
      role: 'assistant',
      content: '我已了解会议内容，请问有什么需要我帮助的？'
    });
    
    // 存储会话对象
    this.aiConversations[mode] = conversation;
  }

  /**
   * 处理AI响应
   */
  protected processResponse(result: any): string {
    return result.text;
  }

  /**
   * 生成响应
   */
  async generateResponse(prompt: string, mode?: string, useContext?: boolean): Promise<string> {
    if (!this.isReady() || !this.client) {
      throw new Error('XAI service not ready');
    }

    let result;
    
    if (useContext && mode) {
      // 获取或创建对话
      const conversation = await this.getConversation(mode);
      
      try {
        // 添加用户问题
        conversation.addMessage({
          role: 'user',
          content: prompt
        });
        
        // 执行对话
        result = await conversation.execute();
        
        // 添加AI回复到对话历史
        conversation.addMessage({
          role: 'assistant',
          content: result.text
        });
        
        console.log(`Used existing XAI conversation for ${mode}`);
      } catch (error) {
        console.error(`Error with XAI conversation: ${error.message}`);
        // 如果对话出错，重新初始化并尝试
        await this.initConversation(mode);
        const newConversation = await this.getConversation(mode);
        
        newConversation.addMessage({
          role: 'user',
          content: prompt
        });
        
        result = await newConversation.execute();
      }
    } else {
      // 普通模式，直接发送提示
      result = await this.client.createCompletion(prompt, {
        modelId: this.client.model,
      });
    }
    
    return this.processResponse(result);
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'xAI';
  }
} 