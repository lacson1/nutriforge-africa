/**
 * Clinician review of migrated Patient Record 2.0 entries.
 *
 * Every function here is pure: it returns a new record and never mutates its
 * input. Decisions are all-or-nothing — if any decision in a batch is invalid,
 * nothing is applied. Every applied decision is appended to `record.audit`.
 */
import {
  PATIENT_RECORDS_KEY,
  DISCARDED_LEGACY_KEY,
  TARGET_CODES,
  pendingReviewItems,
  validatePatientRecord,
} from './patient-record.mjs';

/** Allowed decisions per review item kind. */
export const REVIEW_DECISIONS = {
  consent: ['given', 'withdrawn'],
  created_by: ['patient', 'family', 'clinician'],
  condition: ['active', 'suspected', 'resolved', 'remove'],
  goal: ['clinician', 'patient', 'app_default'],
  unmapped_condition: ['acknowledged'],
};

export const CONSENT_SCOPES = ['store_on_device', 'share_with_clinician'];

/** Sanity bounds for goal edits during review (not clinical targets). */
const GOAL_BOUNDS = { kcal: [500, 6000], protein: [0, 400], fiber: [0, 150] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

/**
 * A reviewer must be a named clinician. The name is self-declared: this build
 * has no sign-in, so the audit trail records who the person said they were.
 * @returns {string|null} error message, or null when valid
 */
export function reviewerError(reviewer) {
  if (!reviewer || typeof reviewer !== 'object') return 'Reviewer details are required.';
  const name = typeof reviewer.name === 'string' ? reviewer.name.trim() : '';
  if (!name) return 'Enter the reviewing clinician’s name.';
  if (name.length > 80) return 'Reviewer name must be 80 characters or fewer.';
  if (reviewer.role !== 'clinician') return 'Only a clinician can review a migrated record.';
  return null;
}

function checkDecision(record, item, d, today) {
  const allowed = REVIEW_DECISIONS[item.kind];
  if (!d || !allowed || !allowed.includes(d.decision)) return 'Choose an option.';
  if (item.kind === 'consent' && d.decision === 'given') {
    const scope = Array.isArray(d.scope) ? d.scope : [];
    if (scope.some((s) => !CONSENT_SCOPES.includes(s))) return 'Unknown consent scope.';
    if (!scope.includes('store_on_device')) return 'Consent must at least cover storing the record on this device.';
  }
  if (item.kind === 'condition') {
    if (!record.conditions.some((c) => c.id === item.ref)) return 'Condition no longer in the record.';
    const on = d.diagnosedOn;
    if (on != null && on !== '') {
      if (!ISO_DATE.test(on) || Number.isNaN(Date.parse(on))) return 'Diagnosis date must be a valid date.';
      if (on > today) return 'Diagnosis date cannot be in the future.';
    }
  }
  if (item.kind === 'goal') {
    if (!record.goals.some((g) => g.id === item.ref)) return 'Goal no longer in the record.';
    for (const [code, v] of Object.entries(d.targets || {})) {
      if (!TARGET_CODES[code]) return `Unknown target: ${code}.`;
      if (v === null || v === '') continue;
      const b = GOAL_BOUNDS[code];
      if (typeof v !== 'number' || !Number.isFinite(v)) return `${code} must be a number or left blank.`;
      if (b && (v < b[0] || v > b[1])) return `${code} must be between ${b[0]} and ${b[1]}.`;
    }
    if (d.reviewOn != null && d.reviewOn !== '' && (!ISO_DATE.test(d.reviewOn) || d.reviewOn < today)) {
      return 'Review date must be today or later.';
    }
  }
  return null;
}

function applyOne(r, item, d) {
  let before = null;
  let after = null;
  if (item.kind === 'consent') {
    before = clone(r.consent);
    r.consent = d.decision === 'given'
      ? { status: 'given', recordedAt: d.at, scope: d.scope.slice() }
      : { status: 'withdrawn', recordedAt: d.at, scope: [] };
    after = clone(r.consent);
  } else if (item.kind === 'created_by') {
    before = r.identity.createdBy;
    r.identity.createdBy = d.decision;
    after = d.decision;
  } else if (item.kind === 'condition') {
    const i = r.conditions.findIndex((c) => c.id === item.ref);
    before = clone(r.conditions[i]);
    if (d.decision === 'remove') {
      r.conditions.splice(i, 1);
    } else {
      r.conditions[i].status = d.decision;
      r.conditions[i].diagnosedOn = d.diagnosedOn || null;
      r.conditions[i].source = 'clinician_review';
      after = clone(r.conditions[i]);
    }
  } else if (item.kind === 'goal') {
    const g = r.goals.find((x) => x.id === item.ref);
    before = clone(g);
    g.setBy = d.decision;
    for (const [code, v] of Object.entries(d.targets || {})) {
      g.targets[code] = { value: v === '' || v == null ? null : v, unit: TARGET_CODES[code] };
    }
    g.reviewOn = d.reviewOn || null;
    g.basis = `Confirmed in clinician review (${d.decision === 'app_default' ? 'app default' : `set by ${d.decision}`}).`;
    after = clone(g);
  }
  // unmapped_condition: acknowledgement only; the note stays as written.
  return { before, after };
}

/**
 * Applies a batch of decisions.
 * @param {object} record
 * @param {Record<string, object>} decisions keyed by review item key
 * @param {{name:string, role:'clinician'}} reviewer
 * @param {{ now?: string }} [opts]
 * @returns {{ ok: true, record: object } | { ok: false, errors: Record<string,string> }}
 */
export function applyReviewDecisions(record, decisions, reviewer, opts = {}) {
  const now = opts.now || new Date().toISOString();
  const today = now.slice(0, 10);
  const rErr = reviewerError(reviewer);
  if (rErr) return { ok: false, errors: { reviewer: rErr } };
  if (!record || !record.review) return { ok: false, errors: { record: 'This record has no review.' } };
  if (record.review.status === 'complete') return { ok: false, errors: { record: 'This review is already complete.' } };

  const errors = {};
  const todo = [];
  for (const [key, d] of Object.entries(decisions || {})) {
    const item = record.review.items.find((it) => it.key === key);
    if (!item) { errors[key] = 'Unknown review item.'; continue; }
    if (item.status !== 'pending') { errors[key] = 'Already decided.'; continue; }
    const e = checkDecision(record, item, d, today);
    if (e) errors[key] = e;
    else todo.push([key, d]);
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const r = clone(record);
  const by = reviewer.name.trim();
  for (const [key, d] of todo) {
    const item = r.review.items.find((it) => it.key === key);
    const { before, after } = applyOne(r, item, { ...d, at: now });
    item.status = 'decided';
    item.decision = d.decision;
    item.decidedAt = now;
    item.decidedBy = by;
    r.audit.push({ at: now, by, role: 'clinician', action: 'review_decision', itemKey: key, kind: item.kind, decision: d.decision, before, after });
  }
  r.updatedAt = now;
  const v = validatePatientRecord(r);
  if (!v.ok) return { ok: false, errors: { record: v.errors.join('; ') } };
  return { ok: true, record: r };
}

/**
 * Marks the review complete. Every item must be decided and consent must be given.
 * @returns {{ ok: true, record: object } | { ok: false, errors: Record<string,string> }}
 */
export function completeReview(record, reviewer, opts = {}) {
  const now = opts.now || new Date().toISOString();
  const rErr = reviewerError(reviewer);
  if (rErr) return { ok: false, errors: { reviewer: rErr } };
  if (!record || !record.review) return { ok: false, errors: { record: 'This record has no review.' } };
  if (record.review.status === 'complete') return { ok: false, errors: { record: 'This review is already complete.' } };
  const pending = pendingReviewItems(record);
  if (pending.length) {
    return { ok: false, errors: Object.fromEntries(pending.map((it) => [it.key, 'Decide this item before completing the review.'])) };
  }
  if (record.consent.status !== 'given') {
    return { ok: false, errors: { consent: 'Consent was not given. Discard the migrated copy instead of completing it.' } };
  }
  const r = clone(record);
  const by = reviewer.name.trim();
  r.review.status = 'complete';
  r.review.completedBy = { name: by, role: 'clinician' };
  r.review.completedAt = now;
  r.updatedAt = now;
  r.audit.push({ at: now, by, role: 'clinician', action: 'review_completed', itemKey: null, kind: null, decision: null, before: null, after: null });
  const v = validatePatientRecord(r);
  if (!v.ok) return { ok: false, errors: { record: v.errors.join('; ') } };
  return { ok: true, record: r };
}

/** Applies decisions then completes, in one all-or-nothing step. */
export function reviewAndComplete(record, decisions, reviewer, opts = {}) {
  const now = opts.now || new Date().toISOString();
  const applied = applyReviewDecisions(record, decisions, reviewer, { now });
  if (!applied.ok) return applied;
  return completeReview(applied.record, reviewer, { now });
}

/** Pending items that are not covered by a decision in the batch. */
export function undecidedKeys(record, decisions) {
  return pendingReviewItems(record).map((it) => it.key).filter((k) => !decisions || !decisions[k] || !decisions[k].decision);
}

/* ── Storage ──────────────────────────────────────────────────────────── */

function readList(storage, key) {
  try {
    const raw = storage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** @returns {object[]|null} null when the stored value is unreadable */
export function loadRecords(storage) {
  return readList(storage, PATIENT_RECORDS_KEY);
}

/** Replaces one record by id. Returns false if it could not be saved. */
export function saveRecord(storage, record) {
  const list = loadRecords(storage);
  if (!list) return false;
  const i = list.findIndex((r) => r && r.id === record.id);
  if (i < 0) return false;
  list[i] = record;
  try {
    storage.setItem(PATIENT_RECORDS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a pending migrated copy and remembers its legacy id so migration does
 * not recreate it. The v1 profile in nf_profiles is left untouched.
 * Completed reviews cannot be discarded this way.
 */
export function discardMigratedRecord(storage, recordId, reviewer, opts = {}) {
  const rErr = reviewerError(reviewer);
  if (rErr) return { ok: false, error: rErr };
  const list = loadRecords(storage);
  if (!list) return { ok: false, error: 'Saved records are unreadable.' };
  const rec = list.find((r) => r && r.id === recordId);
  if (!rec || !rec.migration) return { ok: false, error: 'Migrated record not found.' };
  if (rec.review && rec.review.status === 'complete') return { ok: false, error: 'A completed review cannot be discarded here.' };
  const discarded = readList(storage, DISCARDED_LEGACY_KEY) || [];
  const entry = rec.migration.legacyId;
  if (!discarded.includes(entry)) discarded.push(entry);
  try {
    storage.setItem(DISCARDED_LEGACY_KEY, JSON.stringify(discarded));
    storage.setItem(PATIENT_RECORDS_KEY, JSON.stringify(list.filter((r) => r !== rec)));
  } catch {
    return { ok: false, error: 'Could not save.' };
  }
  return { ok: true, legacyId: entry, at: opts.now || new Date().toISOString(), by: reviewer.name.trim() };
}
