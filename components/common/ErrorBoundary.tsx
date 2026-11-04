import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from 'antd';
import { CopyOutlined, DownOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import useI18n from '../../utils/i18n';
import './ErrorBoundary.scss';

interface ErrorFallbackProps {
    error: Error;
    componentStack?: string;
    onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, componentStack, onRetry }) => {
    const { t } = useI18n();
    const [copied, setCopied] = React.useState(false);
    const details = [error.stack || `${error.name}: ${error.message}`, componentStack].filter(Boolean).join('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(details).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <div className="error-boundary" role="alert">
            <div className="error-boundary__card">
                <div className="error-boundary__icon">
                    <ExclamationCircleOutlined />
                </div>
                <h2 className="error-boundary__title">{t('error_boundary_title')}</h2>
                <p className="error-boundary__desc">{t('error_boundary_desc')}</p>
                <div className="error-boundary__actions">
                    <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
                        {t('error_boundary_retry')}
                    </Button>
                    <Button icon={<CopyOutlined />} onClick={handleCopy}>
                        {copied ? t('error_boundary_copied') : t('error_boundary_copy')}
                    </Button>
                </div>
                <details className="error-boundary__details">
                    <summary>
                        {t('error_boundary_details')}
                        <DownOutlined className="error-boundary__chevron" />
                    </summary>
                    <pre>{details}</pre>
                </details>
            </div>
        </div>
    );
};

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
    componentStack?: string;
}

/** Keeps a render error inside one part of the UI and shows it, instead of blanking the whole page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
        this.setState({ componentStack: info.componentStack ?? undefined });
    }

    private handleRetry = () => this.setState({ error: null, componentStack: undefined });

    render() {
        const { error, componentStack } = this.state;
        if (error) {
            return <ErrorFallback error={error} componentStack={componentStack} onRetry={this.handleRetry} />;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
