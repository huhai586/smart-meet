/**
 * CustomProviderDialog - 添加自定义 OpenAI-compatible Provider
 */
import React, { useState } from 'react';
import { Modal, Input } from 'antd';
import { providerRegistry, type ProviderDefinition } from '~/utils/ai/provider-registry';

interface CustomProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (providerId: string) => void;
  t: (key: string) => string;
}

const CustomProviderDialog: React.FC<CustomProviderDialogProps> = ({
  open,
  onClose,
  onCreated,
  t,
}) => {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [defaultModel, setDefaultModel] = useState('');

  const handleOk = async () => {
    if (!name.trim() || !baseUrl.trim()) return;

    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const provider: ProviderDefinition = {
      id,
      name: name.trim(),
      icon: '🔧',
      category: 'custom',
      type: 'openai-compatible',
      defaultBaseURL: baseUrl.trim(),
      defaultModel: defaultModel.trim() || 'default',
      models: defaultModel.trim() ? [defaultModel.trim()] : [],
      requiresApiKey: true,
    };

    providerRegistry.addCustomProvider(provider);
    await providerRegistry.saveCustomProviders();

    // Reset form
    setName('');
    setBaseUrl('');
    setDefaultModel('');
    onClose();
    onCreated(id);
  };

  const handleCancel = () => {
    setName('');
    setBaseUrl('');
    setDefaultModel('');
    onClose();
  };

  const isValid = name.trim().length > 0 && baseUrl.trim().length > 0;

  return (
    <Modal
      title={t('add_custom_provider') || 'Add Custom Provider'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okButtonProps={{ disabled: !isValid }}
      okText={t('add') || 'Add'}
      cancelText={t('cancel') || 'Cancel'}
      className="custom-provider-dialog"
      destroyOnClose
    >
      <div className="custom-provider-dialog__field">
        <label>{t('provider_name') || 'Provider Name'}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My OpenAI Proxy"
        />
      </div>

      <div className="custom-provider-dialog__field">
        <label>{t('api_base_url') || 'API Base URL'}</label>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.example.com/v1"
        />
        <div className="custom-provider-dialog__field-hint">
          {t('openai_compatible_hint') || 'Must be OpenAI-compatible endpoint'}
        </div>
      </div>

      <div className="custom-provider-dialog__field">
        <label>{`${t('default_model') || 'Default Model'} (${t('optional') || 'Optional'})`}</label>
        <Input
          value={defaultModel}
          onChange={(e) => setDefaultModel(e.target.value)}
          placeholder="e.g., gpt-4o"
        />
      </div>
    </Modal>
  );
};

export default CustomProviderDialog;
