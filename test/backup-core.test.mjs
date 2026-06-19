import { describe, it, expect } from 'vitest';
import {
  NF_BACKUP_KEYS,
  NF_BACKUP_SCHEMA,
  buildBackupDocument,
  validateBackupDocument,
  collectBackupKeys,
  applyBackupKeys,
  sanitizeProfilesPayload,
  sanitizeBackupKeys,
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
      { nf_diary: '{"x":[]}', nf_profiles: '[{"id":"p1700000000001","name":"Test"}]' },
      mem.setItem,
      mem.removeItem,
      { mode: 'replace' },
    );
    const snap = mem.snapshot();
    expect(snap.nf_diary).toBe('{"x":[]}');
    expect(snap.nf_profiles).toBe('[{"id":"p1700000000001","name":"Test"}]');
    expect(snap.nf_chat).toBeUndefined();
    expect(snap.nf_darkmode).toBeUndefined();
  });

  it('apply merge overlays without clearing unrelated keys', () => {
    const mem = memoryStore({ nf_darkmode: '1', nf_diary: '{}' });
    applyBackupKeys({ nf_diary: '{"y":[]}' }, mem.setItem, mem.removeItem, { mode: 'merge' });
    expect(mem.snapshot().nf_darkmode).toBe('1');
    expect(mem.snapshot().nf_diary).toBe('{"y":[]}');
  });

  it('sanitizeProfilesPayload drops unsafe ids', () => {
    const raw = [
      { id: 'p123', name: 'Ada' },
      { id: "');alert(1);//", name: 'Evil' },
      { id: 'p456', name: '' },
    ];
    const clean = sanitizeProfilesPayload(raw);
    expect(clean).toHaveLength(1);
    expect(clean[0].id).toBe('p123');
  });

  it('sanitizeBackupKeys strips malicious active profile', () => {
    const keys = sanitizeBackupKeys({
      nf_profiles: JSON.stringify([{ id: 'p1700000000001', name: 'Ok' }]),
      nf_active_profile: "');alert(1);//",
    });
    expect(keys.nf_active_profile).toBeUndefined();
    expect(JSON.parse(keys.nf_profiles)[0].id).toBe('p1700000000001');
  });
});
