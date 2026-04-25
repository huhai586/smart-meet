/**
 * ProviderIcon – renders the official favicon for known AI providers,
 * falls back to the emoji icon from the provider registry, or a generic robot.
 */
import React, { useState } from 'react';
import { providerRegistry } from '~/utils/ai/provider-registry';

interface ProviderIconProps {
  /** Provider ID from registry, e.g. 'openai', 'google-gemini', 'deepseek' */
  providerId: string;
  /** px size (width = height). Default 20 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Official favicon URLs (keyed by provider ID) ────────────────────────────

const FAVICON_MAP: Record<string, string> = {
  'openai':       'https://openai.com/favicon.ico',
  'google-gemini':'https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg',
  'anthropic':    'https://www.anthropic.com/favicon.ico',
  'deepseek':     'https://fe-static.deepseek.com/chat/favicon.svg',
  'xai-grok':     'https://x.ai/favicon.ico',
  'mistral':      'https://mistral.ai/favicon.ico',
  'groq':         'https://groq.com/favicon.ico',
  'together-ai':  'https://www.together.ai/favicon.ico',
  'perplexity':   'https://www.perplexity.ai/favicon.ico',
  'qwen':         'https://qwen.ai/favicon.ico',
  'zhipu-glm':    'https://open.bigmodel.cn/img/icons/favicon-32x32.png',
  'moonshot':     'https://www.moonshot.cn/favicon.ico',
  'doubao':       'https://www.doubao.com/favicon.ico',
  'baichuan':     'https://www.baichuan-ai.com/favicon.ico',
  'yi':           'https://www.01.ai/favicon.ico',
  'minimax':      'https://www.minimaxi.com/favicon.ico',
  'siliconflow':  'https://siliconflow.cn/favicon.ico',
  'ollama':       'http://ollama.com/public/icon-32x32.png',
  'lm-studio':    'https://lmstudio.ai/favicon.ico',
};

// ─── Public component ─────────────────────────────────────────────────────────

const ProviderIcon: React.FC<ProviderIconProps> = ({
  providerId,
  size = 20,
  className,
  style,
}) => {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = FAVICON_MAP[providerId];
  const provider = providerRegistry.getById(providerId);
  const emoji = provider?.icon || '🤖';

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...style,
  };

  if (faviconUrl && !imgError) {
    return (
      <span className={className} style={wrapperStyle}>
        <img
          src={faviconUrl}
          width={size}
          height={size}
          alt={provider?.name || providerId}
          onError={() => setImgError(true)}
          style={{ objectFit: 'contain', borderRadius: 3, display: 'block' }}
        />
      </span>
    );
  }

  return (
    <span className={className} style={wrapperStyle}>
      <span style={{ fontSize: size * 0.85, lineHeight: 1, display: 'inline-block' }}>{emoji}</span>
    </span>
  );
};

export default ProviderIcon;
