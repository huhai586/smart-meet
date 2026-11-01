import { describe, expect, it } from 'vitest';
import { emptySnapshot, mergeSnapshots, parseSnapshot, sameSnapshot, type VocabSnapshot } from './vocab-sync';
import type { LookupRecord } from './vocab-core';

const record = (id: string, at = 1): LookupRecord => ({ id, word: 'budget', translation: '', sentence: '', meetingName: '', at });
const snapshot = (ids: string[], deleted: string[] = [], deletedAt = 100): VocabSnapshot => ({
  version: 1,
  records: ids.map((id, i) => record(id, i + 1)),
  deleted: deleted.map((id) => ({ id, at: deletedAt })),
});
const NOW = 200;

describe('mergeSnapshots', () => {
  it('keeps the lookups of both sides, once each', () => {
    const merged = mergeSnapshots(snapshot(['a', 'b']), snapshot(['b', 'c']), NOW);
    expect(merged.records.map((r) => r.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('gives the same result in either order', () => {
    const a = snapshot(['a', 'b'], ['x']);
    const b = snapshot(['c'], ['y']);
    expect(mergeSnapshots(a, b, NOW)).toEqual(mergeSnapshots(b, a, NOW));
  });

  it('does not bring back a lookup that one side deleted', () => {
    const merged = mergeSnapshots(snapshot(['a', 'b']), snapshot(['b'], ['a']), NOW);
    expect(merged.records.map((r) => r.id)).toEqual(['b']);
    expect(merged.deleted.map((d) => d.id)).toEqual(['a']);
  });

  it('drops deletions that are old enough for every device to have seen', () => {
    const old = snapshot([], ['a'], 0);
    const merged = mergeSnapshots(old, emptySnapshot(), 181 * 24 * 60 * 60 * 1000);
    expect(merged.deleted).toEqual([]);
  });

  it('merging again changes nothing', () => {
    const once = mergeSnapshots(snapshot(['a']), snapshot(['b'], ['c']), NOW);
    expect(sameSnapshot(mergeSnapshots(once, once, NOW), once)).toBe(true);
  });
});

describe('parseSnapshot', () => {
  it('reads a snapshot back', () => {
    const s = snapshot(['a'], ['b']);
    expect(parseSnapshot(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('turns anything else into an empty one', () => {
    expect(parseSnapshot(null)).toEqual(emptySnapshot());
    expect(parseSnapshot([{ id: 'meeting' }])).toEqual(emptySnapshot());
  });

  it('skips lines that are not lookups', () => {
    const parsed = parseSnapshot({ records: [record('a'), { nope: 1 }], deleted: [{ id: 'x', at: 1 }, { id: 'y' }] });
    expect(parsed.records.map((r) => r.id)).toEqual(['a']);
    expect(parsed.deleted.map((d) => d.id)).toEqual(['x']);
  });
});

describe('sameSnapshot', () => {
  it('compares by ids, not by order', () => {
    expect(sameSnapshot(snapshot(['a', 'b']), { ...snapshot(['b', 'a']) })).toBe(true);
    expect(sameSnapshot(snapshot(['a']), snapshot(['a'], ['z']))).toBe(false);
  });
});
