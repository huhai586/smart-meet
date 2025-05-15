import React from 'react';
import { Card, Spin, Badge, Tag } from 'antd';
import { LoadingOutlined, MessageOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import MarkdownRenderer from './MarkdownRenderer';
import { useI18n } from '../../utils/i18n';
import '../../styles/summary.scss';

export interface CardItemType {
  question: string;
  answer: string;
  fetchComplete: boolean;
  createdAt?: number;
  error?: string;
}

interface SummaryCardProps {
  item: CardItemType;
  loading: boolean;
  index: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ item, loading, index }) => {
  const { t } = useI18n();

  // 格式化时间显示
  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Spin
      spinning={loading && !item.fetchComplete}
      indicator={<LoadingOutlined spin />}
      size="large"
      fullscreen={false}
      tip={t('loading')}
      key={index}
    >
      <Card
        title={
          <div className="card-title-container">
            <QuestionCircleOutlined className="card-title-icon" />
            <span>{item.question}</span>
            {item.createdAt && (
              <Tag color="blue" className="card-time-tag">
                {formatTime(item.createdAt)}
              </Tag>
            )}
          </div>
        }
        className={'card-container'}
        extra={<Badge status={item.fetchComplete ? "success" : "processing"} text={item.fetchComplete ? t('completed') : t('loading')} />}
      >
        <div className="summary-container">
          {item.fetchComplete && <MessageOutlined className="response-icon" />}
          {item.error ? (
            <div className="summary-error-message" style={{ color: 'red' }}>{item.error}</div>
          ) : (
            <MarkdownRenderer content={item.answer} />
          )}
        </div>
      </Card>
    </Spin>
  );
};

export default SummaryCard; 