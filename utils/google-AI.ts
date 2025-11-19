const { GoogleGenerativeAI } = require("@google/generative-ai");
import getMeetingCaptions from './getCaptions';
import { getActiveAIServiceConfig } from './getAI';
import { getCurrentUILanguage } from '../hooks/useUILanguage';
import { getTranslation } from './i18n';

const googleAITools = {
    model: null,
    aiConversations: {},
    
    init: async function(){
        // 添加警告信息
        console.warn('[DEPRECATED] googleAITools is deprecated and may not respect service selection. Use aiServiceManager instead.');
        
        try {
            // 获取当前活动的AI服务配置
            const activeServiceConfig = await getActiveAIServiceConfig();
            console.log('[googleAITools] Active service:', activeServiceConfig.aiName);
            
            if (activeServiceConfig.aiName === 'gemini' && activeServiceConfig.apiKey) {
                // 初始化 Gemini 服务
                console.log('[googleAITools] Initializing Gemini with API key');
                const genAI = new GoogleGenerativeAI(activeServiceConfig.apiKey);
                const modelName = activeServiceConfig.modelName || "gemini-2.0-flash";
                
                // 构建请求选项，如果配置了 baseUrl 则使用自定义 URL
                const requestOptions: any = {};
                if (activeServiceConfig.baseUrl) {
                    requestOptions.baseUrl = activeServiceConfig.baseUrl;
                    console.log('[googleAITools] Using custom Gemini API endpoint:', activeServiceConfig.baseUrl);
                }
                
                this.model = genAI.getGenerativeModel(
                    { model: modelName },
                    Object.keys(requestOptions).length > 0 ? requestOptions : undefined
                );
                this.aiConversations = {};
                
                return true;
            } else {
                console.log(`[googleAITools] Active service is not Gemini: ${activeServiceConfig.aiName}`);
                this.model = null;
                return false;
            }
        } catch (error) {
            console.error('[googleAITools] Initialization error:', error);
            this.model = null;
            return false;
        }
    },
    
    // 重新初始化，用于 API 密钥更新时
    reinit: async function() {
        console.log('[googleAITools] Reinitializing');
        console.warn('[DEPRECATED] googleAITools.reinit() is deprecated. Use aiServiceManager instead.');
        this.model = null;
        this.aiConversations = {};
        return this.init();
    },
    
    // Check if AI service is ready by verifying the model is initialized
    isAIReady: function(): boolean {
        return !!this.model;
    },
    // 初始化或重置特定模式的AI对话
    initConversation: async function(mode) {
        if (!this.model) {
            console.error('Model not initialized');
            return;
        }
        
        if (!this.aiConversations) {
            this.aiConversations = {};
        }
        
        // 获取会议记录
        const meetingContent = await getMeetingCaptions();
        
        // 获取多语言消息
        const currentUILanguage = await getCurrentUILanguage();
        const langCode = currentUILanguage.code;
        const messages = {
            meetingContentIntro: getTranslation('ai_meeting_content_intro', langCode),
            assistantReady: getTranslation('ai_meeting_assistant_ready', langCode),
            systemPromptMeeting: getTranslation('ai_system_prompt_meeting', langCode)
        };
        
        // 创建新对话并插入会议记录作为上下文
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
        console.log(`AI conversation for ${mode} initialized`);
    },
    // 获取特定模式的AI对话，如果不存在则创建
    getConversation: async function(mode) {
        if (!this.aiConversations || !this.aiConversations[mode]) {
            await this.initConversation(mode);
        }
        return this.aiConversations[mode];
    },
    // 清除特定模式的AI对话
    clearConversation: function(mode) {
        if (this.aiConversations && this.aiConversations[mode]) {
            delete this.aiConversations[mode];
            console.log(`AI conversation for ${mode} cleared`);
        }
    },
    askGoogleAI: async function (prompt: string, mode = null, useContext = false) {
        let result;
        
        if (useContext && mode) {
            // 获取或创建该模式的AI对话
            const conversation = await this.getConversation(mode);
            
            // 使用已有对话发送消息，保持上下文连贯性
            try {
                result = await conversation.sendMessage(prompt);
                console.log(`Used existing AI conversation for ${mode}`);
            } catch (error) {
                console.error(`Error with AI conversation: ${error.message}`);
                // 如果对话出错，重新初始化并尝试
                await this.initConversation(mode);
                const newConversation = await this.getConversation(mode);
                result = await newConversation.sendMessage(prompt);
            }
        } else {
            // 普通模式，直接发送提示
            result = await this.model.generateContent(prompt);
        }
        
        return result.response.text();
    }
}
googleAITools.init();

export default googleAITools;
