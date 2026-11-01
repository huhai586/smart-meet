import { Dropdown, Modal, type MenuProps } from "antd";
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import '../../styles/words.scss'
import './vocab-list.scss'
import {
    ExclamationCircleOutlined,
    BookOutlined,
    ExportOutlined,
    MoreOutlined
} from '@ant-design/icons';
import { useI18n } from "~utils/i18n";
import messageManager from '../../utils/message-manager';
import { clearVocab, removeVocabWord } from "~utils/vocab";
import { sortForDisplay } from "~utils/vocab-core";
import { toAnkiText, toCsv } from "~utils/vocab-export";
import { createTextFile, downloadFile } from "~utils/file-utils";
import { OptionsRoute, openOptions } from "~utils/options-routes";
import useVocab from "~hooks/useVocab";
import VocabItem from './VocabItem';
import WordDetailModal from './WordDetailModal';

const { confirm } = Modal;

/** The words the user looked up in meetings, with the sentences they came from, ready to take to Anki. */
const Words = (_props: {currentTab: string}) => {
    const { t } = useI18n();
    const entries = useVocab();
    const sortedEntries = useMemo(() => sortForDisplay(entries), [entries]);
    const [detailWord, setDetailWord] = useState('');

    const exportAnki = () => {
        downloadFile(createTextFile(toAnkiText(sortedEntries), `smart-meet-anki-${dayjs().format('YYYYMMDD')}.txt`));
        messageManager.success(t('export_success'));
    };

    const exportCsv = () => {
        downloadFile(createTextFile(toCsv(sortedEntries), `smart-meet-words-${dayjs().format('YYYYMMDD')}.csv`, 'text/csv;charset=utf-8'));
        messageManager.success(t('export_success'));
    };

    const showConfirm = () => {
        confirm({
            title: t('clear_history_confirm'),
            icon: <ExclamationCircleOutlined />,
            content: t('clear_history_desc'),
            okText: t('yes_clear_all'),
            okType: 'danger',
            cancelText: t('no_keep_it'),
            onOk() {
                clearVocab().then(() => messageManager.success(t('history_cleared')));
            },
        });
    };

    const menuItems: MenuProps['items'] = [
        { key: 'anki', label: t('vocab_export_anki'), onClick: exportAnki },
        { key: 'csv', label: t('vocab_export_csv'), onClick: exportCsv },
        { type: 'divider' },
        { key: 'clear', label: t('vocab_clear'), danger: true, onClick: showConfirm },
    ];

    return (
        <div className={'words-container vocab-container'}>
            {entries.length > 0 ? (
                <>
                    <div className="vocab-bar">
                        <span className="vocab-bar__count">{t('vocab_count', { n: String(entries.length) })}</span>
                        <button
                            type="button"
                            className="vocab-bar__link"
                            onClick={() => openOptions(OptionsRoute.VOCABULARY)}
                        >
                            {t('vocab_open_page')} <ExportOutlined />
                        </button>
                        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                            <button type="button" className="vocab-bar__more" aria-label={t('vocab_menu')} title={t('vocab_menu')}>
                                <MoreOutlined />
                            </button>
                        </Dropdown>
                    </div>
                    <div className="vocab-list">
                        {sortedEntries.map((entry) => (
                            <VocabItem
                                key={entry.key}
                                entry={entry}
                                onOpenDictionary={setDetailWord}
                                onRemove={removeVocabWord}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="vocab-empty">
                    <BookOutlined />
                    <span>{t('vocab_empty')}</span>
                </div>
            )}

            <WordDetailModal
                visible={!!detailWord}
                word={detailWord}
                onClose={() => setDetailWord('')}
            />
        </div>
    )
}

export default Words
