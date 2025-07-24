import React from 'react';
import { Button, Upload } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import getMeetingCaptions from '../../utils/getCaptions';
import save from '../../utils/save';
import getFileData from '../../utils/get-file-data';
import isRestoreDataValid from '../../utils/is-resetore-data-valid';
import type { Transcript } from '../../hooks/useTranscripts';
import { useI18n } from '../../utils/i18n';
import { useDateContext } from '../../contexts/DateContext';
import messageManager from '../../utils/message-manager';

interface BackupAndRestoreInterface {
    onBackup?: () => void;
    onRestore?: () => void;
}

const BackupAndRestore = (_props: BackupAndRestoreInterface) => {
    const { t } = useI18n();
    const { selectedDate } = useDateContext();

    const backup = () => {
        getMeetingCaptions(selectedDate).then((res) => {
            save(JSON.stringify(res), 'captions.json');
        })
    }
    const handleUploadChange = (res) => {
        getFileData(res.file).then((fileString: string) => {
            isRestoreDataValid(fileString).then((captions: Transcript[]) => {
                console.log('import data', captions)
                if (captions.length > 0) {
                    chrome.runtime.sendMessage({
                        action: 'restoreRecords',
                        data: captions
                    });
                    messageManager.success(t('success'));
                } else {
                    messageManager.error(t('no_meeting_data'));
                }

            }).catch((_e) => {
                messageManager.error(t('error'));
            })
        }).catch((e) => {
            messageManager.error(e.message)
        });
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button
                    type="primary"
                    icon={<CloudDownloadOutlined />}
                    onClick={backup}
                    size="small"
                >
                    {t('backup')}
                </Button>
                <Upload
                    accept=".json"
                    beforeUpload={() => false}
                    onChange={handleUploadChange}
                    showUploadList={false}
                >
                    <Button
                        icon={<CloudUploadOutlined />}
                        size="small"
                    >
                        {t('restore')}
                    </Button>
                </Upload>
            </div>
        </div>
    );
};

export default BackupAndRestore;
