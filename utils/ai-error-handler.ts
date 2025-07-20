import { Modal } from 'antd';
import { getTranslation } from './i18n';
import { getCurrentUILanguage } from '../hooks/useUILanguage';

/**
 * AI错误处理器
 * 统一处理AI服务相关的错误，特别是"AI service not ready"错误
 */
class AIErrorHandler {
    private static instance: AIErrorHandler;
    private isModalShowing = false;

    private constructor() {}

    public static getInstance(): AIErrorHandler {
        if (!AIErrorHandler.instance) {
            AIErrorHandler.instance = new AIErrorHandler();
        }
        return AIErrorHandler.instance;
    }

    /**
     * 处理AI错误
     * @param error 错误信息
     * @returns true if handled, false if should be handled by caller
     */
    public handleError(error: unknown): boolean {
        const errorMessage = typeof error === 'string' ? error : error?.message || '';
        
        // 检查是否为AI服务未准备好的错误
        if (this.isAIServiceNotReadyError(errorMessage)) {
            this.showAIConfigModal();
            return true; // 已处理
        }
        
        return false; // 未处理，由调用者处理
    }

    /**
     * 检查是否为AI服务未准备好的错误
     */
    private isAIServiceNotReadyError(errorMessage: string): boolean {
        const aiServiceErrors = [
            'AI service not ready',
            'No active AI service available',
            'Current AI service is not ready',
            'Gemini AI service not ready',
            'OpenAI service not ready',
            'XAI service not ready'
        ];
        
        return aiServiceErrors.some(pattern => 
            errorMessage.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
     * 显示AI配置模态框
     */
    private async showAIConfigModal(): Promise<void> {
        // 防止重复显示
        if (this.isModalShowing) {
            return;
        }

        this.isModalShowing = true;

        // 获取当前UI语言
        const currentUILanguage = await getCurrentUILanguage();
        const langCode = currentUILanguage.code;

        // 获取本地化文本
        const title = getTranslation('ai_service_configuration_required', langCode);
        const content = getTranslation('ai_service_not_configured_message', langCode);
        const okText = getTranslation('go_to_options', langCode);
        const cancelText = getTranslation('cancel', langCode);

        Modal.confirm({
            title,
            content,
            okText,
            cancelText,
            onOk: () => {
                // 打开Options页面
                chrome.runtime.openOptionsPage();
                this.isModalShowing = false;
            },
            onCancel: () => {
                this.isModalShowing = false;
            },
            afterClose: () => {
                this.isModalShowing = false;
            }
        });
    }
}

// 导出单例实例
export const aiErrorHandler = AIErrorHandler.getInstance();

/**
 * 便捷函数：处理AI错误
 * @param error 错误信息
 * @returns true if handled, false if should be handled by caller
 */
export const handleAIError = (error: unknown): boolean => {
    return aiErrorHandler.handleError(error);
};

export default aiErrorHandler;