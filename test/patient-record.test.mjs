import { describe, it, expect } from 'vitest';
import {
  PATIENT_RECORDS_KEY,
  LEGACY_PROFILES_KEY,
  createPatientRecord,
  validatePatientRecord,
  makeObservation,
  latestObservation,
  toCanonicalUnit,
  migrateProfileV1,
  migrateProfiles,
  migrateStorage,
  isLegacyProfile,
  isRecordUsable,
  DISCARDED_LEGACY_KEY,
} from '../js/patient-record.mjs';
import { NF_BACKUP_KEYS } from '../js/backup-core.mjs';

const NOW = '2026-11-06T10:00:00.000Z';

function memoryStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, v); },
    snapshot: () => Object.fromEntries(m),
  };
}

const v1 = {
  id: 'p1730000000000',
  name: '  Mama Ade ',
  favIds: [3, '7', 7, 'x'],
  plateIds: [12],
  savedAt: '2026-03-14',
  condition: 't2d',
  goals: { kcal: 1800, protein: 90, fiber: 30 },
  note: 'Prefers eba at lunch.',
};

describe('patient-record schema', () => {
  it('an empty record is valid and holds no invented values', () => {
    const r = createPatientRecord({ now: NOW });
    expect(validatePatientRecord(r)).toEqual({ ok: true, errors: [] });
    expect(r.identity.birthYear).toBeNull();
    expect(r.consent.status).toBe('unknown');
    expect(r.observations).toEqual([]);
  });

  it('reports every problem, not just the first', () => {
    const r = createPatientRecord({ now: NOW });
    r.identity.sexAtBirth = 'robot';
    r.consent.status = 'given';
    r.conditions.push({ code: 'zzz', status: 'active', diagnosedOn: null });
    const v = validatePatientRecord(r);
    expect(v.ok).toBe(false);
    expect(v.errors).toEqual(expect.arrayContaining([
      'identity.sexAtBirth invalid',
      'consent.recordedAt required when consent is given',
      'conditions[0].code unknown: zzz',
    ]));
  });

  it('rejects conflicting pregnancy status and duplicate active conditions', () => {
    const r = createPatientRecord({ now: NOW });
    r.identity.sexAtBirth = 'male';
    r.identity.pregnancyStatus = 'pregnant';
    r.conditions.push({ code: 'htn', status: 'active', diagnosedOn: null }, { code: 'htn', status: 'active', diagnosedOn: null });
    const { errors } = validatePatientRecord(r);
    expect(errors).toContain('identity.pregnancyStatus conflicts with sexAtBirth');
    expect(errors).toContain('conditions: duplicate active condition');
  });

  it('rejects a null observation value instead of treating it as zero', () => {
    const r = createPatientRecord({ now: NOW });
    r.observations.push({ id: 'o', code: 'weight', value: null, unit: 'kg', takenOn: '2026-01-01', source: 'clinic' });
    expect(validatePatientRecord(r).errors[0]).toMatch(/unknown values are omitted, not 0/);
  });
});

describe('observations', () => {
  it('converts common alternative units', () => {
    expect(toCanonicalUnit('glucose_fasting', 126, 'mg/dL')).toEqual({ value: 6.99, unit: 'mmol/L' });
    expect(toCanonicalUnit('hba1c', 7, '%')).toEqual({ value: 53.01, unit: 'mmol/mol' });
    expect(toCanonicalUnit('weight', 70, 'lb')).toBeNull();
  });

  it('rejects implausible typing errors and missing dates', () => {
    expect(makeObservation({ code: 'height', value: 1700, unit: 'cm', takenOn: '2026-01-01' }).ok).toBe(false);
    expect(makeObservation({ code: 'height', value: 170, unit: 'cm', takenOn: 'yesterday' }).ok).toBe(false);
    expect(makeObservation({ code: 'nope', value: 1, takenOn: '2026-01-01' }).ok).toBe(false);
  });

  it('finds the most recent reading', () => {
    const r = createPatientRecord({ now: NOW });
    for (const [v, d] of [[82, '2026-01-01'], [79.5, '2026-06-01'], [80, '2026-03-01']]) {
      r.observations.push(makeObservation({ code: 'weight', value: v, unit: 'kg', takenOn: d, source: 'clinic' }).observation);
    }
    expect(latestObservation(r, 'weight').value).toBe(79.5);
    expect(latestObservation(r, 'hba1c')).toBeNull();
    expect(validatePatientRecord(r).ok).toBe(true);
  });
});

describe('migration from v1 profiles', () => {
  it('maps every v1 field and flags what needs review', () => {
    const r = migrateProfileV1(v1, { now: NOW });
    expect(validatePatientRecord(r)).toEqual({ ok: true, errors: [] });
    expect(r.id).toBe('pt_p1730000000000');
    expect(r.identity.displayName).toBe('Mama Ade');
    expect(r.createdAt).toBe('2026-03-14');
    expect(r.conditions).toHaveLength(1);
    expect(r.conditions[0]).toMatchObject({ code: 't2d', status: 'active', diagnosedOn: null, source: 'legacy_profile' });
    expect(r.goals[0].setBy).toBe('unknown');
    expect(r.goals[0].targets.kcal).toEqual({ value: 1800, unit: 'kcal/day' });
    expect(r.notes[0].text).toBe('Prefers eba at lunch.');
    expect(r.app).toEqual({ favouriteFoodIds: [3, 7], plateFoodIds: [12], diaryKey: 'p1730000000000' });
    expect(r.migration).toEqual({ from: 1, legacyId: 'p1730000000000', at: NOW });
    expect(r.review.status).toBe('pending');
    expect(r.review.items.map((it) => it.kind)).toEqual(['consent', 'created_by', 'condition', 'goal']);
    expect(r.review.items[2].ref).toBe(r.conditions[0].id);
    expect(r.review.items[3].ref).toBe(r.goals[0].id);
    expect(isRecordUsable(r)).toBe(false);
  });

  it('does not invent consent, measurements or demographics', () => {
    const r = migrateProfileV1(v1, { now: NOW });
    expect(r.consent.status).toBe('unknown');
    expect(r.observations).toEqual([]);
    expect(r.medications).toEqual([]);
    expect(r.identity.sexAtBirth).toBeNull();
  });

  it('keeps missing goals as null, never zero', () => {
    const r = migrateProfileV1({ ...v1, goals: { kcal: 2000 } }, { now: NOW });
    expect(r.goals[0].targets.protein).toEqual({ value: null, unit: 'g/day' });
    expect(r.goals[0].targets.fiber.value).toBeNull();
  });

  it('handles a minimal profile with no condition, goals or note', () => {
    const r = migrateProfileV1({ id: 'p2', name: 'Kofi' }, { now: NOW });
    expect(validatePatientRecord(r).ok).toBe(true);
    expect(r.conditions).toEqual([]);
    expect(r.goals).toEqual([]);
    expect(r.notes).toEqual([]);
    expect(r.createdAt).toBe(NOW);
  });

  it('keeps an unrecognised condition as a note instead of dropping it', () => {
    const r = migrateProfileV1({ ...v1, condition: 'gout' }, { now: NOW });
    expect(r.conditions).toEqual([]);
    expect(r.notes[0].text).toMatch(/unrecognised condition "gout"/);
    expect(r.review.items.find((it) => it.kind === 'unmapped_condition').ref).toBe(r.notes[0].id);
  });

  it('is idempotent and reports bad entries', () => {
    const first = migrateProfiles([v1, { id: 'p2', name: 'Kofi' }, null, 'junk'], [], { now: NOW });
    expect(first.migrated).toEqual(['p1730000000000', 'p2']);
    expect(first.failed).toHaveLength(2);
    const second = migrateProfiles([v1, { id: 'p2', name: 'Kofi' }], first.records, { now: NOW });
    expect(second.migrated).toEqual([]);
    expect(second.skipped).toEqual(['p1730000000000', 'p2']);
    expect(second.records).toHaveLength(2);
  });

  it('rebuilds a pending copy when its snapshot changes, and removes it when deleted', () => {
    const first = migrateProfiles([v1], [], { now: NOW });
    const same = migrateProfiles([v1], first.records, { now: NOW });
    expect(same.refreshed).toEqual([]);
    const edited = migrateProfiles([{ ...v1, note: 'Now prefers amala.' }], first.records, { now: NOW });
    expect(edited.refreshed).toEqual(['p1730000000000']);
    expect(edited.records).toHaveLength(1);
    expect(edited.records[0].notes[0].text).toBe('Now prefers amala.');
    const deleted = migrateProfiles([], first.records, { now: NOW });
    expect(deleted.removed).toEqual(['p1730000000000']);
    expect(deleted.records).toEqual([]);
  });

  it('never touches a reviewed copy, even if the snapshot changes or is deleted', () => {
    const rec = migrateProfiles([v1], [], { now: NOW }).records[0];
    const reviewed = { ...rec, review: { ...rec.review, status: 'complete' } };
    expect(migrateProfiles([{ ...v1, note: 'x' }], [reviewed]).records[0]).toBe(reviewed);
    expect(migrateProfiles([], [reviewed]).records[0]).toBe(reviewed);
  });

  it('skips discarded profiles', () => {
    const res = migrateProfiles([v1], [], { now: NOW, discarded: ['p1730000000000'] });
    expect(res.migrated).toEqual([]);
    expect(res.skipped).toEqual(['p1730000000000']);
  });

  it('does not treat a v2 record as a v1 profile', () => {
    expect(isLegacyProfile(migrateProfileV1(v1, { now: NOW }))).toBe(false);
  });
});

describe('migrateStorage', () => {
  it('writes v2 records and leaves nf_profiles byte-for-byte unchanged', () => {
    const legacyRaw = JSON.stringify([v1]);
    const store = memoryStore({ [LEGACY_PROFILES_KEY]: legacyRaw });
    const res = migrateStorage(store, { now: NOW });
    expect(res.ok).toBe(true);
    expect(res.migrated).toEqual(['p1730000000000']);
    expect(store.getItem(LEGACY_PROFILES_KEY)).toBe(legacyRaw);
    const saved = JSON.parse(store.getItem(PATIENT_RECORDS_KEY));
    expect(saved).toHaveLength(1);
    expect(saved[0].migration.legacyId).toBe('p1730000000000');
  });

  it('does not write when there is nothing to migrate', () => {
    const store = memoryStore();
    expect(migrateStorage(store, { now: NOW }).migrated).toEqual([]);
    expect(store.getItem(PATIENT_RECORDS_KEY)).toBeNull();
  });

  it('refuses to overwrite unreadable v2 data', () => {
    const store = memoryStore({ [LEGACY_PROFILES_KEY]: JSON.stringify([v1]), [PATIENT_RECORDS_KEY]: '{broken' });
    const res = migrateStorage(store, { now: NOW });
    expect(res.ok).toBe(false);
    expect(store.getItem(PATIENT_RECORDS_KEY)).toBe('{broken');
  });

  it('v2 records are included in backups', () => {
    expect(NF_BACKUP_KEYS).toContain(PATIENT_RECORDS_KEY);
    expect(NF_BACKUP_KEYS).toContain(DISCARDED_LEGACY_KEY);
  });
});
