import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useI18n } from '../../utils/i18n';
import getAiSummary from '../../utils/get-ai-summary';
import googleAITools from '../../utils/google-AI';
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
      console.log('Clearing AI conversation due to date change');
      googleAITools.clearConversation(Actions.ASK);
      // 清空当前显示的卡片数据
      setCardData([]);
    } catch (error) {
      console.error('Error clearing AI conversation:', error);
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
        })
        .catch((err) => {
          console.warn('err', err);
          newCardData[index].fetchComplete = true;
          messageApi.open({
            type: 'error',
            content: err,
          });
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