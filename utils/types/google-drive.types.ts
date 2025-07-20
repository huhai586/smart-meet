import type gapi from 'gapi';

/**
 * Google Drive 文件夹接口
 */
export interface IGoogleDriveFolder {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
}

export interface DriveFile extends gapi.client.drive.File {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Google Drive 文件接口
 */
export interface IGoogleDriveFile extends IGoogleDriveFolder {
    size?: string;
}

/**
 * 下载文件内容接口
 */
export interface IGoogleDriveFileContent {
    [key: string]: unknown;
}

/**
 * Google Drive 服务接口
 * 定义了与 Google Drive 交互的方法
 */
export interface IGoogleDriveService {
    /**
     * 进行身份认证
     * @param interactive 是否使用交互式认证，默认为 true
     * @returns 认证是否成功
     */
    authenticate(interactive?: boolean): Promise<boolean>;
    
    /**
     * 获取备份文件夹
     * @returns 备份文件夹信息或 null
     */
    getBackupFolder(): Promise<IGoogleDriveFolder | null>;
    
    /**
     * 获取备份文件列表
     * @returns 文件列表数组
     */
    listBackupFiles(): Promise<IGoogleDriveFile[]>;
    
    /**
     * 获取 Google Drive 中的所有文件
     * @returns 文件列表数组
     */
    listFiles(): Promise<IGoogleDriveFile[]>;
    
    /**
     * 上传文件
     * @param file 要上传的文件
     * @param existingFileId 可选的现有文件 ID，用于更新文件
     * @returns 上传是否成功
     */
    uploadFile(file: File, existingFileId?: string): Promise<boolean>;
    
    /**
     * 删除文件
     * @param fileId 要删除的文件 ID
     * @returns 删除是否成功
     */
    deleteFile(fileId: string): Promise<boolean>;
    
    /**
     * 下载文件
     * @param fileId 要下载的文件 ID
     * @returns 文件内容
     */
    downloadFile(fileId: string): Promise<IGoogleDriveFileContent>;
} 