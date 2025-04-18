const { GoogleGenerativeAI } = require("@google/generative-ai");

const googleAITools = {
    init: function(){
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                console.log('result.geminiApiKey', result.geminiApiKey);
                const genAI = new GoogleGenerativeAI(result.geminiApiKey);
                this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                // 初始化聊天历史和会话实例
                this.chatHistory = {};
                this.chatSessions = {};
            } else {
                console.error('No API key found!');
            }
        })
    },
    // Check if AI service is ready by verifying the model is initialized
    isAIReady: function(): boolean {
        return !!this.model;
    },
    // 保存指定模式的会议内容作为上下文
    saveMeetingContext: function(mode, meetingContent) {
        if (!this.chatHistory) {
            this.chatHistory = {};
        }
        this.chatHistory[mode] = meetingContent;
        
        // 创建一个新的聊天会话
        this.initChatSession(mode);
    },
    // 获取指定模式的会议上下文
    getMeetingContext: function(mode) {
        if (!this.chatHistory) {
            return null;
        }
        return this.chatHistory[mode];
    },
    // 初始化或重置特定模式的聊天会话
    initChatSession: function(mode) {
        if (!this.model) {
            console.error('Model not initialized');
            return;
        }
        
        if (!this.chatSessions) {
            this.chatSessions = {};
        }
        
        // 创建新会话并插入初始上下文
        if (this.chatHistory && this.chatHistory[mode]) {
            const chat = this.model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: `这是之前的会议内容: ${this.chatHistory[mode]}` }],
                    },
                    {
                        role: "model", 
                        parts: [{ text: "我已了解会议内容，请问有什么需要我帮助的？" }],
                    }
                ],
            });
            this.chatSessions[mode] = chat;
            console.log(`Chat session for ${mode} initialized`);
        }
    },
    // 获取特定模式的聊天会话，如果不存在则创建
    getChatSession: function(mode) {
        if (!this.chatSessions || !this.chatSessions[mode]) {
            this.initChatSession(mode);
        }
        return this.chatSessions[mode];
    },
    // 清除特定模式的聊天会话
    clearChatSession: function(mode) {
        if (this.chatSessions && this.chatSessions[mode]) {
            delete this.chatSessions[mode];
            console.log(`Chat session for ${mode} cleared`);
        }
    },
    askGoogleAI: async function (prompt: string, mode = null, useContext = false) {
        let result;
        
        if (useContext && mode && this.chatHistory && this.chatHistory[mode]) {
            // 获取或创建该模式的聊天会话
            const chatSession = this.getChatSession(mode);
            
            // 使用已有会话发送消息，保持上下文连贯性
            try {
                result = await chatSession.sendMessage(prompt);
                console.log(`Used existing chat session for ${mode}`);
            } catch (error) {
                console.error(`Error with chat session: ${error.message}`);
                // 如果会话出错，重新初始化并尝试
                this.initChatSession(mode);
                const newSession = this.getChatSession(mode);
                result = await newSession.sendMessage(prompt);
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
