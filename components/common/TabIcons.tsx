import React from 'react';
import Icon from '@ant-design/icons';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';

// Ant Design's outline icons are heavier and have no sparkle, so the sidepanel tabs use the
// Tabler outline set (MIT) for a consistent stroke. They take the surrounding text colour.
const tablerIcon = (paths: string[]): React.FC<{ className?: string }> => {
    const Svg: React.FC<CustomIconComponentProps> = (props) => (
        <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            {...props}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths.map((d) => <path key={d} d={d} />)}
        </svg>
    );
    return (props) => <Icon component={Svg} {...props} />;
};

export const CaptionsTabIcon = tablerIcon([
    'M8 9h8',
    'M8 13h6',
    'M9 18h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-3l-3 3l-3 -3z',
]);

export const SparklesTabIcon = tablerIcon([
    'M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z',
    'M16 6a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z',
    'M9 18a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z',
]);

export const TranslationTabIcon = tablerIcon([
    'M4 5h7',
    'M9 3v2c0 4.418 -2.239 8 -5 8',
    'M5 9c-.003 2.144 2.952 3.908 6.7 4',
    'M12 20l4 -9l4 9',
    'M19.1 18h-6.2',
]);
