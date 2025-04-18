const { GoogleGenerativeAI } = require("@google/generative-ai");
import getMeetingCaptions from './getCaptions';

const googleAITools = {
    init: function(){
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                console.log('result.geminiApiKey', result.geminiApiKey);
                const genAI = new GoogleGenerativeAI(result.geminiApiKey);
                this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                // 初始化AI对话实例
                this.aiConversations = {};
            } else {
                console.error('No API key found!');
            }
        })
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
