import { message } from 'antd';
import type {
    IGoogleDriveService,
    IGoogleDriveFolder,
    IGoogleDriveFile,
    IGoogleDriveFileContent
} from './types/google-drive.types';

const BACKUP_FOLDER_NAME = 'smartMeetbackup';

// 添加调试信息
console.log('GoogleDriveService loaded, chrome.identity available:', !!chrome?.identity);

// 创建元数据的辅助函数
function createMetadataBlob(metadata: object): Blob {
    return new Blob([JSON.stringify(metadata)], { type: 'application/json' });
}

export class GoogleDriveService implements IGoogleDriveService {
    private static instance: GoogleDriveService;
    private accessToken: string | null = null;

    private constructor() {
        console.log('GoogleDriveService instance created');
    }

    static getInstance(): IGoogleDriveService {
        if (!GoogleDriveService.instance) {
            GoogleDriveService.instance = new GoogleDriveService();
        }
        return GoogleDriveService.instance;
    }

    async authenticate(interactive: boolean = true): Promise<boolean> {
        console.log('GoogleDriveService.authenticate called, interactive:', interactive);

        if (!chrome?.identity) {
            console.error('Chrome identity API not available');
            // 不在 background 中使用 message.error
            return false;
        }

        try {
            const token = await this.getAuthToken(interactive);
            console.log('Got auth token:', token ? `${token.substring(0, 5)}...` : 'null');

            if (token) {
                this.accessToken = token;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Authentication error:', error);
            // 不在 background 中使用 message.error
            return false;
        }
    }

    private async getAuthToken(interactive: boolean = true): Promise<string | null> {
        console.log('GoogleDriveService.getAuthToken called, interactive:', interactive);

        return new Promise((resolve, reject) => {
            // 指定所需的权限范围，移除不必要的drive.readonly
            const scopes = [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ];

            console.log('Requesting auth token with scopes:', scopes.join(', '));

            chrome.identity.getAuthToken({
                interactive: interactive,
                scopes: scopes
            }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
                    
                    // 在 background 中不能使用 message.error，只记录日志
                    console.error(`Authentication error: ${errorMessage}`);
                    
                    // 如果是非交互式且用户未授权，resolve null 而不是 reject
                    // 这样可以让调用者决定如何处理
                    if (!interactive) {
                        resolve(null);
                    } else {
                        // 交互式失败时，reject 以便上层捕获
                        reject(new Error(`Authentication failed: ${errorMessage}`));
                    }
                } else {
                    console.log('Auth token obtained successfully');
                    resolve(token || null);
                }
            });
        });
    }

    async getBackupFolder(): Promise<IGoogleDriveFolder | null> {
        console.log('GoogleDriveService.getBackupFolder called, checking authentication...');

        if (!this.accessToken) {
            console.log('No access token, attempting to authenticate...');
            const authenticated = await this.authenticate(false); // 非交互式
            if (!authenticated) {
                console.error('Authentication failed, cannot get backup folder');
                throw new Error('Not authenticated');
            }
            console.log('Authentication successful');
        }

        try {
            console.log('Querying backup folder...');
            // 查询备份文件夹
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,mimeType,modifiedTime)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch backup folder:', response.status, errorText);
                throw new Error(`Failed to fetch backup folder: ${response.status}`);
            }

            const data = await response.json();
            if (data.files && data.files.length > 0) {
                console.log('Backup folder found:', data.files[0].id);
                return data.files[0];
            }

            // 如果文件夹不存在，创建一个
            console.log('Backup folder not found, creating new one...');
            return await this.createBackupFolder();
        } catch (error) {
            console.error('Error getting backup folder:', error);
            // 不在 background 中使用 message.error
            throw error;
        }
    }

    private async createBackupFolder(): Promise<IGoogleDriveFolder> {
        try {
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/files',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: BACKUP_FOLDER_NAME,
                        mimeType: 'application/vnd.google-apps.folder'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create backup folder');
            }

            const folder = await response.json();
            return folder;
        } catch (error) {
            console.error('Error creating backup folder:', error);
            // 不在 background 中使用 message.error
            throw error;
        }
    }

    async listBackupFiles(): Promise<IGoogleDriveFile[]> {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Not authenticated');
            }
        }

        try {
            const folder = await this.getBackupFolder();
            if (!folder) {
                return [];
            }

            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${folder.id}' in parents and trashed=false&fields=files(id,name,mimeType,modifiedTime,size)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch backup files');
            }

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('Error listing backup files:', error);
            message.error('Failed to list backup files from Google Drive');
            throw error;
        }
    }

    async listFiles(): Promise<IGoogleDriveFile[]> {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Not authenticated');
            }
        }

        try {
            const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,modifiedTime)', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('Error listing files:', error);
            message.error('Failed to list files from Google Drive');
            throw error;
        }
    }

    async uploadFile(file: File, existingFileId?: string): Promise<boolean> {
        if (!this.accessToken) {
            const authenticated = await this.authenticate(false); // 非交互式
            if (!authenticated) {
                throw new Error('Not authenticated');
            }
        }

        try {
            // 获取或创建备份文件夹
            const folder = await this.getBackupFolder();
            if (!folder) {
                throw new Error('Failed to get or create backup folder');
            }

            const metadata = {
                name: file.name,
                mimeType: file.type,
                parents: existingFileId ? undefined : [folder.id]
            };

            // 创建FormData
            const formData = new FormData();
            formData.append('metadata', createMetadataBlob(metadata));
            formData.append('file', file);

            let response;
            if (existingFileId) {
                // 更新现有文件
                response = await fetch(
                    `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        },
                        body: formData
                    }
                );
            } else {
                // 上传新文件
                response = await fetch(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        },
                        body: formData
                    }
                );
            }

            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Error uploading file:', error);
            // 不在 background 中使用 message.error
            return false;
        }
    }

    async deleteFile(fileId: string): Promise<boolean> {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Not authenticated');
            }
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            message.error('Failed to delete file from Google Drive');
            return false;
        }
    }

    async downloadFile(fileId: string): Promise<IGoogleDriveFileContent> {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Not authenticated');
            }
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
            }

            const content = await response.text();
            return JSON.parse(content);
        } catch (error) {
            console.error('Error downloading file:', error);
            message.error('Failed to download file from Google Drive');
            throw error;
        }
    }
}
