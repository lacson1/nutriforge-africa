import { describe, it, expect } from 'vitest';
import {
  NF_BACKUP_KEYS,
  NF_BACKUP_SCHEMA,
  buildBackupDocument,
  validateBackupDocument,
  collectBackupKeys,
  applyBackupKeys,
} from '../js/backup-core.mjs';

function memoryStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    },
    snapshot: () => Object.fromEntries(m),
  };
}

describe('backup-core', () => {
  it('lists stable keys', () => {
    expect(NF_BACKUP_KEYS).toContain('nf_diary');
    expect(NF_BACKUP_KEYS).toContain('nf_profiles');
    expect(NF_BACKUP_KEYS).toContain('nf_saved_plates');
    expect(NF_BACKUP_KEYS).toContain('nf_meal_plates');
    expect(NF_BACKUP_KEYS).toContain('nf_today_focus');
    expect(new Set(NF_BACKUP_KEYS).size).toBe(NF_BACKUP_KEYS.length);
  });

  it('collectBackupKeys reads only known keys', () => {
    const mem = memoryStore({
      nf_diary: '{"2025-01-01":[]}',
      nf_other: 'skip',
      nf_profiles: '[]',
    });
    const keys = collectBackupKeys(mem.getItem);
    expect(keys.nf_diary).toBe('{"2025-01-01":[]}');
    expect(keys.nf_profiles).toBe('[]');
    expect(keys.nf_other).toBeUndefined();
  });

  it('buildBackupDocument validates shape', () => {
    const mem = memoryStore({ nf_darkmode: '1' });
    const doc = buildBackupDocument(mem.getItem);
    expect(doc.schema).toBe(NF_BACKUP_SCHEMA);
    expect(doc.version).toBe(1);
    expect(doc.keys.nf_darkmode).toBe('1');
    expect(validateBackupDocument(doc)).toBe(true);
  });

  it('validateBackupDocument rejects garbage', () => {
    expect(validateBackupDocument(null)).toBe(false);
    expect(validateBackupDocument({ schema: 'x', keys: {} })).toBe(false);
    expect(validateBackupDocument({ schema: NF_BACKUP_SCHEMA, keys: [] })).toBe(false);
  });

  it('apply replace clears then applies', () => {
    const mem = memoryStore({
      nf_diary: '{}',
      nf_chat: '[]',
      nf_darkmode: '0',
    });
    applyBackupKeys(
      { nf_diary: '{"x":[]}', nf_profiles: '[{"id":"p1"}]' },
      mem.setItem,
      mem.removeItem,
      { mode: 'replace' },
    );
    const snap = mem.snapshot();
    expect(snap.nf_diary).toBe('{"x":[]}');
    expect(snap.nf_profiles).toBe('[{"id":"p1"}]');
    expect(snap.nf_chat).toBeUndefined();
    expect(snap.nf_darkmode).toBeUndefined();
  });

  it('apply merge overlays without clearing unrelated keys', () => {
    const mem = memoryStore({ nf_darkmode: '1', nf_diary: '{}' });
    applyBackupKeys({ nf_diary: '{"y":[]}' }, mem.setItem, mem.removeItem, { mode: 'merge' });
    expect(mem.snapshot().nf_darkmode).toBe('1');
    expect(mem.snapshot().nf_diary).toBe('{"y":[]}');
  });
});

it('backs up and restores household plans without usage counts or unrelated keys',()=>{
 const mem=memoryStore({nf_weekly_plan_personal:'{"meals":[]}',nf_shopping_personal_2026_ignored:'no', 'nf_shopping_personal_2026-10-12_options':'{"family":4}',nf_journey_metrics:'private-local',other:'untouched'});
 const doc=buildBackupDocument(mem.getItem,{},Object.keys(mem.snapshot()));expect(doc.keys.nf_weekly_plan_personal).toBe('{"meals":[]}');expect(doc.keys['nf_shopping_personal_2026-10-12_options']).toBe('{"family":4}');expect(doc.keys.nf_journey_metrics).toBeUndefined();
 const target=memoryStore({nf_weekly_plan_old:'{}',other:'untouched'});applyBackupKeys(doc.keys,target.setItem,target.removeItem,{availableKeys:Object.keys(target.snapshot())});expect(target.snapshot().nf_weekly_plan_old).toBeUndefined();expect(target.snapshot().nf_weekly_plan_personal).toBe('{"meals":[]}');expect(target.snapshot().other).toBe('untouched');
});
