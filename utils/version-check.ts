import { version } from '../package.json';

interface VersionInfo {
    lastVersion: string;
    currentVersion: string;
}

export class VersionCheck {
    private static readonly VERSION_KEY = 'extension_version';

    static async checkForUpdate(): Promise<boolean> {
        const versionInfo = await this.getVersionInfo();
        
        // 如果是首次安装
        if (!versionInfo.lastVersion) {
            await this.saveVersion(version);
            return false;
        }

        // 检查是否是大版本更新
        const shouldShowUpdate = this.isMajorUpdate(versionInfo.lastVersion, version);
        
        // 保存新版本号
        await this.saveVersion(version);
        
        return shouldShowUpdate;
    }

    private static async getVersionInfo(): Promise<VersionInfo> {
        return new Promise((resolve) => {
            chrome.storage.local.get(this.VERSION_KEY, (result) => {
                resolve({
                    lastVersion: result[this.VERSION_KEY] || '',
                    currentVersion: version
                });
            });
        });
    }

    private static async saveVersion(version: string): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.VERSION_KEY]: version }, resolve);
        });
    }

    private static isMajorUpdate(oldVersion: string, newVersion: string): boolean {
        const oldMajor = parseInt(oldVersion.split('.')[0]);
        const newMajor = parseInt(newVersion.split('.')[0]);
        return newMajor > oldMajor;
    }
} 