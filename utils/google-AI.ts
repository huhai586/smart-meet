const { GoogleGenerativeAI } = require("@google/generative-ai");

const googleAITools = {
    init: function(){
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                console.log('result.geminiApiKey', result.geminiApiKey);
                const genAI = new GoogleGenerativeAI(result.geminiApiKey);
                this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            } else {
                console.error('No API key found!');
            }
        })
    },
    askGoogleAI: async function (prompt: string) {
        const result = await this.model.generateContent(prompt);
        return result.response.text()
    }
}
googleAITools.init();

export default googleAITools;
