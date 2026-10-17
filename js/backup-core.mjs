/** Keys owned by NutriForge client state (localStorage). Keep in sync with index.html usage. */
export const NF_BACKUP_SCHEMA = 'nutriforge-backup';
export const NF_BACKUP_VERSION = 1;

export const NF_BACKUP_KEYS = [
  'nf_diary',
  'nf_diary_by_profile',
  'nf_diary_goals',
  'nf_profiles',
  'nf_active_profile',
  'nf_favourites',
  'nf_plate',
  'nf_saved_plates',
  'nf_meal_plates',
  'nf_today_focus',
  'nf_portions',
  'nf_chat',
  'nf_view',
  'nf_darkmode',
  'nf_community_start_done',
];

/**
 * @param {(key: string) => string | null} getItem
 * @returns {Record<string, string>}
 */
export function isBackupKey(key) {
  return NF_BACKUP_KEYS.includes(key) || /^nf_weekly_plan_[A-Za-z0-9_-]+$/.test(key) || /^nf_shopping_[A-Za-z0-9_-]+_\d{4}-\d{2}-\d{2}(?:_options)?$/.test(key);
}

export function collectBackupKeys(getItem, availableKeys = []) {
  const keys = {};
  for (const k of new Set([...NF_BACKUP_KEYS, ...availableKeys.filter(isBackupKey)])) {
    let v;
    try {
      v = getItem(k);
    } catch {
      v = null;
    }
    if (v != null && v !== '') keys[k] = v;
  }
  return keys;
}

/**
 * @param {(key: string) => string | null} getItem
 * @param {Record<string, unknown>} [meta]
 */
export function buildBackupDocument(getItem, meta = {}, availableKeys = []) {
  return {
    schema: NF_BACKUP_SCHEMA,
    version: NF_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'nutriforge-africa',
    keys: collectBackupKeys(getItem, availableKeys),
    ...meta,
  };
}

export function validateBackupDocument(doc) {
  if (!doc || typeof doc !== 'object') return false;
  if (doc.schema !== NF_BACKUP_SCHEMA) return false;
  if (typeof doc.keys !== 'object' || doc.keys === null || Array.isArray(doc.keys)) return false;
  return true;
}

/**
 * @param {Record<string, unknown>} keysPayload
 * @param {(key: string, value: string) => void} setItem
 * @param {(key: string) => void} removeItem
 * @param {{ mode?: 'replace' | 'merge' }} [opts]
 */
export function applyBackupKeys(keysPayload, setItem, removeItem, opts = {}) {
  const mode = opts.mode === 'merge' ? 'merge' : 'replace';
  if (mode === 'replace') {
    for (const k of new Set([...NF_BACKUP_KEYS, ...(opts.availableKeys || []).filter(isBackupKey)])) {
      try {
        removeItem(k);
      } catch {
        /* ignore */
      }
    }
  }
  for (const [k, val] of Object.entries(keysPayload)) {
    if (!isBackupKey(k)) continue;
    if (typeof val !== 'string') continue;
    try {
      setItem(k, val);
    } catch {
      /* ignore */
    }
  }
}
