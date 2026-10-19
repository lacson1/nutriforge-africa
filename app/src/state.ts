import {
  BUCKETS, CONDS, FAST_STARCHES, FOOD_IDS, GLUCOSE_MEDS, KITCHENS, MEDS, TIERS, food,
  type CondId, type FoodId, type Freq, type KitchenId, type MedId, type Mode,
} from './data';

export type Step = 'cond' | 'meds' | 'kitchen' | 'sit';
export type Screen = 'welcome' | Step | 'ready' | 'app';
export type Tab = 'check' | 'saved' | 'meds' | 'me';

export interface State {
  screen: Screen;
  tab: Tab;
  food: FoodId | null;
  q: string;
  cond: CondId | null;
  meds: MedId[];
  freq: Freq;
  kitchen: KitchenId[];
  mode: Mode | null;
  name: string;
  saved: FoodId[];
}

export const STEPS: Step[] = ['cond', 'meds', 'kitchen', 'sit'];

export const INIT: State = { screen: 'welcome', tab: 'check', food: null, q: '', cond: null, meds: [], freq: 'Twice a day', kitchen: [], mode: null, name: '', saved: [] };
export const DEMO: Pick<State, 'cond' | 'meds' | 'freq' | 'kitchen' | 'mode' | 'name'> = { cond: 't2d', meds: ['metformin'], freq: 'Twice a day', kitchen: ['ng', 'gh'], mode: 'Stable', name: 'Adaeze' };

export const NEXT: Record<Step | 'ready', Screen> = { cond: 'meds', meds: 'kitchen', kitchen: 'sit', sit: 'ready', ready: 'app' };
export const PREV: Record<Step | 'ready', Screen> = { cond: 'welcome', meds: 'cond', kitchen: 'meds', sit: 'kitchen', ready: 'sit' };

export type Action =
  | { type: 'patch'; patch: Partial<State> }
  | { type: 'toggleMed'; id: MedId }
  | { type: 'toggleKitchen'; id: KitchenId }
  | { type: 'toggleSaved'; id: FoodId }
  | { type: 'demo'; patch?: Partial<State> }
  | { type: 'reset' };

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'patch':
      return { ...s, ...a.patch };
    case 'toggleMed': {
      let meds = toggle(s.meds, a.id);
      // "None of these" is exclusive of every real medicine.
      meds = a.id === 'none' ? (meds.includes('none') ? ['none'] : []) : meds.filter(x => x !== 'none');
      return { ...s, meds };
    }
    case 'toggleKitchen':
      return { ...s, kitchen: toggle(s.kitchen, a.id) };
    case 'toggleSaved':
      return { ...s, saved: toggle(s.saved, a.id) };
    case 'demo':
      // "I already have an account" and the prototype jump panel: fill in a sample patient.
      return { ...s, ...DEMO, screen: 'app', tab: 'check', food: null, ...a.patch };
    case 'reset':
      return INIT;
  }
}

export function canContinue(s: State): boolean {
  switch (s.screen) {
    case 'cond': return !!s.cond;
    case 'meds': return s.meds.length > 0;
    case 'kitchen': return s.kitchen.length > 0;
    case 'sit': return !!s.mode;
    case 'ready': return true;
    default: return false;
  }
}

export const onGlucoseMed = (s: Pick<State, 'meds'>) => s.meds.some(m => GLUCOSE_MEDS.includes(m));

const BUCKET_ORDER = { beneficial: 0, neutral: 1, caution: 2, avoid: 3 } as const;

/** Foods from the user's kitchens, best first. With no kitchen chosen, every food shows. */
export function kitchenFoods(s: Pick<State, 'kitchen'>): FoodId[] {
  const kitchens = s.kitchen.length ? s.kitchen : KITCHENS.map(k => k.id);
  return FOOD_IDS
    .filter(id => food(id).k.some(k => kitchens.includes(k)))
    .sort((a, b) => BUCKET_ORDER[food(a).b] - BUCKET_ORDER[food(b).b]);
}

export function search(q: string): FoodId[] {
  const needle = q.trim().toLowerCase();
  return needle ? FOOD_IDS.filter(id => food(id).name.toLowerCase().includes(needle)) : [];
}

export interface FoodRow { id: FoodId; name: string; portion: string; color: string; label: string; flag: string }

export function foodRow(s: Pick<State, 'meds'>, id: FoodId): FoodRow {
  const f = food(id);
  return { id, name: f.name, portion: f.portion, color: BUCKETS[f.b].c, label: BUCKETS[f.b].l, flag: f.alcohol && onGlucoseMed(s) ? ' · MEDICINE WARNING' : '' };
}

export function foodView(s: Pick<State, 'meds' | 'mode'>, id: FoodId) {
  const f = food(id);
  const onMetformin = s.meds.includes('metformin');
  const modeTip =
    s.mode === 'Fasting' && FAST_STARCHES.includes(id) ? 'Breaking a fast? Start with water and dates, then have a small starch portion and plenty of soup or stew.'
    : s.mode === 'Unwell' ? 'Feeling unwell? Small, easy meals and plenty of fluids matter more than the perfect food.'
    : '';
  return {
    ...f,
    id,
    color: BUCKETS[f.b].c,
    label: BUCKETS[f.b].l,
    dots: TIERS[f.t][0],
    tierColor: TIERS[f.t][1],
    tierLabel: `Evidence tier ${f.t} of 5`,
    interaction: f.alcohol && onGlucoseMed(s)
      ? onMetformin
        ? { title: 'Alcohol and metformin', text: 'Heavy drinking raises the risk of lactic acidosis, which is rare but serious. Ask your GP what is safe for you.' }
        : { title: 'Alcohol and hypos', text: 'Alcohol can cause a hypo, even hours later. Never drink on an empty stomach.' }
      : null,
    modeTip,
  };
}

export const realMeds = (s: Pick<State, 'meds'>) => s.meds.filter((m): m is Exclude<MedId, 'none'> => m !== 'none');

export function medLabel(s: Pick<State, 'freq'>, id: MedId): string {
  const label = MEDS.find(m => m.id === id)!.label;
  return id === 'metformin' ? `${label} (${s.freq.toLowerCase()})` : label;
}

export function summary(s: State): { k: string; v: string }[] {
  return [
    { k: 'Condition', v: CONDS.find(c => c.id === s.cond)?.label ?? 'Not set' },
    { k: 'Medicines', v: realMeds(s).map(m => medLabel(s, m)).join(', ') || 'None' },
    { k: 'Kitchen', v: s.kitchen.map(k => KITCHENS.find(x => x.id === k)!.label).join(', ') || 'Not set' },
    { k: 'Situation', v: s.mode ?? 'Not set' },
  ];
}

// Persistence: answers survive reloads and "Add to Home Screen" launches.
const KEY = 'nutriforge:v1';

export function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<State>;
    const s: State = { ...INIT, ...saved, q: '' };
    // Drop anything that no longer exists in the content set.
    s.saved = s.saved.filter(id => id in FOODS_SET);
    if (s.food && !(s.food in FOODS_SET)) s.food = null;
    return s;
  } catch {
    return null;
  }
}

export function persist(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, q: '' }));
  } catch {
    // Private mode or storage full: the app still works for this session.
  }
}

const FOODS_SET = Object.fromEntries(FOOD_IDS.map(id => [id, true]));
