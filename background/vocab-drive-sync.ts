import { GoogleDriveService } from "~utils/google-drive";
import { createJsonFile } from "~utils/file-utils";
import { getConfigValue } from "~utils/appConfig";
import { getVocabSnapshot, mergeRemoteVocab } from "~utils/vocab";
import { VOCAB_DRIVE_FILE_NAME } from "~utils/vocab-sync";

/** Message actions for the vocabulary backup. */
export const VocabSyncAction = {
    /** The user asked for a sync (turning it on, or the sync button). */
    SyncNow: 'vocab-sync-now',
    /** The user left a call; the meeting-record sync listens to the same message. */
    LeaveCall: 'sync-on-leave-call',
} as const;

/** When the last sync finished, in chrome.storage.local. */
export const VOCAB_LAST_SYNC_KEY = 'vocabLastSync';

export type VocabSyncResult = 'synced' | 'disabled' | 'unauthorized' | 'failed';

let running: Promise<VocabSyncResult> | null = null;

const run = async (force: boolean): Promise<VocabSyncResult> => {
    if (!force && (await getConfigValue('vocabDriveSync')) !== true) return 'disabled';

    try {
        const drive = GoogleDriveService.getInstance();
        // Never a sign-in prompt from the background: without a token the sync waits for the user.
        if (!(await drive.authenticate(false))) return 'unauthorized';

        const files = await drive.listBackupFiles();
        const remoteFile = files.find((file) => file.name === VOCAB_DRIVE_FILE_NAME);
        const remote = remoteFile ? await drive.downloadFile(remoteFile.id) : null;

        const { merged, remoteChanged } = await mergeRemoteVocab(remote);
        if (remoteChanged || !remoteFile) {
            const uploaded = await drive.uploadFile(createJsonFile(merged, VOCAB_DRIVE_FILE_NAME), remoteFile?.id);
            if (!uploaded) return 'failed';
        }

        await chrome.storage.local.set({ [VOCAB_LAST_SYNC_KEY]: Date.now() });
        return 'synced';
    } catch (error) {
        console.error('词汇同步失败:', error);
        return 'failed';
    }
};

/** One sync at a time: a leave-call and a startup landing together share the same run. */
export const syncVocabulary = (force = false): Promise<VocabSyncResult> => {
    if (!running) running = run(force).finally(() => { running = null; });
    return running;
};

export function initVocabDriveSync(): void {
    chrome.runtime.onStartup.addListener(() => { void syncVocabulary(); });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message?.action === VocabSyncAction.LeaveCall) {
            void syncVocabulary();
            return;
        }
        if (message?.action === VocabSyncAction.SyncNow) {
            syncVocabulary(true).then((result) => sendResponse({ result }));
            return true;
        }
    });
}
