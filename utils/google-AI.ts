const { GoogleGenerativeAI } = require("@google/generative-ai");
import getMeetingCaptions from './getCaptions';
import { getAllAIServiceConfigs } from './getAPIkey';

const googleAITools = {
    model: null,
    aiConversations: {},
    
    init: async function(){
        // 添加警告信息
        console.warn('[DEPRECATED] googleAITools is deprecated and may not respect service selection. Use aiServiceManager instead.');
        
        try {
            // 获取所有 AI 服务配置
            const { aiServices, activeAIService } = await getAllAIServiceConfigs();
            console.log('[googleAITools] Active service:', activeAIService);
            
            if (activeAIService && aiServices[activeAIService]?.apiKey) {
                const apiKey = aiServices[activeAIService].apiKey;
                
                if (activeAIService === 'gemini') {
                    // 初始化 Gemini 服务
                    console.log('[googleAITools] Initializing Gemini with API key');
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const modelName = aiServices[activeAIService].modelName || "gemini-2.0-flash";
                    this.model = genAI.getGenerativeModel({ model: modelName });
                    this.aiConversations = {};
                    
                    return true;
                } else {
                    console.log(`[googleAITools] Active service is not Gemini: ${activeAIService}`);
                    this.model = null;
                    return false;
                }
            } else {
                // 尝试使用旧版逻辑获取 API 密钥
                console.log('[googleAITools] No active service or missing API key, trying legacy method');
                
                return new Promise((resolve) => {
                    chrome.storage.sync.get(['geminiApiKey'], (result) => {
                        if (result.geminiApiKey) {
                            console.log('[googleAITools] Using legacy Gemini API key');
                            const genAI = new GoogleGenerativeAI(result.geminiApiKey);
                            this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                            // 初始化AI对话实例
                            this.aiConversations = {};
                            resolve(true);
                        } else {
                            console.error('[googleAITools] No API key found!');
                            this.model = null;
                            resolve(false);
                        }
                    });
                });
            }
        } catch (error) {
            console.error('[googleAITools] Error initializing:', error);
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
        
        // 创建新对话并插入会议记录作为上下文
        const chat = this.model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `这是之前的会议内容: ${JSON.stringify(meetingContent)}` }],
                },
                {
                    role: "model", 
                    parts: [{ text: "我已了解会议内容，请问有什么需要我帮助的？" }],
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
