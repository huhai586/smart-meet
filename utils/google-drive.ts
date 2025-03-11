import { message } from 'antd';

const BACKUP_FOLDER_NAME = 'smartMeetbackup';

export class GoogleDriveService {
    private static instance: GoogleDriveService;
    private accessToken: string | null = null;

    private constructor() {}

    static getInstance(): GoogleDriveService {
        if (!GoogleDriveService.instance) {
            GoogleDriveService.instance = new GoogleDriveService();
        }
        return GoogleDriveService.instance;
    }

    async authenticate(): Promise<boolean> {
        try {
            const token = await this.getAuthToken();
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
        return new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    resolve(null);
                } else {
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
                `https://www.googleapis.com/drive/v3/files?q='${folder.id}' in parents and trashed=false&fields=files(id,name,mimeType,modifiedTime)`,
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

    async uploadFile(file: File): Promise<boolean> {
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
                parents: [folder.id]
            };

            // 首先上传元数据
            const metadataResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (!metadataResponse.ok) {
                throw new Error('Failed to create file metadata');
            }

            const location = metadataResponse.headers.get('Location');
            if (!location) {
                throw new Error('No upload location received');
            }

            // 然后上传文件内容
            const uploadResponse = await fetch(location, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file content');
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