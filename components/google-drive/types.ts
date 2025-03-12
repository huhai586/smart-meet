import { Dayjs } from 'dayjs';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: number;
  mimeType?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
}

export interface SyncSummary {
  uploaded: string[];
  skipped: string[];
  totalMessages: number;
}

export interface ConflictData {
  fileName: string;
  localDate: string;
  localSize: number;
  remoteSize: number;
  localCount: number;
  remoteCount: number;
  contentEqual?: boolean;
}

export interface RestoreResult {
  success: boolean;
  date: string;
  message?: string;
} 