import React, { useState } from 'react';
import { Button, Card, List, message, Upload } from 'antd';
import { CloudOutlined, UploadOutlined } from '@ant-design/icons';
import { GoogleDriveService } from '../utils/google-drive';
import type { UploadFile } from 'antd/es/upload/interface';

const Account = () => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const driveService = GoogleDriveService.getInstance();

    const handleListFiles = async () => {
        try {
            setLoading(true);
            const fileList = await driveService.listFiles();
            setFiles(fileList);
        } catch (error) {
            console.error('Error listing files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        try {
            setLoading(true);
            const success = await driveService.uploadFile(file);
            if (success) {
                message.success('File uploaded successfully');
                // 刷新文件列表
                handleListFiles();
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setLoading(false);
        }
        return false; // 阻止自动上传
    };

    return (
        <Card title="Google Drive Integration">
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<CloudOutlined />}
                    onClick={handleListFiles}
                    loading={loading}
                    style={{ marginRight: 16 }}
                >
                    List Files
                </Button>
                <Upload
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    disabled={loading}
                >
                    <Button icon={<UploadOutlined />}>Upload File</Button>
                </Upload>
            </div>

            <List
                loading={loading}
                dataSource={files}
                renderItem={(file) => (
                    <List.Item>
                        <List.Item.Meta
                            title={file.name}
                            description={`Type: ${file.mimeType} | Modified: ${new Date(file.modifiedTime).toLocaleString()}`}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default Account; 