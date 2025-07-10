import React, { useState, useEffect } from 'react';
import { Card, Button, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useI18n } from '../utils/i18n';
import './GuideAnimation.scss';

const { Title, Text } = Typography;

interface GuideAnimationProps {
  onComplete?: () => void;
}

const GuideAnimation: React.FC<GuideAnimationProps> = ({ onComplete }) => {
  const { t } = useI18n();
  const [animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    {
      title: t('guide_step_1_title'),
      description: t('guide_step_1_desc'),
      highlight: 'none'
    },
    {
      title: t('guide_step_2_title'),
      description: t('guide_step_2_desc'),
      highlight: 'captions-button'
    },
    {
      title: t('guide_step_3_title'),
      description: t('guide_step_3_desc'),
      highlight: 'captions-button-active'
    },
    {
      title: t('guide_step_4_title'),
      description: t('guide_step_4_desc'),
      highlight: 'extension-slide'
    },
    {
      title: t('guide_step_5_title'),
      description: t('guide_step_5_desc'),
      highlight: 'none'
    }
  ];

  const startAnimation = () => {
    setIsPlaying(true);
    setAnimationStep(0);
    
    const interval = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          onComplete?.();
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // 调整间隔时间，现在动画更简洁
  };

  const resetAnimation = () => {
    setAnimationStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="guide-animation">
      <Card className="guide-card">
        <div className="guide-header">
          <Title level={4}>{t('guide_animation_title')}</Title>
          <Text type="secondary">{t('guide_animation_subtitle')}</Text>
        </div>

        <div className="guide-content">
          {/* Google Meet 截图容器 */}
          <div className="meet-screenshot-container">
            {/* 根据动画步骤显示不同的界面 */}
            {animationStep <= 2 ? (
              <>
                <img 
                  src={chrome.runtime.getURL('images/google meet.png')} 
                  alt="Google Meet Interface" 
                  className="meet-screenshot"
                />
                
                {/* 字幕按钮高亮指示器 */}
                <div 
                  className={`captions-highlight ${
                    animationStep === 1 ? 'pulse' : 
                    animationStep === 2 ? 'click-animation' : ''
                  }`}
                  style={{
                    opacity: animationStep >= 1 && animationStep <= 2 ? 1 : 0
                  }}
                >
                  <img 
                    src={chrome.runtime.getURL('images/captions.png')} 
                    alt="Captions Button" 
                    className="captions-icon"
                  />
                  <div className="click-indicator">
                    <div className="ripple"></div>
                    <div className="ripple"></div>
                    <div className="ripple"></div>
                  </div>
                </div>
              </>
            ) : (
              /* 显示插件激活后的完整界面 */
              <img 
                src={chrome.runtime.getURL('images/extension_slide_in.png')} 
                alt="Extension Activated Interface" 
                className="meet-screenshot extension-activated"
              />
            )}

            {/* 步骤指示器 */}
            <div className="step-indicator">
              <div className="step-content">
                <div className="step-number">{animationStep + 1}</div>
                <div className="step-info">
                  <div className="step-title">{steps[animationStep].title}</div>
                  <div className="step-description">{steps[animationStep].description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="guide-controls">
            {!isPlaying ? (
              <Button 
                type="primary" 
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={startAnimation}
                className="play-button"
              >
                {t('guide_start_demo')}
              </Button>
            ) : (
              <Button 
                size="large"
                onClick={resetAnimation}
                className="reset-button"
              >
                {t('guide_restart')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GuideAnimation; 