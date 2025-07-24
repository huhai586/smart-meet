import React from 'react';
import { Card, Button, Typography, Space, Divider } from 'antd';
import { useI18n } from '../utils/i18n';
import GuideAnimation from '../components/common/GuideAnimation';
import './welcome.scss';

const { Title, Paragraph, Text } = Typography;

const Welcome: React.FC = () => {
  const { t } = useI18n();
  
  const features = [
    {
      title: t('welcome_feature_realtime_translation'),
      description: t('welcome_feature_realtime_translation_desc')
    },
    {
      title: t('welcome_feature_smart_summary'),
      description: t('welcome_feature_smart_summary_desc')
    },
    {
      title: t('welcome_feature_caption_export'),
      description: t('welcome_feature_caption_export_desc')
    },
    {
      title: t('welcome_feature_multilang_support'),
      description: t('welcome_feature_multilang_support_desc')
    }
  ];

  const handleGetStarted = () => {
    // 关闭当前页面
    window.close();
  };

  const handleOpenSettings = () => {
    // 路由到options页面的AI设置区域
    window.location.hash = 'ai-settings';
  };

  return (
    <div className="welcome-container">
      <Card className="welcome-card">
        <div className="welcome-header">
          <Title level={1} className="welcome-title">
            {t('welcome_title')}
          </Title>
          <Paragraph className="welcome-subtitle">
            {t('welcome_subtitle')}
          </Paragraph>
        </div>

        <Divider orientation="left">
          <Text className="section-title">{t('welcome_quick_start')}</Text>
        </Divider>

        {/* 引导动画组件 */}
        <GuideAnimation />

        <Divider orientation="left">
          <Text className="section-title">{t('welcome_main_features')}</Text>
        </Divider>

        <div className="features-grid">
          {features.map((feature, index) => (
            <Card 
              key={index}
              size="small" 
              className="feature-card"
            >
              <Title level={5} className="feature-title">
                {feature.title}
              </Title>
              <Paragraph className="feature-description">
                {feature.description}
              </Paragraph>
            </Card>
          ))}
        </div>

        <div className="action-buttons">
          <Space size="large">
            <Button 
              type="primary" 
              size="large" 
              onClick={handleGetStarted}
              className="action-button primary"
            >
              {t('welcome_get_started')}
            </Button>
            <Button 
              size="large" 
              onClick={handleOpenSettings}
              className="action-button"
            >
              {t('welcome_open_settings')}
            </Button>
          </Space>
        </div>

        <div className="tip-section">
          <Text type="secondary" className="tip-text">
            {t('welcome_tip')}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Welcome; 