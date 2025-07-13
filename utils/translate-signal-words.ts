import { Actions } from "~components/captions/types"
import askAI from "~utils/askAI"
import {setTranslatedWords} from "~utils/translate";
import { getTranslation } from "~utils/i18n";
import { getCurrentUILanguage } from "~hooks/useUILanguage";
import messageManager from "~utils/message-manager";

const translateSingleWords = async (text: string): Promise<string> => {
    try {


        // Attempt to translate using AI
        const result = await askAI(Actions.TRANSLATE, text);
        return result;
    } catch (error) {
        console.error('[translateSingleWords] Error:', error);
        
        // 直接返回原始错误信息，不进行美化处理
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || 'Unknown error occurred';
        
        // 直接返回原始错误信息
        return `Translation failed: ${errorMessage}`;
    }
}

export default translateSingleWords;
