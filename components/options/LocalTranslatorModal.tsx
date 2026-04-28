import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Select, Progress } from 'antd';
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  LoadingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import useI18n from '~utils/i18n';
import { useLocalTranslatorConfig } from '~hooks/useTranslationProvider';
import useTranslationLanguage from '~hooks/useTranslationLanguage';
import {
  isLocalTranslatorSupported,
  checkTranslatorAvailability,
  getOrCreateTranslator,
} from '~utils/translators/local-translator';

// ─── State Machine Types ────────────────────────────────────────────────────

type InitStatus =
  | 'checking'
  | 'not-supported'
  | 'downloading'
  | 'ready';

// ─── Styled Components (Apple style) ────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const ModalBody = styled.div`
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  padding: 8px 0 4px;
`;

// ── Init Phase ──

const InitCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 28px;
  gap: 16px;
  animation: ${fadeIn} 0.25s ease;
  min-height: 180px;
`;

const InitIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(145deg, #34C759, #30B04E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.35);
`;

const InitTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  text-align: center;
  letter-spacing: -0.3px;
`;

const InitSubtitle = styled.div`
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  max-width: 280px;
`;

const ProgressWrap = styled.div`
  width: 100%;
  max-width: 300px;
`;

const ProgressLabel = styled.div`
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 6px;
  text-align: center;
`;

const NotSupportedIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(145deg, #FF3B30, #D93025);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.3);
`;

const HintPill = styled.div`
  background: #F2F2F7;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  color: #636366;
  text-align: center;
`;

// ── Test Phase ──

const TestLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  animation: ${fadeIn} 0.25s ease;
`;

const TestHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 12px;
`;

const TestTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
`;

const ReadyBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: #E8F9ED;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 12px;
  color: #34C759;
  font-weight: 500;
`;

const PanelRow = styled.div`
  display: flex;
  gap: 0;
  border: 0.5px solid rgba(60, 60, 67, 0.18);
  border-radius: 12px;
  overflow: hidden;
`;

const Panel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  padding: 8px 12px;
  background: #F9F9FB;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PanelLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const PanelDivider = styled.div`
  width: 0.5px;
  background: rgba(60, 60, 67, 0.18);
  flex-shrink: 0;
`;

const TextArea = styled.textarea<{ $readonly?: boolean }>`
  flex: 1;
  width: 100%;
  min-height: 130px;
  padding: 12px;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  color: #1C1C1E;
  background: ${({ $readonly }) => ($readonly ? '#FAFAFA' : '#fff')};
  line-height: 1.55;

  &::placeholder {
    color: #C7C7CC;
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 0;
`;

const LangRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LangLabel = styled.span`
  font-size: 12px;
  color: #8E8E93;
`;

const TranslateBtn = styled.button<{ $loading?: boolean }>`
  height: 36px;
  padding: 0 20px;
  border-radius: 20px;
  border: none;
  background: ${({ $loading }) => ($loading ? '#C7C7CC' : '#007AFF')};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: -0.2px;

  &:active {
    transform: scale(0.97);
  }

  &:hover:not(:disabled) {
    background: ${({ $loading }) => ($loading ? '#C7C7CC' : '#0062CC')};
  }
`;

// ─── Language source options for Chrome Translator API ─────────────────────

const CHROME_TRANSLATOR_LANGS = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ko', name: 'Korean' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mr', name: 'Marathi' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface LocalTranslatorModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LocalTranslatorModal: React.FC<LocalTranslatorModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  const [config, setConfig] = useLocalTranslatorConfig();
  const [targetLanguage] = useTranslationLanguage();

  const [status, setStatus] = useState<InitStatus>('checking');
  const [downloadPercent, setDownloadPercent] = useState(0);

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const abortRef = useRef(false);

  // ── Initialization ──────────────────────────────────────────────────────

  const initTranslator = useCallback(async () => {
    setStatus('checking');
    setDownloadPercent(0);

    if (!isLocalTranslatorSupported()) {
      setStatus('not-supported');
      return;
    }

    const sourceLanguage = config.sourceLanguage || 'en';
    const targetCode = targetLanguage.code;

    try {
      const availability = await checkTranslatorAvailability(sourceLanguage, targetCode);

      if (availability === 'unavailable') {
        setStatus('not-supported');
        return;
      }

      if (availability === 'available') {
        setStatus('ready');
        return;
      }

      // 'downloadable' — need to download the model
      setStatus('downloading');
      abortRef.current = false;

      await (Translator as any).create({
        sourceLanguage,
        targetLanguage: targetCode,
        monitor(m: EventTarget) {
          m.addEventListener('downloadprogress', (e: any) => {
            if (abortRef.current) return;
            const pct = Math.round((e.loaded ?? 0) * 100);
            setDownloadPercent(pct);
          });
        },
      });

      setStatus('ready');
    } catch (err) {
      console.error('[LocalTranslatorModal] Init error:', err);
      setStatus('not-supported');
    }
  }, [config.sourceLanguage, targetLanguage.code]);

  // Re-init whenever the modal opens (or source language changes after ready state)
  useEffect(() => {
    if (!open) return;
    initTranslator();
    return () => {
      abortRef.current = true;
    };
  }, [open, initTranslator]);

  // ── Translation ─────────────────────────────────────────────────────────

  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) return;
    setIsTranslating(true);
    setOutputText('');

    try {
      const translator = await getOrCreateTranslator(
        config.sourceLanguage || 'en',
        targetLanguage.code
      );

      let accumulated = '';
      const stream = translator.translateStreaming(inputText.trim());
      for await (const chunk of stream) {
        accumulated += chunk;
        setOutputText(accumulated);
      }
    } catch (err) {
      console.error('[LocalTranslatorModal] Translation error:', err);
      setOutputText('⚠️ Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSourceLangChange = (code: string) => {
    setConfig({ ...config, sourceLanguage: code });
  };

  const handleDone = () => {
    onConfirm();
    onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const renderInit = () => {
    if (status === 'checking') {
      return (
        <InitCenter>
          <InitIcon>🤖</InitIcon>
          <InitTitle>{t('local_translator_title')}</InitTitle>
          <InitSubtitle>{t('local_translator_checking')}</InitSubtitle>
          <LoadingOutlined style={{ fontSize: 28, color: '#007AFF', marginTop: 4 }} spin />
        </InitCenter>
      );
    }

    if (status === 'not-supported') {
      return (
        <InitCenter>
          <NotSupportedIcon>⚠️</NotSupportedIcon>
          <InitTitle>{t('local_translator_not_supported')}</InitTitle>
          <HintPill>{t('local_translator_not_supported_hint')}</HintPill>
        </InitCenter>
      );
    }

    if (status === 'downloading') {
      return (
        <InitCenter>
          <InitIcon>📥</InitIcon>
          <InitTitle>{t('local_translator_downloading')}</InitTitle>
          <ProgressWrap>
            <ProgressLabel>
              {t('local_translator_download_progress', { percent: downloadPercent.toString() })}
            </ProgressLabel>
            <Progress
              percent={downloadPercent}
              strokeColor="#34C759"
              trailColor="rgba(52,199,89,0.15)"
              strokeWidth={6}
              showInfo={false}
              style={{ borderRadius: 99 }}
            />
          </ProgressWrap>
        </InitCenter>
      );
    }

    return null;
  };

  const renderTest = () => (
    <TestLayout>
      <TestHeader>
        <TestTitle>{t('local_translator_test_title')}</TestTitle>
        <ReadyBadge>
          <CheckCircleFilled style={{ fontSize: 12 }} />
          {t('local_translator_ready')}
        </ReadyBadge>
      </TestHeader>

      <PanelRow>
        {/* Input panel */}
        <Panel>
          <PanelHeader>
            <PanelLabel>
              {(CHROME_TRANSLATOR_LANGS.find(l => l.code === (config.sourceLanguage || 'en'))?.name) ?? (config.sourceLanguage || 'en')}
            </PanelLabel>
          </PanelHeader>
          <TextArea
            placeholder={t('local_translator_input_placeholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTranslate();
            }}
          />
        </Panel>

        <PanelDivider />

        {/* Output panel */}
        <Panel>
          <PanelHeader>
            <PanelLabel>{targetLanguage.name}</PanelLabel>
            {isTranslating && (
              <LoadingOutlined style={{ fontSize: 11, color: '#007AFF' }} spin />
            )}
          </PanelHeader>
          <TextArea
            placeholder={t('local_translator_output_placeholder')}
            value={outputText}
            readOnly
            $readonly
          />
        </Panel>
      </PanelRow>

      <ActionRow>
        <LangRow>
          <LangLabel>{t('local_translator_source_lang')}:</LangLabel>
          <Select
            value={config.sourceLanguage || 'en'}
            onChange={handleSourceLangChange}
            style={{ width: 140 }}
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
          >
            {CHROME_TRANSLATOR_LANGS.map((lang) => (
              <Select.Option key={lang.code} value={lang.code}>
                {lang.name}
              </Select.Option>
            ))}
          </Select>
          <SwapOutlined style={{ color: '#C7C7CC', fontSize: 12 }} />
          <LangLabel>{targetLanguage.name}</LangLabel>
        </LangRow>

        <TranslateBtn
          onClick={handleTranslate}
          $loading={isTranslating}
          disabled={isTranslating || !inputText.trim()}
        >
          {isTranslating ? (
            <><LoadingOutlined spin style={{ fontSize: 13 }} /> {t('local_translator_translate_btn')}</>
          ) : (
            t('local_translator_translate_btn')
          )}
        </TranslateBtn>
      </ActionRow>
    </TestLayout>
  );

  return (
    <Modal
      title={t('local_translator_title')}
      open={open}
      onCancel={onClose}
      footer={
        status === 'ready'
          ? [
              <TranslateBtn
                key="done"
                onClick={handleDone}
                style={{ background: '#34C759' }}
              >
                {t('local_translator_done')}
              </TranslateBtn>,
            ]
          : status === 'not-supported'
          ? null
          : null
      }
      centered
      destroyOnClose
      width={600}
      styles={{
        content: { borderRadius: 16, padding: '20px 24px 20px' },
        header: {
          paddingBottom: 12,
          borderBottom: '0.5px solid rgba(60,60,67,0.12)',
          marginBottom: 16,
          fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        },
        footer: {
          borderTop: status === 'ready' ? '0.5px solid rgba(60,60,67,0.12)' : 'none',
          paddingTop: status === 'ready' ? 14 : 0,
          display: 'flex',
          justifyContent: 'flex-end',
        },
      }}
    >
      <ModalBody>
        {status !== 'ready' ? renderInit() : renderTest()}
      </ModalBody>
    </Modal>
  );
};

export default LocalTranslatorModal;
