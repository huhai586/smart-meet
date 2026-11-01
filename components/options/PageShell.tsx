import React from 'react';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import type { OptionsRoute } from '~utils/options-routes';
import { findPage } from './pages';

/** How wide a page may grow: settings lists stay narrow, pages that list data get room. */
export const PageWidth = { STANDARD: 800, WIDE: 1240 } as const;

const Shell = styled.div<{ $width: number }>`
  max-width: ${({ $width }) => $width}px;
  padding: 0 20px 32px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const Heading = styled.header`
  padding: 0 0 24px;
`;

const Title = styled.h1`
  margin: 0 0 4px;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
  color: var(--opt-text-primary);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--opt-text-secondary);
`;

interface PageShellProps {
  /** The page; its title is the label the sidebar shows for it, so the two can never disagree. */
  route: OptionsRoute;
  subtitle?: string;
  width?: (typeof PageWidth)[keyof typeof PageWidth];
  children: React.ReactNode;
}

/** The frame every options page sits in: one width rule, one title style, one place for the subtitle. */
const PageShell: React.FC<PageShellProps> = ({ route, subtitle, width = PageWidth.STANDARD, children }) => {
  const { t } = useI18n();
  const page = findPage(route);
  const title = page?.labelKey ? t(page.labelKey) : page?.label;

  return (
    <Shell $width={width}>
      <Heading>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Heading>
      {children}
    </Shell>
  );
};

export default PageShell;
