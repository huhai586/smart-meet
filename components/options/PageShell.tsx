import React from 'react';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import type { OptionsRoute } from '~utils/options-routes';
import { findPage } from './pages';

/** How wide a page may grow: settings lists stay narrow, pages that list data get room. */
export const PageWidth = { STANDARD: 800, WIDE: 1240 } as const;

/** The side padding of the page, shared by the toolbar and the content so the two line up. */
const SIDE = 40;

const Shell = styled.div`
  min-height: 100%;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

// A slim bar that stays at the top while the page scrolls, as in the macOS settings
const Toolbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--opt-navbar-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 0.5px solid var(--opt-border-divider);
`;

const ToolbarInner = styled.div<{ $width: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  max-width: ${({ $width }) => $width + SIDE * 2}px;
  padding: 0 ${SIDE}px;
`;

const Title = styled.h1`
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.1px;
  color: var(--opt-text-primary);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
`;

const Body = styled.div<{ $width: number }>`
  max-width: ${({ $width }) => $width + SIDE * 2}px;
  padding: 16px ${SIDE}px 32px;
`;

const Caption = styled.p`
  margin: 0 4px 16px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--opt-text-secondary);
`;

interface PageShellProps {
  /** The page; its title is the label the sidebar shows for it, so the two can never disagree. */
  route: OptionsRoute;
  /** One quiet line under the toolbar saying what the page is for. */
  subtitle?: string;
  /** What the page does as a whole (sync now, export, back up), kept in the toolbar so it is always in reach. */
  actions?: React.ReactNode;
  width?: (typeof PageWidth)[keyof typeof PageWidth];
  children: React.ReactNode;
}

/** The frame every options page sits in: a toolbar with the title and the page's actions, then the content. */
const PageShell: React.FC<PageShellProps> = ({ route, subtitle, actions, width = PageWidth.STANDARD, children }) => {
  const { t } = useI18n();
  const page = findPage(route);
  const title = page?.labelKey ? t(page.labelKey) : page?.label;

  return (
    <Shell>
      <Toolbar>
        <ToolbarInner $width={width}>
          <Title>{title}</Title>
          {actions && <Actions>{actions}</Actions>}
        </ToolbarInner>
      </Toolbar>
      <Body $width={width}>
        {subtitle && <Caption>{subtitle}</Caption>}
        {children}
      </Body>
    </Shell>
  );
};

export default PageShell;
