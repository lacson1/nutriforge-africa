/** Keys owned by NutriForge Africa client state (localStorage). Keep in sync with index.html usage. */
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
export function collectBackupKeys(getItem) {
  const keys = {};
  for (const k of NF_BACKUP_KEYS) {
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
export function buildBackupDocument(getItem, meta = {}) {
  return {
    schema: NF_BACKUP_SCHEMA,
    version: NF_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'nutriforge-africa',
    keys: collectBackupKeys(getItem),
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
    for (const k of NF_BACKUP_KEYS) {
      try {
        removeItem(k);
      } catch {
        /* ignore */
      }
    }
  }
  for (const [k, val] of Object.entries(keysPayload)) {
    if (!NF_BACKUP_KEYS.includes(k)) continue;
    if (typeof val !== 'string') continue;
    try {
      setItem(k, val);
    } catch {
      /* ignore */
    }
  }
}
