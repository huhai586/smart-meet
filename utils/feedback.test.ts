import { describe, expect, it } from 'vitest';
import { buildFeedbackUrl, FeedbackSource, formatDiagnostics } from './feedback';

const context = { version: '1.13.3', browser: '156.0.0.0', uiLanguage: 'zh', source: FeedbackSource.OPTIONS };

describe('feedback link', () => {
    it('fills the form\'s diagnostics field and marks the link as prefilled', () => {
        const url = new URL(buildFeedbackUrl(context));
        expect(url.origin + url.pathname).toContain('docs.google.com/forms/d/e/');
        expect(url.pathname.endsWith('/viewform')).toBe(true);
        expect(url.searchParams.get('usp')).toBe('pp_url');
        expect(url.searchParams.get('entry.1962349541')).toBe(formatDiagnostics(context));
    });

    it('carries only version, browser, language and where the link came from', () => {
        expect(formatDiagnostics(context)).toBe('Smart Meet 1.13.3 | Chrome 156.0.0.0 | UI zh | via options');
    });

    it('records when the link is the uninstall page', () => {
        const url = new URL(buildFeedbackUrl({ ...context, source: FeedbackSource.UNINSTALL }));
        expect(url.searchParams.get('entry.1962349541')).toContain('via uninstall');
    });

    it('stays under the 1023 characters Chrome allows for an uninstall URL', () => {
        expect(buildFeedbackUrl({ ...context, source: FeedbackSource.UNINSTALL }).length).toBeLessThan(1023);
    });
});
