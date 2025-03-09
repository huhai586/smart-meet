import {Alert, Button, Upload} from "antd";
import '../styles/back-up-and-restore.scss';
import getMeetingCaptions from "~utils/getCaptions";
import save from "~utils/save";
import {UploadOutlined} from "~node_modules/@ant-design/icons";
import getFileData from "~utils/get-file-data";
import {message} from "~node_modules/antd";
import isRestoreDataValid from "~utils/is-resetore-data-valid";
import type {Transcript} from "~hooks/useTranscripts";
import setMeetingCaptions from "~utils/set-captions";
import dayjs from "dayjs";
import { useDateContext } from '../contexts/DateContext';

interface BackupAndRestoreInterface {
    jumpToCaptions: (date?: dayjs.Dayjs) => void;
}

const BackupAndRestore = (props: BackupAndRestoreInterface) => {
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
                        content: 'restore successfully',
                    });
                } else {
                    messageApi.open({
                        type: 'error',
                        content: 'no data to restore',
                    });
                }
         
            }).catch((e) => {
                messageApi.open({
                    type: 'error',
                    content: 'the file is not json valid',
                });
            })
        });
    }
    return (
        <div className={'back-up-and-restore'}>
            {contextHolder}
            <div className={'action-item'} >
                <Alert message="Backup the raw data of captions So that you can restore it in some day" type="success" />
                <div className="action-button">
                    <Button onClick={backup}>backup raw data</Button>
                </div>
            </div>
            <div className={'action-item'} >
                <Alert message="Restore specific raw data" type="success" />
                <div className="action-button">
                    <Upload accept={'.json'} onChange={handleUploadChange} itemRender={() => null} fileList={[]}>
                        <Button icon={<UploadOutlined />}>Upload file to restore</Button>
                    </Upload>
                </div>
            </div>
        </div>
    );
};

export default BackupAndRestore;
