import { beforeEach, describe, expect, it, vi } from 'vitest';

const warningWithAction = vi.fn();
const sendMessage = vi.fn();

vi.mock('./message-manager', () => ({ default: { warningWithAction } }));
vi.mock('../hooks/useUILanguage', () => ({ getCurrentUILanguage: async () => ({ code: 'en' }) }));
vi.mock('./i18n', () => ({ getTranslation: (key: string) => key }));

beforeEach(() => {
    vi.resetModules();
    warningWithAction.mockClear();
    sendMessage.mockClear();
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
});

describe('isLocalModelMissing', () => {
    it('is true only while the model is not on the machine', async () => {
        const { isLocalModelMissing } = await import('./translators/local-translator');
        expect(isLocalModelMissing('downloadable')).toBe(true);
        expect(isLocalModelMissing('downloading')).toBe(true);
        expect(isLocalModelMissing('available')).toBe(false);
        expect(isLocalModelMissing('unavailable')).toBe(false);
    });
});

describe('promptLocalModelDownload', () => {
    it('returns the localized message as an error and offers a link to the translation settings', async () => {
        const { promptLocalModelDownload, LocalModelNotInstalledError } = await import('./local-model-prompt');
        const error = await promptLocalModelDownload();

        expect(error).toBeInstanceOf(LocalModelNotInstalledError);
        expect(error.message).toBe('local_model_missing_message');
        const [content, actionLabel, onAction] = warningWithAction.mock.calls[0];
        expect(content).toBe('local_model_missing_message');
        expect(actionLabel).toBe('go_to_options');

        onAction();
        expect(sendMessage).toHaveBeenCalledWith({ action: 'openOptionsPage', route: 'translation' });
    });

    it('shows the toast once per page, but every call still gets the error', async () => {
        const { promptLocalModelDownload } = await import('./local-model-prompt');
        await promptLocalModelDownload();
        const second = await promptLocalModelDownload();

        expect(warningWithAction).toHaveBeenCalledTimes(1);
        expect(second.message).toBe('local_model_missing_message');
    });
});
