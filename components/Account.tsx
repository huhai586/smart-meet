import React, { useState, useEffect } from 'react';
import { Button, Card, List, message, Upload, Empty, Spin, Modal, Popconfirm } from 'antd';
import { UploadOutlined, FolderOutlined, DeleteOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { GoogleDriveService } from '../utils/google-drive';
import { StorageFactory } from '../background/data-persistence/storage-factory';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';
import openSidePanel from '../utils/open-side-panel';

const Account = () => {
    const [backupFiles, setBackupFiles] = useState<any[]>([]);
    const [backupFolder, setBackupFolder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
    const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
    const driveService = GoogleDriveService.getInstance();

    useEffect(() => {
        loadBackupFolder();
    }, []);

    const loadBackupFolder = async () => {
        try {
            setLoading(true);
            const folder = await driveService.getBackupFolder();
            setBackupFolder(folder);

            if (folder) {
                const files = await driveService.listBackupFiles();
                setBackupFiles(files);
            }
        } catch (error) {
            console.error('Error loading backup folder:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        try {
            setLoading(true);
            const success = await driveService.uploadFile(file);
            if (success) {
                message.success('File uploaded successfully to backup folder');
                // 刷新文件列表
                loadBackupFolder();
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setLoading(false);
        }
        return false; // 阻止自动上传
    };

    const handleDeleteFile = async (fileId: string) => {
        try {
            setDeletingFileId(fileId);
            const success = await driveService.deleteFile(fileId);
            if (success) {
                message.success('File deleted successfully');
                // 从列表中移除已删除的文件
                setBackupFiles(backupFiles.filter(file => file.id !== fileId));
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleLoadFile = async (fileId: string, fileName: string) => {
        try {
            setLoadingFileId(fileId);

            // 从文件名中提取日期（假设文件名格式为 YYYY-MM-DD.json）
            const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})\.json/);
            if (!dateMatch) {
                message.error('Invalid backup file name format. Expected YYYY-MM-DD.json');
                return;
            }

            const dateStr = dateMatch[1];
            const date = dayjs(dateStr);

            // 下载文件内容
            const fileContent = await driveService.downloadFile(fileId);

            // 获取存储提供者
            const storage = StorageFactory.getInstance().getProvider();

            // 确认是否覆盖本地记录
            Modal.confirm({
                title: 'Restore Backup',
                content: `This will overwrite any existing chat records for ${dateStr}. Continue?`,
                onOk: async () => {
                    try {
                        // 设置当前日期以确保记录被正确存储
                        await storage.setCurrentDate(date);

                        // 只恢复特定日期的记录
                        if (Array.isArray(fileContent)) {
                            // 使用后台消息处理器恢复记录，并传递日期参数
                            chrome.runtime.sendMessage({
                                action: 'restoreRecords',
                                data: fileContent,
                                date: date.valueOf() // 转换为时间戳
                            });

                            message.success(`Successfully restored chat records for ${dateStr}`);

                            // 打开侧边面板
                            try {
                                await openSidePanel();
                            } catch (error) {
                                console.error('Failed to open sidepanel after restore:', error);
                            }
                        } else {
                            message.error('Invalid backup file format');
                        }
                    } catch (error) {
                        console.error('Error restoring records:', error);
                        message.error('Failed to restore chat records');
                    }
                },
                okText: 'Yes, Overwrite',
                cancelText: 'Cancel',
            });
        } catch (error) {
            console.error('Error loading file:', error);
            message.error('Failed to load backup file');
        } finally {
            setLoadingFileId(null);
        }
    };

    return (
        <Card title="Your backup file in Google Drive" extra={<Button icon={<FolderOutlined />} onClick={loadBackupFolder}>Refresh</Button>}>
            <div style={{ marginBottom: 16 }}>
                <Upload
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    disabled={loading}
                >
                    <Button icon={<UploadOutlined />}>Upload File</Button>
                </Upload>
            </div>

            <Spin spinning={loading}>
                <h3>Backup Files</h3>
                {backupFiles.length > 0 ? (
                    <List
                        dataSource={backupFiles}
                        renderItem={(file) => (
                            <List.Item
                                actions={[
                                    <Button
                                        type="primary"
                                        icon={<CloudDownloadOutlined />}
                                        onClick={() => handleLoadFile(file.id, file.name)}
                                        loading={loadingFileId === file.id}
                                    >
                                        Load
                                    </Button>,
                                    <Popconfirm
                                        title="Delete file"
                                        description={`Are you sure you want to delete "${file.name}"?`}
                                        onConfirm={() => handleDeleteFile(file.id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            loading={deletingFileId === file.id}
                                        >
                                            Delete
                                        </Button>
                                    </Popconfirm>
                                ]}
                            >
                                <List.Item.Meta
                                    title={file.name}
                                    description={`Type: ${file.mimeType} | Modified: ${new Date(file.modifiedTime).toLocaleString()}`}
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="No backup files found" />
                )}
            </Spin>
        </Card>
    );
};

export default Account;
