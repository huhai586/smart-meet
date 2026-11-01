import type { LookupRecord } from './vocab-core';

/** What is kept on Drive, and what is merged: the lookup log, plus the ids of lookups that were deleted. */
export interface VocabSnapshot {
  version: 1;
  records: LookupRecord[];
  /** Lookups that were removed, with when; without them a deleted lookup would come back from the other side. */
  deleted: DeletedLookup[];
}

export interface DeletedLookup {
  id: string;
  at: number;
}

/** The file in the Drive backup folder. It is not a day of meeting records, so the restore list leaves it out. */
export const VOCAB_DRIVE_FILE_NAME = 'vocabulary.json';

/** A tombstone is only needed until every device has seen it; after this long it is dropped. */
const TOMBSTONE_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export const emptySnapshot = (): VocabSnapshot => ({ version: 1, records: [], deleted: [] });

/** Anything read from Drive or storage may be missing or from a later version: keep only what is usable. */
export const parseSnapshot = (raw: unknown): VocabSnapshot => {
  if (!raw || typeof raw !== 'object') return emptySnapshot();
  const { records, deleted } = raw as Partial<VocabSnapshot>;
  return {
    version: 1,
    records: Array.isArray(records) ? records.filter((r) => r && typeof r.id === 'string' && typeof r.word === 'string') : [],
    deleted: Array.isArray(deleted) ? deleted.filter((d) => d && typeof d.id === 'string' && typeof d.at === 'number') : [],
  };
};

/**
 * Union of both sides by id, minus whatever either side deleted. The same two logs merge to the same result
 * in either order, so a device can merge whenever it likes.
 */
export const mergeSnapshots = (a: VocabSnapshot, b: VocabSnapshot, now: number): VocabSnapshot => {
  const deleted = new Map<string, number>();
  for (const { id, at } of [...a.deleted, ...b.deleted]) {
    if (now - at > TOMBSTONE_TTL_MS) continue;
    deleted.set(id, Math.max(at, deleted.get(id) ?? 0));
  }

  const records = new Map<string, LookupRecord>();
  for (const record of [...a.records, ...b.records]) {
    if (!deleted.has(record.id) && !records.has(record.id)) records.set(record.id, record);
  }

  return {
    version: 1,
    records: [...records.values()].sort((x, y) => x.at - y.at || x.id.localeCompare(y.id)),
    deleted: [...deleted].map(([id, at]) => ({ id, at })).sort((x, y) => x.at - y.at || x.id.localeCompare(y.id)),
  };
};

/** Same lookups and same deletions, whatever the order they are listed in. */
export const sameSnapshot = (a: VocabSnapshot, b: VocabSnapshot): boolean => {
  const ids = (list: { id: string }[]) => list.map((item) => item.id).sort().join('\n');
  return ids(a.records) === ids(b.records) && ids(a.deleted) === ids(b.deleted);
};
