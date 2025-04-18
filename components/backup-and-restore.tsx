import {Button, Upload, Typography} from "antd";
import '../styles/back-up-and-restore.scss';
import getMeetingCaptions from "~utils/getCaptions";
import save from "~utils/save";
import {CloudDownloadOutlined, CloudUploadOutlined} from "@ant-design/icons";
import getFileData from "~utils/get-file-data";
import {message} from "antd";
import isRestoreDataValid from "~utils/is-resetore-data-valid";
import type {Transcript} from "~hooks/useTranscripts";
import dayjs from "dayjs";
import { useDateContext } from "~contexts/DateContext";
import { useI18n } from "~utils/i18n";

interface BackupAndRestoreInterface {
    jumpToCaptions?: (date?: dayjs.Dayjs) => void;
}

const BackupAndRestore = (props: BackupAndRestoreInterface) => {
    const { t } = useI18n();
    const [messageApi, contextHolder] = message.useMessage();
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
                    messageApi.open({
                        type: 'success',
                        content: t('success'),
                    });
                } else {
                    messageApi.open({
                        type: 'error',
                        content: t('no_meeting_data'),
                    });
                }

            }).catch((e) => {
                messageApi.open({
                    type: 'error',
                    content: t('error'),
                });
            })
        });
    }
    return (
        <div className={'back-up-and-restore'}>
            {contextHolder}
            <div className={'highlight-section'}>
                <div className={'highlight-header'}>
                    <CloudDownloadOutlined style={{ color: '#1a73e8' }} />
                    <span>{t('backup_section')}</span>
                </div>
                <div className={'highlight-description'}>
                    {t('backup_desc')}
                </div>
                <div className="highlight-content">
                    <Button
                        onClick={backup}
                        type="primary"
                        className="action-button"
                    >
                        {t('backup_button')}
                    </Button>
                </div>
            </div>

            <div className={'highlight-section'}>
                <div className={'highlight-header'}>
                    <CloudUploadOutlined style={{ color: '#1a73e8' }} />
                    <span>{t('restore_section')}</span>
                </div>
                <div className={'highlight-description'}>
                    {t('restore_desc')}
                </div>
                <div className="highlight-content">
                    <Upload accept={'.json'} onChange={handleUploadChange} itemRender={() => null} fileList={[]}>
                        <Button
                            type="primary"
                            className="action-button"
                        >
                            {t('restore_button')}
                        </Button>
                    </Upload>
                </div>
            </div>
        </div>
    );
};

export default BackupAndRestore;
