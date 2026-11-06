/**
 * Clinician review panel for migrated Patient Record 2.0 entries.
 * Mounted inside the Client profiles drawer (Professional tools).
 *
 * Opening the panel runs the additive migration (nf_profiles is never changed),
 * then lists records waiting for review. A named clinician decides each item and
 * completes the review in one step; nothing is saved if any decision is missing
 * or invalid.
 */
import { migrateStorage, pendingReviewItems } from './patient-record.mjs';
import {
  CONSENT_SCOPES,
  loadRecords,
  saveRecord,
  reviewAndComplete,
  undecidedKeys,
  discardMigratedRecord,
  reviewerError,
} from './record-review-core.mjs';

const REVIEWER_KEY = 'nf_reviewer_name'; // per-device convenience; not backed up

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function formatDate(iso) {
  if (!iso) return '';
  const d = String(iso).slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : String(iso);
}

function defaultConditionLabel(code) {
  const list = typeof window !== 'undefined' && Array.isArray(window.CONDITIONS) ? window.CONDITIONS : [];
  const c = list.find((x) => x.id === code);
  if (code === 'ckd') return 'Chronic kidney disease';
  return c ? c.pro : code;
}

const SCOPE_LABELS = {
  store_on_device: 'Store this record on this device',
  share_with_clinician: 'Share with their clinician',
};
const CONDITION_CHOICES = [
  ['active', 'Confirmed, active'],
  ['suspected', 'Suspected, not confirmed'],
  ['resolved', 'Resolved'],
  ['remove', 'Remove — this was only a browsing filter'],
];
const GOAL_CHOICES = [
  ['clinician', 'Set by a clinician'],
  ['patient', 'Chosen by the patient'],
  ['app_default', 'App default, not personalised'],
];
const CREATOR_CHOICES = [
  ['patient', 'The patient'],
  ['family', 'A family member or carer'],
  ['clinician', 'A clinician'],
];

function radios(name, choices, legend, hint = '') {
  return `<fieldset class="rr-item" data-key="${esc(name.key)}" data-field="${esc(name.field)}"><legend>${legend}</legend>${hint}` +
    choices.map(([v, l]) => `<label class="rr-choice"><input type="radio" name="${esc(name.field)}" value="${esc(v)}"> ${esc(l)}</label>`).join('') +
    `<p class="rr-field-error" id="${esc(name.field)}_err" hidden></p></fieldset>`;
}

function itemHtml(record, item, fid, conditionLabel) {
  const field = `${fid}_${item.key.replace(/[^A-Za-z0-9_-]/g, '_')}`;
  const n = { key: item.key, field };
  if (item.kind === 'consent') {
    return `<fieldset class="rr-item" data-key="${esc(item.key)}" data-field="${field}"><legend>Consent</legend>` +
      '<p class="rr-hint">Earlier snapshots never asked for consent. Record what the client agreed to.</p>' +
      `<label class="rr-choice"><input type="radio" name="${field}" value="given"> Consent given</label>` +
      `<div class="rr-sub">${CONSENT_SCOPES.map((s) => `<label class="rr-choice"><input type="checkbox" name="${field}_scope" value="${s}"> ${esc(SCOPE_LABELS[s])}</label>`).join('')}</div>` +
      `<label class="rr-choice"><input type="radio" name="${field}" value="withdrawn"> Consent not given</label>` +
      `<p class="rr-field-error" id="${field}_err" hidden></p></fieldset>`;
  }
  if (item.kind === 'created_by') {
    return radios(n, CREATOR_CHOICES, 'Who created this profile?');
  }
  if (item.kind === 'condition') {
    const c = record.conditions.find((x) => x.id === item.ref);
    const label = c ? conditionLabel(c.code) : 'Condition';
    return `<fieldset class="rr-item" data-key="${esc(item.key)}" data-field="${field}"><legend>Condition: ${esc(label)}</legend>` +
      '<p class="rr-hint">The earlier snapshot saved this from the condition filter. It is not a diagnosis until you confirm it.</p>' +
      CONDITION_CHOICES.map(([v, l]) => `<label class="rr-choice"><input type="radio" name="${field}" value="${v}"> ${esc(l)}</label>`).join('') +
      `<label class="rr-inline">Diagnosed on (optional) <input type="date" name="${field}_date"></label>` +
      `<p class="rr-field-error" id="${field}_err" hidden></p></fieldset>`;
  }
  if (item.kind === 'goal') {
    const g = record.goals.find((x) => x.id === item.ref);
    const t = (g && g.targets) || {};
    const num = (code, label, min, max) => `<label class="rr-inline">${label} <input type="number" inputmode="decimal" name="${field}_${code}" min="${min}" max="${max}" value="${t[code] && t[code].value != null ? esc(t[code].value) : ''}"></label>`;
    return `<fieldset class="rr-item" data-key="${esc(item.key)}" data-field="${field}"><legend>Daily targets</legend>` +
      '<p class="rr-hint">These targets were copied from the diary at the time. They may be the app’s defaults (2000 kcal, 120 g protein, 35 g fibre). Leave a box blank if it is not known.</p>' +
      `<div class="rr-goal-grid">${num('kcal', 'Energy (kcal)', 500, 6000)}${num('protein', 'Protein (g)', 0, 400)}${num('fiber', 'Fibre (g)', 0, 150)}</div>` +
      GOAL_CHOICES.map(([v, l]) => `<label class="rr-choice"><input type="radio" name="${field}" value="${v}"> ${esc(l)}</label>`).join('') +
      `<label class="rr-inline">Review targets on (optional) <input type="date" name="${field}_review"></label>` +
      `<p class="rr-field-error" id="${field}_err" hidden></p></fieldset>`;
  }
  if (item.kind === 'unmapped_condition') {
    const note = record.notes.find((x) => x.id === item.ref);
    return `<fieldset class="rr-item" data-key="${esc(item.key)}" data-field="${field}"><legend>Unrecognised condition</legend>` +
      `<p class="rr-hint">${esc(note ? note.text : '')} It is kept as a note.</p>` +
      `<label class="rr-choice"><input type="checkbox" name="${field}" value="acknowledged"> I have read this note</label>` +
      `<p class="rr-field-error" id="${field}_err" hidden></p></fieldset>`;
  }
  return '';
}

function readDecisions(form, record) {
  const decisions = {};
  for (const fs of form.querySelectorAll('.rr-item')) {
    const key = fs.dataset.key;
    const item = record.review.items.find((it) => it.key === key);
    if (!item) continue;
    const field = fs.dataset.field;
    const checked = fs.querySelector(`input[name="${field}"]:checked`);
    if (!checked) continue;
    const d = { decision: checked.value };
    if (item.kind === 'consent') {
      d.scope = [...fs.querySelectorAll(`input[name="${field}_scope"]:checked`)].map((x) => x.value);
    } else if (item.kind === 'condition') {
      d.diagnosedOn = fs.querySelector(`input[name="${field}_date"]`).value || null;
    } else if (item.kind === 'goal') {
      d.targets = {};
      for (const code of ['kcal', 'protein', 'fiber']) {
        const raw = fs.querySelector(`input[name="${field}_${code}"]`).value.trim();
        d.targets[code] = raw === '' ? null : Number(raw);
      }
      d.reviewOn = fs.querySelector(`input[name="${field}_review"]`).value || null;
    }
    decisions[key] = d;
  }
  return decisions;
}

function clearErrors(form) {
  form.querySelectorAll('.rr-field-error').forEach((p) => { p.hidden = true; p.textContent = ''; });
  form.querySelectorAll('.rr-item').forEach((fs) => { fs.removeAttribute('aria-invalid'); fs.classList.remove('rr-invalid'); });
  const g = form.querySelector('.rr-form-error');
  g.hidden = true;
  g.textContent = '';
}

function showErrors(form, errors) {
  let first = null;
  const general = [];
  for (const [key, msg] of Object.entries(errors)) {
    const fs = [...form.querySelectorAll('.rr-item')].find((x) => x.dataset.key === key) ||
      (key === 'consent' ? form.querySelector('.rr-item[data-key="consent"]') : null);
    if (fs) {
      const p = fs.querySelector('.rr-field-error');
      p.textContent = msg;
      p.hidden = false;
      fs.setAttribute('aria-invalid', 'true');
      fs.classList.add('rr-invalid');
      if (!first) first = fs.querySelector('input');
    } else {
      general.push(msg);
    }
  }
  const g = form.querySelector('.rr-form-error');
  const n = Object.keys(errors).length;
  g.textContent = (general.length ? general.join(' ') + ' ' : '') + (n - general.length > 0 ? `${n - general.length} item${n - general.length === 1 ? '' : 's'} need${n - general.length === 1 ? 's' : ''} attention.` : '');
  g.hidden = false;
  (first || g).focus();
}

/**
 * @param {HTMLElement} host
 * @param {{ storage?: Storage, conditionLabel?: (code:string)=>string, now?: () => string }} [opts]
 */
export function mount(host, opts = {}) {
  if (!host) return;
  const storage = opts.storage || window.localStorage;
  const conditionLabel = opts.conditionLabel || defaultConditionLabel;
  const now = opts.now || (() => new Date().toISOString());

  const mig = migrateStorage(storage, { now: now() });
  const records = loadRecords(storage);
  if (!mig.ok || !records) {
    host.innerHTML = `<div class="rr-panel"><p class="rr-form-error" role="alert">Records for review could not be read: ${esc(mig.error || 'unreadable data')}. Nothing was changed.</p></div>`;
    return;
  }
  const migrated = records.filter((r) => r && r.migration);
  const pending = migrated.filter((r) => r.review && r.review.status === 'pending');
  const done = migrated.filter((r) => r.review && r.review.status === 'complete');
  if (!migrated.length) { host.innerHTML = ''; return; }

  let reviewerName = '';
  try { reviewerName = storage.getItem(REVIEWER_KEY) || ''; } catch { /* ignore */ }

  host.innerHTML = '<section class="rr-panel" aria-labelledby="rrTitle">' +
    `<h3 id="rrTitle" class="rr-title">Records waiting for clinician review <span class="rr-count">${pending.length}</span></h3>` +
    '<p class="rr-hint">Saved snapshots are being moved to the new patient record. Each copy stays on hold until a clinician confirms it. The original snapshots below are not changed.</p>' +
    '<p class="rr-live sr-only" role="status" aria-live="polite"></p>' +
    (pending.length
      ? `<label class="rr-reviewer">Reviewing clinician <input type="text" id="rrReviewer" maxlength="80" autocomplete="name" value="${esc(reviewerName)}" placeholder="e.g. Dr A. Okafor, RD" aria-describedby="rrReviewerHelp rrReviewerErr"></label>` +
        '<p class="rr-hint" id="rrReviewerHelp">Recorded with every decision. There is no sign-in in this build, so this is the name you enter.</p>' +
        '<p class="rr-field-error" id="rrReviewerErr" hidden></p>'
      : '<p class="rr-hint">All migrated records have been reviewed.</p>') +
    pending.map((r, i) => {
      const fid = `rr${i}`;
      const items = pendingReviewItems(r);
      return `<form class="rr-card" data-id="${esc(r.id)}" novalidate aria-labelledby="${fid}_title">` +
        `<h4 class="rr-card-title" id="${fid}_title">${esc(r.identity.displayName || 'Unnamed profile')}</h4>` +
        `<p class="rr-hint">Snapshot saved ${esc(formatDate(r.createdAt))} · ${items.length} item${items.length === 1 ? '' : 's'} to confirm</p>` +
        items.map((it) => itemHtml(r, it, fid, conditionLabel)).join('') +
        '<p class="rr-form-error" role="alert" tabindex="-1" hidden></p>' +
        '<div class="rr-actions"><button type="submit" class="rr-primary">Confirm and complete review</button>' +
        '<button type="button" class="rr-secondary" data-discard>Discard migrated copy</button></div>' +
        '</form>';
    }).join('') +
    (done.length
      ? `<details class="rr-done"><summary>Reviewed (${done.length})</summary><ul>` +
        done.map((r) => `<li><strong>${esc(r.identity.displayName || 'Unnamed')}</strong> — reviewed by ${esc(r.review.completedBy.name)} on ${esc(formatDate(r.review.completedAt))}</li>`).join('') +
        '</ul></details>'
      : '') +
    '</section>';

  const live = host.querySelector('.rr-live');
  const reviewerInput = host.querySelector('#rrReviewer');
  const reviewerErr = host.querySelector('#rrReviewerErr');

  function getReviewer() {
    const reviewer = { name: reviewerInput ? reviewerInput.value : '', role: 'clinician' };
    const e = reviewerError(reviewer);
    reviewerErr.hidden = !e;
    reviewerErr.textContent = e || '';
    if (reviewerInput) reviewerInput.toggleAttribute('aria-invalid', !!e);
    if (e) { reviewerInput.focus(); return null; }
    try { storage.setItem(REVIEWER_KEY, reviewer.name.trim()); } catch { /* ignore */ }
    return reviewer;
  }

  function rerender(message) {
    mount(host, opts);
    const l = host.querySelector('.rr-live');
    if (l && message) l.textContent = message;
    const next = host.querySelector('.rr-card input') || host.querySelector('.rr-title');
    if (next) next.focus();
  }

  host.querySelectorAll('form.rr-card').forEach((form) => {
    const record = pending.find((r) => r.id === form.dataset.id);
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      clearErrors(form);
      const reviewer = getReviewer();
      if (!reviewer) return;
      const decisions = readDecisions(form, record);
      const missing = undecidedKeys(record, decisions);
      if (missing.length) {
        showErrors(form, Object.fromEntries(missing.map((k) => [k, 'Choose an option.'])));
        return;
      }
      const res = reviewAndComplete(record, decisions, reviewer, { now: now() });
      if (!res.ok) { showErrors(form, res.errors); return; }
      if (!saveRecord(storage, res.record)) { showErrors(form, { record: 'Could not save. Nothing was changed.' }); return; }
      rerender(`Review of ${record.identity.displayName || 'this profile'} completed.`);
    });
    form.querySelector('[data-discard]').addEventListener('click', () => {
      clearErrors(form);
      const reviewer = getReviewer();
      if (!reviewer) return;
      const name = record.identity.displayName || 'this profile';
      if (!window.confirm(`Discard the migrated copy of ${name}? The original snapshot stays in Client profiles and will not be migrated again.`)) return;
      const res = discardMigratedRecord(storage, record.id, reviewer, { now: now() });
      if (!res.ok) { showErrors(form, { record: res.error }); return; }
      rerender(`Migrated copy of ${name} discarded.`);
    });
  });
  if (live && opts.message) live.textContent = opts.message;
}
