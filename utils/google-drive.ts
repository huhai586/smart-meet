import { message } from 'antd';

const BACKUP_FOLDER_NAME = 'smartMeetbackup';

// 添加调试信息
console.log('GoogleDriveService loaded, chrome.identity available:', !!window.chrome?.identity);

export class GoogleDriveService {
    private static instance: GoogleDriveService;
    private accessToken: string | null = null;

    private constructor() {
        console.log('GoogleDriveService instance created');
    }

    static getInstance(): GoogleDriveService {
        if (!GoogleDriveService.instance) {
            GoogleDriveService.instance = new GoogleDriveService();
        }
        return GoogleDriveService.instance;
    }

    async authenticate(): Promise<boolean> {
        console.log('GoogleDriveService.authenticate called');
        
        if (!window.chrome?.identity) {
            console.error('Chrome identity API not available');
            message.error('Chrome identity API not available');
            return false;
        }
        
        try {
            const token = await this.getAuthToken();
            console.log('Got auth token:', token ? `${token.substring(0, 5)}...` : 'null');
            
            if (token) {
                this.accessToken = token;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Authentication error:', error);
            message.error('Failed to authenticate with Google Drive');
            return false;
        }
    }

    private async getAuthToken(): Promise<string | null> {
        console.log('GoogleDriveService.getAuthToken called');
        
        return new Promise((resolve) => {
            // 指定所需的权限范围
            const scopes = [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.readonly',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ];
            
            console.log('Requesting auth token with scopes:', scopes.join(', '));
            
            chrome.identity.getAuthToken({ 
                interactive: true,
                scopes: scopes
            }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    message.error(`Authentication error: ${chrome.runtime.lastError.message || 'Unknown error'}`);
                    resolve(null);
                } else {
                    console.log('Auth token obtained successfully');
                    resolve(token);
                }
            });
        });
    }

    async getBackupFolder(): Promise<any | null> {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Not authenticated');
            }
        }

        try {
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
                throw new Error('Failed to fetch backup folder');
            }

            const data = await response.json();
            if (data.files && data.files.length > 0) {
                return data.files[0];
            }

            // 如果文件夹不存在，创建一个
            return await this.createBackupFolder();
        } catch (error) {
            console.error('Error getting backup folder:', error);
            message.error('Failed to get backup folder from Google Drive');
            throw error;
        }
    }

    private async createBackupFolder(): Promise<any> {
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
            message.error('Failed to create backup folder in Google Drive');
            throw error;
        }
    }

    async listBackupFiles(): Promise<any[]> {
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

    async listFiles(): Promise<any[]> {
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
            const authenticated = await this.authenticate();
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
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
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
            message.error('Failed to upload file to Google Drive');
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

    async downloadFile(fileId: string): Promise<any> {
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