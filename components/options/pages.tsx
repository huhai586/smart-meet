import React, { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import {
  SettingOutlined,
  RobotOutlined,
  BookOutlined,
  SwapOutlined,
  CalendarOutlined,
  CloudOutlined,
  CodeOutlined,
  FontSizeOutlined,
  SyncOutlined,
  TranslationOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { OptionsRoute } from '~utils/options-routes';
import googleDriveIcon from '~images/google/google-drive.svg';
import googleCalendarIcon from '~images/google/google-calendar.svg';

/** The sidebar groups, in order. */
export const OptionsGroup = {
  SETTINGS: 'settings',
  CONTENT: 'content',
  INTEGRATIONS: 'integrations',
  DEVELOPER: 'developer',
} as const;
export type OptionsGroup = (typeof OptionsGroup)[keyof typeof OptionsGroup];

export interface OptionsPage {
  /** The hash of the page, and its id. */
  route: OptionsRoute;
  icon: ReactNode;
  /** The colour of the rounded square the icon sits in, as in the iOS and macOS settings. */
  color: string;
  /** The product's own icon, for the integrations; it replaces the coloured square and is never recoloured. */
  brandIcon?: string;
  /** Translation key of the sidebar label; the developer page has no translation and uses `label`. */
  labelKey?: string;
  label?: string;
  group: OptionsGroup;
  component: LazyExoticComponent<ComponentType>;
}

/** Every page of the options, in the order of the sidebar. Adding a page means adding one line here. */
export const OPTIONS_PAGES: OptionsPage[] = [
  { route: OptionsRoute.GENERAL, icon: <SettingOutlined />, color: '#8E8E93', labelKey: 'tab_general', group: OptionsGroup.SETTINGS, component: lazy(() => import('~components/options/tabs/General')) },
  { route: OptionsRoute.INTERFACE, icon: <FontSizeOutlined />, color: '#5E5CE6', labelKey: 'tab_visibility', group: OptionsGroup.SETTINGS, component: lazy(() => import('~components/options/tabs/InterfaceAppearance')) },
  { route: OptionsRoute.AI_TRANSLATION, icon: <RobotOutlined />, color: '#AF52DE', labelKey: 'tab_ai_models_nav', group: OptionsGroup.SETTINGS, component: lazy(() => import('~components/options/tabs/AIAndTranslation')) },
  { route: OptionsRoute.TRANSLATION, icon: <TranslationOutlined />, color: '#32ADE6', labelKey: 'tab_translation', group: OptionsGroup.SETTINGS, component: lazy(() => import('~components/options/TranslationSettings')) },
  { route: OptionsRoute.OTHER, icon: <EllipsisOutlined />, color: '#636366', labelKey: 'tab_other', group: OptionsGroup.SETTINGS, component: lazy(() => import('~components/options/tabs/OtherSettings')) },
  { route: OptionsRoute.VOCABULARY, icon: <BookOutlined />, color: '#FF9500', labelKey: 'tab_vocabulary', group: OptionsGroup.CONTENT, component: lazy(() => import('~components/options/vocabulary/Vocabulary')) },
  { route: OptionsRoute.HISTORY, icon: <SyncOutlined />, color: '#34C759', labelKey: 'tab_data_sync', group: OptionsGroup.CONTENT, component: lazy(() => import('~components/options/tabs/HistoryRecords')) },
  { route: OptionsRoute.DATA_TRANSFER, icon: <SwapOutlined />, color: '#30B0C7', labelKey: 'tab_import_export', group: OptionsGroup.CONTENT, component: lazy(() => import('~components/options/data/DataTransfer')) },
  { route: OptionsRoute.CLOUD_SYNC, icon: <CloudOutlined />, color: '#4285F4', brandIcon: googleDriveIcon, labelKey: 'tab_google_drive', group: OptionsGroup.INTEGRATIONS, component: lazy(() => import('~components/options/GoogleDriveIntegration')) },
  { route: OptionsRoute.CALENDAR, icon: <CalendarOutlined />, color: '#FF3B30', brandIcon: googleCalendarIcon, labelKey: 'tab_calendar', group: OptionsGroup.INTEGRATIONS, component: lazy(() => import('~components/options/tabs/CalendarSync')) },
  { route: OptionsRoute.DEVELOPER, icon: <CodeOutlined />, color: '#3A3A3C', label: 'Developer', group: OptionsGroup.DEVELOPER, component: lazy(() => import('~components/options/tabs/DeveloperPanel')) },
];

/** Sidebar group titles: a translation key, or plain text for the developer group. */
export const GROUP_TITLES: Record<OptionsGroup, { key?: string; text?: string }> = {
  [OptionsGroup.SETTINGS]: { key: 'sidebar_category_general' },
  [OptionsGroup.CONTENT]: { key: 'sidebar_category_content' },
  [OptionsGroup.INTEGRATIONS]: { key: 'sidebar_category_integration' },
  [OptionsGroup.DEVELOPER]: { text: 'Dev' },
};

/** The page for a hash route; an unknown hash falls back to the first page. */
export const findPage = (route: string): OptionsPage => OPTIONS_PAGES.find((page) => page.route === route) ?? OPTIONS_PAGES[0];

export const isPageRoute = (route: string): boolean => OPTIONS_PAGES.some((page) => page.route === route);
