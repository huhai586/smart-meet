import { message } from 'antd';

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
            const metadata = {
                name: file.name,
                mimeType: file.type
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
} 