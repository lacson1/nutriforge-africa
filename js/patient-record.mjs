/**
 * Patient Record 2.0 — schema, validation and migration from v1 client profiles.
 *
 * v1 profiles live in localStorage `nf_profiles` as:
 *   { id, name, favIds, plateIds, savedAt, condition, goals:{kcal,protein,fiber}, note }
 *
 * v2 records live in a separate key, `nf_patient_records`, so the existing UI keeps
 * reading v1 untouched. Migration is additive and idempotent: it never edits or
 * deletes `nf_profiles`, and re-running it does not duplicate records.
 *
 * Rules carried over from the nutrition audit:
 *   - Unknown is `null`, never 0 and never a silently substituted default.
 *   - Every clinical value carries a date, a unit and a source.
 *
 * This module only stores and validates data. It does not make clinical decisions
 * (clinical tools remain withdrawn — see PRODUCT.md).
 */

export const PATIENT_RECORD_SCHEMA = 'nutriforge-patient-record';
export const PATIENT_RECORD_VERSION = 2;
export const PATIENT_RECORDS_KEY = 'nf_patient_records';
export const LEGACY_PROFILES_KEY = 'nf_profiles';

/** Condition codes. The first 15 match CONDITIONS in index.html; ckd is new in v2. */
export const CONDITION_CODES = [
  't2d', 'htn', 'dyslip', 'cvd', 'anaemia', 'inflam', 'gut', 'obesity', 'cancer',
  'brain', 'bone', 'liver', 'thyroid', 'immune', 'menopause', 'ckd',
];

export const CONDITION_STATUSES = ['active', 'resolved', 'suspected'];
export const RECORD_ROLES = ['patient', 'family', 'clinician', 'unknown'];
export const CONSENT_STATUSES = ['given', 'withdrawn', 'unknown'];
export const SEX_AT_BIRTH = ['female', 'male', 'intersex', 'undisclosed'];
export const PREGNANCY_STATUSES = ['not_pregnant', 'pregnant', 'breastfeeding', 'not_applicable', 'unknown'];
export const ALLERGY_SEVERITIES = ['intolerance', 'mild', 'moderate', 'severe', 'anaphylaxis', 'unknown'];
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
export const BUDGET_BANDS = ['low', 'medium', 'high'];
export const GOAL_SETTERS = ['clinician', 'patient', 'app_default', 'unknown'];

/**
 * Medication flags that change nutrition advice. Stored as data only; nothing in
 * this module acts on them.
 */
export const MEDICATION_FLAGS = [
  'insulin',              // hypoglycaemia risk
  'sulfonylurea',         // hypoglycaemia risk
  'warfarin',             // vitamin K consistency
  'metformin',            // B12
  'ace_inhibitor_arb',    // potassium
  'potassium_sparing',    // potassium
  'mao_inhibitor',        // tyramine
];

/**
 * Observation codes with canonical units and plausibility bounds. Bounds reject
 * typing errors (e.g. 1700 for 170 cm); they are not clinical reference ranges.
 */
export const OBSERVATION_CODES = {
  weight:        { unit: 'kg',          min: 1,   max: 400 },
  height:        { unit: 'cm',          min: 30,  max: 250 },
  waist:         { unit: 'cm',          min: 20,  max: 250 },
  bp_systolic:   { unit: 'mmHg',        min: 50,  max: 300 },
  bp_diastolic:  { unit: 'mmHg',        min: 20,  max: 200 },
  hba1c:         { unit: 'mmol/mol',    min: 10,  max: 200, altUnits: { '%': (v) => (v - 2.15) * 10.929 } },
  glucose_fasting: { unit: 'mmol/L',    min: 1,   max: 50,  altUnits: { 'mg/dL': (v) => v / 18.016 } },
  glucose_random:  { unit: 'mmol/L',    min: 1,   max: 50,  altUnits: { 'mg/dL': (v) => v / 18.016 } },
  chol_total:    { unit: 'mmol/L',      min: 0.5, max: 25,  altUnits: { 'mg/dL': (v) => v / 38.67 } },
  chol_ldl:      { unit: 'mmol/L',      min: 0.1, max: 20,  altUnits: { 'mg/dL': (v) => v / 38.67 } },
  chol_hdl:      { unit: 'mmol/L',      min: 0.1, max: 10,  altUnits: { 'mg/dL': (v) => v / 38.67 } },
  triglycerides: { unit: 'mmol/L',      min: 0.1, max: 60,  altUnits: { 'mg/dL': (v) => v / 88.57 } },
  haemoglobin:   { unit: 'g/dL',        min: 2,   max: 25,  altUnits: { 'g/L': (v) => v / 10 } },
  ferritin:      { unit: 'ug/L',        min: 0,   max: 10000 },
  egfr:          { unit: 'mL/min/1.73m2', min: 1, max: 200 },
  potassium:     { unit: 'mmol/L',      min: 1,   max: 10 },
  alt:           { unit: 'U/L',         min: 0,   max: 5000 },
  ast:           { unit: 'U/L',         min: 0,   max: 5000 },
};

export const OBSERVATION_SOURCES = ['self_reported', 'clinic', 'lab', 'device', 'unknown'];

/** Nutrient targets a goal can set, with units. */
export const TARGET_CODES = {
  kcal:          'kcal/day',
  protein:       'g/day',
  fiber:         'g/day',
  carbs:         'g/day',
  carbs_per_meal:'g/meal',
  fat:           'g/day',
  sat_fat:       'g/day',
  sodium:        'mg/day',
  potassium:     'mg/day',
  phosphorus:    'mg/day',
  sugar_free:    'g/day',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function isIsoDate(v) {
  return typeof v === 'string' && (ISO_DATE.test(v) || ISO_DATETIME.test(v)) && !Number.isNaN(Date.parse(v));
}
function isNullableString(v) { return v === null || typeof v === 'string'; }
function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function uniqInts(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list) {
    const n = typeof x === 'string' ? Number(x) : x;
    if (Number.isInteger(n) && !out.includes(n)) out.push(n);
  }
  return out;
}

let idCounter = 0;
/** Short, collision-resistant local id. Not a UUID; fine for a single device. */
export function newId(prefix = 'r') {
  idCounter = (idCounter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * An empty v2 record. Every unknown value is null or an empty list.
 * @param {{ id?: string, displayName?: string, now?: string, createdBy?: string }} [opts]
 */
export function createPatientRecord(opts = {}) {
  const now = opts.now || new Date().toISOString();
  return {
    schema: PATIENT_RECORD_SCHEMA,
    version: PATIENT_RECORD_VERSION,
    id: opts.id || newId('pt'),
    createdAt: now,
    updatedAt: now,

    identity: {
      displayName: opts.displayName || '',
      birthYear: null,            // year only; full DOB is not collected
      ageBand: null,              // e.g. '40-49' when birth year is not given
      sexAtBirth: null,
      pregnancyStatus: null,
      createdBy: RECORD_ROLES.includes(opts.createdBy) ? opts.createdBy : 'unknown',
    },

    consent: {
      status: 'unknown',
      recordedAt: null,
      scope: [],                  // e.g. ['store_on_device', 'share_with_clinician']
    },

    conditions: [],               // { id, code, status, diagnosedOn, source, addedAt }
    medications: [],              // { id, name, dose, flags[], startedOn, stoppedOn, source }
    allergies: [],                // { id, substance, severity, reaction, source }
    observations: [],             // { id, code, value, unit, takenOn, source, note }

    foodContext: {
      region: null,               // e.g. 'NG-SW', 'KE', 'ZA'
      cuisines: [],
      preferredLanguages: [],     // BCP 47, e.g. ['yo', 'en']
      dietaryRules: [],           // e.g. ['halal', 'vegetarian', 'no_pork']
      fastingPractices: [],       // e.g. ['ramadan', 'lent']
      cooksForSelf: null,
      householdSize: null,
      budgetBand: null,
      usualStaples: [],           // free text or food ids, e.g. ['eba', 'ugali']
      mealTimes: [],              // 'HH:MM'
      shiftWork: null,
    },

    lifestyle: {
      activityLevel: null,
      sleepQuality: null,         // 1–5 self-rating
      stress: null,               // 1–5 self-rating
    },

    goals: [],                    // { id, targets:{code:{value,unit}}, setBy, basis, setOn, reviewOn }

    notes: [],                    // { id, at, author, role, text }

    app: {
      favouriteFoodIds: [],
      plateFoodIds: [],
      diaryKey: null,             // profile id under nf_diary_by_profile
    },

    migration: null,              // { from, legacyId, at, review[] }
  };
}

/**
 * Converts a value in an alternative unit to the code's canonical unit.
 * Returns null when the unit is not recognised for the code.
 */
export function toCanonicalUnit(code, value, unit) {
  const def = OBSERVATION_CODES[code];
  if (!def || !isFiniteNumber(value)) return null;
  if (unit === def.unit) return { value, unit: def.unit };
  const conv = def.altUnits && def.altUnits[unit];
  if (!conv) return null;
  return { value: Math.round(conv(value) * 100) / 100, unit: def.unit };
}

/**
 * Builds a validated observation. Converts units; rejects implausible values.
 * @returns {{ ok: true, observation: object } | { ok: false, error: string }}
 */
export function makeObservation({ code, value, unit, takenOn, source = 'unknown', note = '' }) {
  const def = OBSERVATION_CODES[code];
  if (!def) return { ok: false, error: `unknown observation code: ${code}` };
  if (!isIsoDate(takenOn)) return { ok: false, error: `${code}: takenOn must be an ISO date` };
  const canon = toCanonicalUnit(code, value, unit || def.unit);
  if (!canon) return { ok: false, error: `${code}: value must be a number in ${def.unit}` };
  if (canon.value < def.min || canon.value > def.max) {
    return { ok: false, error: `${code}: ${canon.value} ${def.unit} is outside ${def.min}–${def.max}` };
  }
  return {
    ok: true,
    observation: {
      id: newId('obs'),
      code,
      value: canon.value,
      unit: canon.unit,
      takenOn,
      source: OBSERVATION_SOURCES.includes(source) ? source : 'unknown',
      note: String(note || '').slice(0, 280),
    },
  };
}

/** Latest observation for a code, or null. */
export function latestObservation(record, code) {
  let best = null;
  for (const o of record.observations || []) {
    if (o.code !== code) continue;
    if (!best || Date.parse(o.takenOn) > Date.parse(best.takenOn)) best = o;
  }
  return best;
}

/**
 * Validates a v2 record. Returns every problem found rather than stopping at the first.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validatePatientRecord(r) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, errors: ['record must be an object'] };

  if (r.schema !== PATIENT_RECORD_SCHEMA) err('schema mismatch');
  if (r.version !== PATIENT_RECORD_VERSION) err(`version must be ${PATIENT_RECORD_VERSION}`);
  if (typeof r.id !== 'string' || !r.id) err('id required');
  if (!isIsoDate(r.createdAt)) err('createdAt must be an ISO date');
  if (!isIsoDate(r.updatedAt)) err('updatedAt must be an ISO date');

  const id = r.identity || {};
  if (typeof id.displayName !== 'string') err('identity.displayName must be a string');
  if (id.birthYear !== null && id.birthYear !== undefined) {
    const y = new Date().getFullYear();
    if (!Number.isInteger(id.birthYear) || id.birthYear < y - 120 || id.birthYear > y) err('identity.birthYear out of range');
  }
  if (id.sexAtBirth != null && !SEX_AT_BIRTH.includes(id.sexAtBirth)) err('identity.sexAtBirth invalid');
  if (id.pregnancyStatus != null && !PREGNANCY_STATUSES.includes(id.pregnancyStatus)) err('identity.pregnancyStatus invalid');
  if (id.pregnancyStatus && ['pregnant', 'breastfeeding'].includes(id.pregnancyStatus) && id.sexAtBirth === 'male') {
    err('identity.pregnancyStatus conflicts with sexAtBirth');
  }
  if (!RECORD_ROLES.includes(id.createdBy)) err('identity.createdBy invalid');

  const c = r.consent || {};
  if (!CONSENT_STATUSES.includes(c.status)) err('consent.status invalid');
  if (c.status === 'given' && !isIsoDate(c.recordedAt)) err('consent.recordedAt required when consent is given');
  if (!Array.isArray(c.scope)) err('consent.scope must be a list');

  for (const k of ['conditions', 'medications', 'allergies', 'observations', 'goals', 'notes']) {
    if (!Array.isArray(r[k])) err(`${k} must be a list`);
  }

  (r.conditions || []).forEach((x, i) => {
    if (!CONDITION_CODES.includes(x.code)) err(`conditions[${i}].code unknown: ${x.code}`);
    if (!CONDITION_STATUSES.includes(x.status)) err(`conditions[${i}].status invalid`);
    if (x.diagnosedOn != null && !isIsoDate(x.diagnosedOn)) err(`conditions[${i}].diagnosedOn must be an ISO date or null`);
  });
  const activeCodes = (r.conditions || []).filter((x) => x.status === 'active').map((x) => x.code);
  if (new Set(activeCodes).size !== activeCodes.length) err('conditions: duplicate active condition');

  (r.medications || []).forEach((x, i) => {
    if (typeof x.name !== 'string' || !x.name.trim()) err(`medications[${i}].name required`);
    if (!Array.isArray(x.flags) || x.flags.some((f) => !MEDICATION_FLAGS.includes(f))) err(`medications[${i}].flags invalid`);
  });

  (r.allergies || []).forEach((x, i) => {
    if (typeof x.substance !== 'string' || !x.substance.trim()) err(`allergies[${i}].substance required`);
    if (!ALLERGY_SEVERITIES.includes(x.severity)) err(`allergies[${i}].severity invalid`);
  });

  (r.observations || []).forEach((x, i) => {
    const def = OBSERVATION_CODES[x.code];
    if (!def) { err(`observations[${i}].code unknown: ${x.code}`); return; }
    if (x.unit !== def.unit) err(`observations[${i}].unit must be ${def.unit}`);
    if (!isFiniteNumber(x.value)) err(`observations[${i}].value must be a number (unknown values are omitted, not 0)`);
    else if (x.value < def.min || x.value > def.max) err(`observations[${i}].value outside plausible range`);
    if (!isIsoDate(x.takenOn)) err(`observations[${i}].takenOn must be an ISO date`);
    if (!OBSERVATION_SOURCES.includes(x.source)) err(`observations[${i}].source invalid`);
  });

  (r.goals || []).forEach((g, i) => {
    if (!GOAL_SETTERS.includes(g.setBy)) err(`goals[${i}].setBy invalid`);
    if (!g.targets || typeof g.targets !== 'object') { err(`goals[${i}].targets required`); return; }
    for (const [code, t] of Object.entries(g.targets)) {
      if (!TARGET_CODES[code]) err(`goals[${i}].targets.${code} unknown`);
      else if (!t || t.unit !== TARGET_CODES[code]) err(`goals[${i}].targets.${code}.unit must be ${TARGET_CODES[code]}`);
      else if (t.value !== null && !(isFiniteNumber(t.value) && t.value >= 0)) err(`goals[${i}].targets.${code}.value must be ≥0 or null`);
    }
    if (g.setOn != null && !isIsoDate(g.setOn)) err(`goals[${i}].setOn must be an ISO date`);
    if (g.reviewOn != null && !isIsoDate(g.reviewOn)) err(`goals[${i}].reviewOn must be an ISO date`);
  });

  (r.notes || []).forEach((n, i) => {
    if (!isIsoDate(n.at)) err(`notes[${i}].at must be an ISO date`);
    if (typeof n.text !== 'string') err(`notes[${i}].text must be a string`);
    if (!RECORD_ROLES.includes(n.role)) err(`notes[${i}].role invalid`);
  });

  const fc = r.foodContext || {};
  if (fc.householdSize != null && !(Number.isInteger(fc.householdSize) && fc.householdSize >= 1 && fc.householdSize <= 50)) {
    err('foodContext.householdSize must be 1–50 or null');
  }
  if (fc.budgetBand != null && !BUDGET_BANDS.includes(fc.budgetBand)) err('foodContext.budgetBand invalid');
  if (!isNullableString(fc.region ?? null)) err('foodContext.region must be a string or null');

  const ls = r.lifestyle || {};
  if (ls.activityLevel != null && !ACTIVITY_LEVELS.includes(ls.activityLevel)) err('lifestyle.activityLevel invalid');
  for (const k of ['sleepQuality', 'stress']) {
    if (ls[k] != null && !(Number.isInteger(ls[k]) && ls[k] >= 1 && ls[k] <= 5)) err(`lifestyle.${k} must be 1–5 or null`);
  }

  return { ok: errors.length === 0, errors };
}

/** True when the value looks like a v1 profile from nf_profiles. */
export function isLegacyProfile(p) {
  return !!p && typeof p === 'object' && !Array.isArray(p) && typeof p.id === 'string' && p.version === undefined && p.schema === undefined;
}

/**
 * Migrates one v1 profile to a v2 record.
 *
 * Mapping:
 *   name       → identity.displayName
 *   condition  → conditions[0] (status 'active', diagnosedOn null, source 'legacy_profile')
 *   goals      → goals[0] with setBy 'unknown' (v1 could not tell clinician from app default)
 *   note       → notes[0], role 'unknown'
 *   favIds     → app.favouriteFoodIds
 *   plateIds   → app.plateFoodIds
 *   id         → app.diaryKey and migration.legacyId (diary data stays where it is)
 *
 * Nothing is invented: consent stays 'unknown', no measurements are created, and
 * `migration.review` lists what a person needs to confirm.
 *
 * @param {object} p v1 profile
 * @param {{ now?: string }} [opts]
 */
export function migrateProfileV1(p, opts = {}) {
  if (!isLegacyProfile(p)) throw new TypeError('not a v1 profile');
  const now = opts.now || new Date().toISOString();
  const createdAt = isIsoDate(p.savedAt) ? p.savedAt : now;
  const record = createPatientRecord({
    id: `pt_${p.id}`,
    displayName: typeof p.name === 'string' ? p.name.trim().slice(0, 80) : '',
    now,
  });
  record.createdAt = createdAt;
  const review = ['consent', 'createdBy'];

  if (typeof p.condition === 'string' && p.condition) {
    if (CONDITION_CODES.includes(p.condition)) {
      record.conditions.push({
        id: newId('cond'),
        code: p.condition,
        status: 'active',
        diagnosedOn: null,
        source: 'legacy_profile',
        addedAt: createdAt,
      });
      review.push('conditions');
    } else {
      // Keep the unknown code visible rather than dropping it.
      record.notes.push({
        id: newId('note'), at: createdAt, author: null, role: 'unknown',
        text: `Migrated from v1: unrecognised condition "${String(p.condition).slice(0, 40)}".`,
      });
      review.push('conditions');
    }
  }

  const g = p.goals && typeof p.goals === 'object' ? p.goals : null;
  if (g) {
    const targets = {};
    for (const code of ['kcal', 'protein', 'fiber']) {
      const v = g[code];
      // A missing or non-numeric goal stays null; it is never coerced to 0.
      targets[code] = { value: isFiniteNumber(v) && v >= 0 ? v : null, unit: TARGET_CODES[code] };
    }
    record.goals.push({
      id: newId('goal'),
      targets,
      setBy: 'unknown',
      basis: 'Snapshot of diary goals when the v1 profile was saved; may be app defaults.',
      setOn: createdAt,
      reviewOn: null,
    });
    review.push('goals');
  }

  if (typeof p.note === 'string' && p.note.trim()) {
    record.notes.push({ id: newId('note'), at: createdAt, author: null, role: 'unknown', text: p.note.trim().slice(0, 2000) });
  }

  record.app.favouriteFoodIds = uniqInts(p.favIds);
  record.app.plateFoodIds = uniqInts(p.plateIds);
  record.app.diaryKey = p.id;

  record.migration = { from: 1, legacyId: p.id, at: now, review };
  return record;
}

/**
 * Migrates a list of v1 profiles, merging with records that already exist.
 * Profiles already migrated (same legacyId) are skipped, so this is safe to re-run.
 *
 * @param {unknown[]} legacyProfiles parsed nf_profiles
 * @param {object[]} [existingRecords] parsed nf_patient_records
 * @returns {{ records: object[], migrated: string[], skipped: string[], failed: {id:any, reason:string}[] }}
 */
export function migrateProfiles(legacyProfiles, existingRecords = [], opts = {}) {
  const records = Array.isArray(existingRecords) ? existingRecords.slice() : [];
  const done = new Set(records.map((r) => r && r.migration && r.migration.legacyId).filter(Boolean));
  const migrated = [];
  const skipped = [];
  const failed = [];
  for (const p of Array.isArray(legacyProfiles) ? legacyProfiles : []) {
    if (!isLegacyProfile(p)) { failed.push({ id: p && p.id, reason: 'not a v1 profile' }); continue; }
    if (done.has(p.id)) { skipped.push(p.id); continue; }
    try {
      const rec = migrateProfileV1(p, opts);
      const v = validatePatientRecord(rec);
      if (!v.ok) { failed.push({ id: p.id, reason: v.errors.join('; ') }); continue; }
      records.push(rec);
      done.add(p.id);
      migrated.push(p.id);
    } catch (e) {
      failed.push({ id: p.id, reason: String(e && e.message || e) });
    }
  }
  return { records, migrated, skipped, failed };
}

/**
 * Reads nf_profiles and nf_patient_records from storage, migrates, and writes
 * nf_patient_records only. nf_profiles is never modified.
 *
 * @param {{ getItem:(k:string)=>string|null, setItem:(k:string,v:string)=>void }} storage
 */
export function migrateStorage(storage, opts = {}) {
  const read = (k) => {
    try {
      const raw = storage.getItem(k);
      const v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v : [];
    } catch {
      return null; // unreadable JSON: do not overwrite it
    }
  };
  const legacy = read(LEGACY_PROFILES_KEY);
  const existing = read(PATIENT_RECORDS_KEY);
  if (legacy === null) return { ok: false, error: `${LEGACY_PROFILES_KEY} is not valid JSON` };
  if (existing === null) return { ok: false, error: `${PATIENT_RECORDS_KEY} is not valid JSON; left untouched` };
  const result = migrateProfiles(legacy, existing, opts);
  if (result.migrated.length) {
    try {
      storage.setItem(PATIENT_RECORDS_KEY, JSON.stringify(result.records));
    } catch (e) {
      return { ok: false, error: `could not save: ${e && e.message || e}`, ...result };
    }
  }
  return { ok: true, ...result };
}
