/** Patient-state URL aliases — shared by field guide and tests. */

export const PATIENT_STATE_ALIASES = {
  all: 'all',
  general: 'all',
  prev: 'prevention',
  prevention: 'prevention',
  mgmt: 'management',
  management: 'management',
  rem: 'remission',
  remission: 'remission',
  ins: 'insulin',
  insulin: 'insulin',
  su: 'insulin',
};

export const PATIENT_STATE_TO_SHORT = {
  all: 'all',
  prevention: 'prev',
  management: 'mgmt',
  remission: 'rem',
  insulin: 'ins',
};

export const PATIENT_STATE_IDS = new Set([
  'all',
  'prevention',
  'management',
  'remission',
  'insulin',
]);

/** @param {unknown} value */
export function normalizePatientState(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return 'all';
  if (PATIENT_STATE_ALIASES[key]) return PATIENT_STATE_ALIASES[key];
  return PATIENT_STATE_IDS.has(key) ? key : 'all';
}

/** @param {unknown} value */
export function encodePatientState(value) {
  const normalized = normalizePatientState(value);
  return PATIENT_STATE_TO_SHORT[normalized] || 'all';
}
