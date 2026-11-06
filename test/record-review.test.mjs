import { describe, it, expect } from 'vitest';
import {
  PATIENT_RECORDS_KEY,
  LEGACY_PROFILES_KEY,
  DISCARDED_LEGACY_KEY,
  migrateProfileV1,
  migrateStorage,
  isRecordUsable,
  validatePatientRecord,
} from '../js/patient-record.mjs';
import {
  reviewerError,
  applyReviewDecisions,
  completeReview,
  reviewAndComplete,
  undecidedKeys,
  loadRecords,
  saveRecord,
  discardMigratedRecord,
} from '../js/record-review-core.mjs';

const NOW = '2026-11-06T10:00:00.000Z';
const DR = { name: 'Dr A. Okafor', role: 'clinician' };

const v1 = {
  id: 'p1',
  name: 'Mama Ade',
  favIds: [3],
  plateIds: [],
  savedAt: '2026-03-14',
  condition: 't2d',
  goals: { kcal: 2000, protein: 120, fiber: 35 },
  note: '',
};

function memoryStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, v); },
  };
}

function keys(rec) {
  const byKind = Object.fromEntries(rec.review.items.map((it) => [it.kind, it.key]));
  return byKind;
}

function fullDecisions(rec, overrides = {}) {
  const k = keys(rec);
  return {
    [k.consent]: { decision: 'given', scope: ['store_on_device'] },
    [k.created_by]: { decision: 'clinician' },
    [k.condition]: { decision: 'active', diagnosedOn: '2024-05-01' },
    [k.goal]: { decision: 'clinician', targets: { kcal: 1800, protein: 90, fiber: null }, reviewOn: '2027-01-15' },
    ...overrides,
  };
}

describe('reviewer', () => {
  it('requires a named clinician', () => {
    expect(reviewerError(DR)).toBeNull();
    expect(reviewerError({ name: '  ', role: 'clinician' })).toMatch(/name/);
    expect(reviewerError({ name: 'Ade', role: 'patient' })).toMatch(/clinician/);
    expect(reviewerError(null)).toBeTruthy();
  });
});

describe('applyReviewDecisions', () => {
  it('applies every decision, records who and when, and keeps the input unchanged', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const snapshot = JSON.stringify(rec);
    const res = applyReviewDecisions(rec, fullDecisions(rec), DR, { now: NOW });
    expect(res.ok).toBe(true);
    expect(JSON.stringify(rec)).toBe(snapshot);
    const r = res.record;
    expect(r.consent).toEqual({ status: 'given', recordedAt: NOW, scope: ['store_on_device'] });
    expect(r.identity.createdBy).toBe('clinician');
    expect(r.conditions[0]).toMatchObject({ code: 't2d', status: 'active', diagnosedOn: '2024-05-01', source: 'clinician_review' });
    expect(r.goals[0].setBy).toBe('clinician');
    expect(r.goals[0].targets.kcal).toEqual({ value: 1800, unit: 'kcal/day' });
    expect(r.goals[0].targets.fiber).toEqual({ value: null, unit: 'g/day' });
    expect(r.review.items.every((it) => it.status === 'decided' && it.decidedBy === 'Dr A. Okafor' && it.decidedAt === NOW)).toBe(true);
    expect(r.review.status).toBe('pending');
    const decisions = r.audit.filter((a) => a.action === 'review_decision');
    expect(decisions).toHaveLength(4);
    expect(decisions.find((a) => a.kind === 'goal').before.targets.kcal.value).toBe(2000);
  });

  it('is all-or-nothing: one bad decision applies none', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const k = keys(rec);
    const res = applyReviewDecisions(rec, fullDecisions(rec, { [k.goal]: { decision: 'clinician', targets: { kcal: 90000 } } }), DR, { now: NOW });
    expect(res.ok).toBe(false);
    expect(Object.keys(res.errors)).toEqual([k.goal]);
    expect(res.errors[k.goal]).toMatch(/between 500 and 6000/);
  });

  it('rejects consent without on-device storage, future diagnosis dates and past review dates', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const k = keys(rec);
    const res = applyReviewDecisions(rec, {
      [k.consent]: { decision: 'given', scope: ['share_with_clinician'] },
      [k.condition]: { decision: 'active', diagnosedOn: '2030-01-01' },
      [k.goal]: { decision: 'patient', reviewOn: '2020-01-01' },
    }, DR, { now: NOW });
    expect(res.ok).toBe(false);
    expect(res.errors[k.consent]).toMatch(/storing the record/);
    expect(res.errors[k.condition]).toMatch(/future/);
    expect(res.errors[k.goal]).toMatch(/today or later/);
  });

  it('removes a condition that was only a browsing filter, keeping it in the audit', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const res = applyReviewDecisions(rec, fullDecisions(rec, { [keys(rec).condition]: { decision: 'remove' } }), DR, { now: NOW });
    expect(res.ok).toBe(true);
    expect(res.record.conditions).toEqual([]);
    const entry = res.record.audit.find((a) => a.kind === 'condition');
    expect(entry.before.code).toBe('t2d');
    expect(entry.after).toBeNull();
  });

  it('refuses decisions from someone who is not a clinician', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    expect(applyReviewDecisions(rec, fullDecisions(rec), { name: 'Ade', role: 'family' }).ok).toBe(false);
  });

  it('refuses to decide an item twice', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const k = keys(rec);
    const once = applyReviewDecisions(rec, { [k.created_by]: { decision: 'patient' } }, DR, { now: NOW });
    const twice = applyReviewDecisions(once.record, { [k.created_by]: { decision: 'family' } }, DR, { now: NOW });
    expect(twice.ok).toBe(false);
    expect(twice.errors[k.created_by]).toMatch(/Already decided/);
  });
});

describe('completeReview', () => {
  it('needs every item decided', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const k = keys(rec);
    const partial = applyReviewDecisions(rec, { [k.created_by]: { decision: 'patient' } }, DR, { now: NOW }).record;
    const res = completeReview(partial, DR, { now: NOW });
    expect(res.ok).toBe(false);
    expect(Object.keys(res.errors).sort()).toEqual([k.condition, k.consent, k.goal].sort());
    expect(undecidedKeys(rec, { [k.created_by]: { decision: 'patient' } }).sort()).toEqual([k.condition, k.consent, k.goal].sort());
  });

  it('will not complete without consent', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const res = reviewAndComplete(rec, fullDecisions(rec, { [keys(rec).consent]: { decision: 'withdrawn' } }), DR, { now: NOW });
    expect(res.ok).toBe(false);
    expect(res.errors.consent).toMatch(/Discard the migrated copy/);
  });

  it('makes the record usable once complete', () => {
    const rec = migrateProfileV1(v1, { now: NOW });
    const res = reviewAndComplete(rec, fullDecisions(rec), DR, { now: NOW });
    expect(res.ok).toBe(true);
    expect(res.record.review).toMatchObject({ status: 'complete', completedBy: { name: 'Dr A. Okafor', role: 'clinician' }, completedAt: NOW });
    expect(res.record.audit.at(-1).action).toBe('review_completed');
    expect(validatePatientRecord(res.record).ok).toBe(true);
    expect(isRecordUsable(res.record)).toBe(true);
    expect(completeReview(res.record, DR).ok).toBe(false);
  });

  it('acknowledges an unrecognised condition without changing the note', () => {
    const rec = migrateProfileV1({ ...v1, condition: 'gout', goals: null }, { now: NOW });
    const k = keys(rec);
    const res = reviewAndComplete(rec, {
      [k.consent]: { decision: 'given', scope: ['store_on_device', 'share_with_clinician'] },
      [k.created_by]: { decision: 'family' },
      [k.unmapped_condition]: { decision: 'acknowledged' },
    }, DR, { now: NOW });
    expect(res.ok).toBe(true);
    expect(res.record.notes[0].text).toBe(rec.notes[0].text);
  });
});

describe('storage', () => {
  it('saves a completed review, and later migrations leave it alone', () => {
    const store = memoryStore({ [LEGACY_PROFILES_KEY]: JSON.stringify([v1]) });
    migrateStorage(store, { now: NOW });
    const [rec] = loadRecords(store);
    const done = reviewAndComplete(rec, fullDecisions(rec), DR, { now: NOW }).record;
    expect(saveRecord(store, done)).toBe(true);
    store.setItem(LEGACY_PROFILES_KEY, JSON.stringify([{ ...v1, note: 'edited later' }]));
    migrateStorage(store, { now: NOW });
    const after = loadRecords(store);
    expect(after).toHaveLength(1);
    expect(after[0].review.status).toBe('complete');
  });

  it('discards a pending copy, keeps the v1 snapshot, and does not migrate it again', () => {
    const legacyRaw = JSON.stringify([v1]);
    const store = memoryStore({ [LEGACY_PROFILES_KEY]: legacyRaw });
    migrateStorage(store, { now: NOW });
    const [rec] = loadRecords(store);
    expect(discardMigratedRecord(store, rec.id, { name: '', role: 'clinician' }).ok).toBe(false);
    const res = discardMigratedRecord(store, rec.id, DR, { now: NOW });
    expect(res).toMatchObject({ ok: true, legacyId: 'p1', by: 'Dr A. Okafor' });
    expect(loadRecords(store)).toEqual([]);
    expect(JSON.parse(store.getItem(DISCARDED_LEGACY_KEY))).toEqual(['p1']);
    expect(store.getItem(LEGACY_PROFILES_KEY)).toBe(legacyRaw);
    migrateStorage(store, { now: NOW });
    expect(loadRecords(store)).toEqual([]);
  });

  it('will not discard a completed review', () => {
    const store = memoryStore({ [LEGACY_PROFILES_KEY]: JSON.stringify([v1]) });
    migrateStorage(store, { now: NOW });
    const [rec] = loadRecords(store);
    saveRecord(store, reviewAndComplete(rec, fullDecisions(rec), DR, { now: NOW }).record);
    expect(discardMigratedRecord(store, rec.id, DR).ok).toBe(false);
    expect(JSON.parse(store.getItem(PATIENT_RECORDS_KEY))).toHaveLength(1);
  });
});
