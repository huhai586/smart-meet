import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useI18n } from '../../utils/i18n';
import getAiSummary from '../../utils/get-ai-summary';
import aiServiceManager from '../../utils/ai';
import { Actions } from '../captions/caption';
import { useDateContext } from '../../contexts/DateContext';
import type { CardItemType } from './SummaryCard';

export const useSummary = () => {
  const { t } = useI18n();
  const [requesting, setRequesting] = useState(false);
  const [cardData, setCardData] = useState<CardItemType[]>([]);
  const { selectedDate } = useDateContext();
  const [messageApi, contextHolder] = message.useMessage();

  // 处理日期变化
  useEffect(() => {
    try {
      console.log('[useSummary] Clearing AI conversation due to date change');
      
      // 获取当前 AI 服务
      const currentService = aiServiceManager.getCurrentService();
      if (currentService) {
        console.log(`[useSummary] Using service: ${aiServiceManager.getCurrentServiceType()}`);
        
        // 如果服务支持清除对话，则清除对话
        if (typeof currentService.clearConversation === 'function') {
          currentService.clearConversation(Actions.ASK);
        } else {
          console.log('[useSummary] Current service does not support clearConversation');
        }
      } else {
        console.warn('[useSummary] No active AI service found');
      }
      
      // 清空当前显示的卡片数据
      setCardData([]);
    } catch (error) {
      console.error('[useSummary] Error clearing AI conversation:', error);
      messageApi.error({
        content: t('error_clearing_conversation') || 'Error clearing conversation',
        duration: 3,
      });
    }
  }, [selectedDate]);

  // 处理数据请求
  useEffect(() => {
    cardData.forEach((item, index) => {
      if (item.fetchComplete) {
        return;
      }
      
      const newCardData = [...cardData];
      setRequesting(true);
      
      getAiSummary(item.question)
        .then((res) => {
          newCardData[index].answer = res;
          newCardData[index].fetchComplete = true;
          newCardData[index].error = undefined;
        })
        .catch((err) => {
          console.warn('err', err);
          newCardData[index].fetchComplete = true;
          
          // getAiSummary内部使用askAI，AI服务错误已经在askAI中处理
          // 这里只处理其他类型的错误
          const errorMessage = typeof err === 'string' ? err : (err?.message || 'Unknown error occurred');
          newCardData[index].error = errorMessage;
          
          // 只有非AI服务错误才显示错误消息（AI服务错误已经在askAI中处理）
          if (!errorMessage.toLowerCase().includes('ai service')) {
            messageApi.open({
              type: 'error',
              content: errorMessage,
            });
          }
        })
        .finally(() => {
          setRequesting(false);
          setCardData(newCardData);
        });
    });
  }, [cardData]);

  // 添加新问题
  const handleQuestion = async (question = t('summary_question')) => {
    const newCardData = [...cardData, {
      question, 
      answer: '', 
      fetchComplete: false,
      createdAt: Date.now()
    }];
    setCardData(newCardData);
  };

  return {
    cardData,
    requesting,
    handleQuestion,
    contextHolder
  };
}; 