// Clinical content is placeholder copy from the design prototype.
// Every verdict, portion, warning and source needs clinician sign-off before release.

export type Bucket = 'beneficial' | 'neutral' | 'caution' | 'avoid';
export type Tier = 1 | 2 | 3 | 4 | 5;
export type KitchenId = 'ng' | 'gh' | 'car';
export type CondId = 't2d' | 'pre' | 'bp' | 'chol';
export type MedId = 'metformin' | 'gliclazide' | 'insulin' | 'ramipril' | 'simva' | 'none';
export type Mode = 'Newly diagnosed' | 'Stable' | 'Fasting' | 'Pregnant' | 'Unwell';
export type Freq = 'Once a day' | 'Twice a day' | '3 times a day';
export type Severity = 'MAJOR' | 'MODERATE';

export const C = {
  green: '#0b6e4f',
  greenHover: '#095940',
  greenMid: '#5a8f7c',
  greenTint: '#e6f1ec',
  greenPale: '#cfe5db',
  ochre: '#b89150',
  cream: '#f9f6f1',
  sand: '#efebe4',
  line: '#d6cfc4',
  lineSoft: '#ebe5da',
  rule: '#eee',
  ink: '#1a1a1a',
  ink2: '#555',
  ink3: '#888',
  inkMuted: '#6b6b6b',
  red: '#b3261e',
} as const;

export const BUCKETS: Record<Bucket, { c: string; l: string }> = {
  beneficial: { c: '#0b6e4f', l: 'EAT OFTEN' },
  neutral: { c: '#6b7280', l: 'FINE IN PORTIONS' },
  caution: { c: '#8a6a2e', l: 'GO EASY' },
  avoid: { c: '#b3261e', l: 'BEST AVOIDED' },
};

export const TIERS: Record<Tier, [dots: string, color: string]> = {
  1: ['●●●●', '#0b6e4f'],
  2: ['●●●○', '#4d7f6d'],
  3: ['●●○○', '#8a6a2e'],
  4: ['●○○○', '#a85f40'],
  5: ['○○○○', '#777'],
};

export interface Food {
  name: string;
  k: KitchenId[];
  b: Bucket;
  why: string;
  portion: string;
  swap: string;
  t: Tier;
  src: string;
  alcohol?: boolean;
}

const GI = 'International GI tables, 2021';

export const FOODS = {
  moimoi: { name: 'Moi moi', k: ['ng'], b: 'beneficial', why: 'Made from beans, so it gives protein and fibre and raises blood sugar slowly. Steamed is better than fried.', portion: 'One or two wraps, as your protein', swap: 'Already a good choice', t: 1, src: 'NICE NG28 · legume meta-analyses' },
  okra: { name: 'Okra soup', k: ['ng', 'gh'], b: 'beneficial', why: 'The fibre in okra and leafy greens slows the rise in sugar. Add fish or meat as your protein.', portion: 'As much soup as you like. Go easy on the oil.', swap: 'Already a good choice', t: 3, src: 'NICE NG28' },
  kontomire: { name: 'Kontomire stew', k: ['gh'], b: 'beneficial', why: 'Cocoyam leaves are high in fibre and low in starch. Use less palm oil and add egg or fish.', portion: 'Half your plate', swap: 'Already a good choice', t: 3, src: 'NICE NG28' },
  jollof: { name: 'Jollof rice', k: ['ng', 'gh'], b: 'caution', why: 'White rice raises blood sugar quickly. The tomato stew and oil are fine. It is the size of the rice portion that matters most.', portion: 'One scoop the size of your fist, about 150 g cooked', swap: 'Half jollof, half fried cabbage or salad', t: 3, src: GI },
  waakye: { name: 'Waakye', k: ['gh'], b: 'neutral', why: 'The beans slow down the rice, so it raises sugar less than plain white rice. Watch the spaghetti and gari on the side.', portion: 'A fist-sized scoop, with no spaghetti', swap: 'Add salad and egg instead of gari', t: 3, src: GI },
  poundo: { name: 'Pounded yam', k: ['ng'], b: 'caution', why: 'A big swallow is a lot of fast starch at once. Make it smaller and add more soup and fish.', portion: 'A ball the size of a tennis ball', swap: 'A smaller swallow with extra okra or efo', t: 3, src: GI },
  banku: { name: 'Banku', k: ['gh'], b: 'caution', why: 'Fermented corn and cassava is still a dense starch. With okro soup and fish, a smaller ball is fine.', portion: 'A ball the size of a tennis ball', swap: 'A smaller ball with extra okro soup', t: 3, src: GI },
  dodo: { name: 'Dodo / kelewele', k: ['ng', 'gh'], b: 'caution', why: 'Ripe plantain is sweeter, and frying adds oil. Unripe, boiled or roasted plantain raises sugar less.', portion: '4–5 slices, as your starch', swap: 'Boiled or roasted unripe plantain', t: 3, src: GI },
  ricepeas: { name: 'Rice and peas', k: ['car'], b: 'neutral', why: 'The kidney beans help slow the rice down. Coconut milk adds fat, so keep the portion modest.', portion: 'A fist-sized scoop', swap: 'Half rice and peas, half steamed veg', t: 3, src: GI },
  ackee: { name: 'Ackee and saltfish', k: ['car'], b: 'neutral', why: 'Good protein and not much starch. Saltfish is very salty, so soak it well before cooking.', portion: 'A palm-sized portion', swap: 'Serve with callaloo, not fried dumplings', t: 3, src: 'NICE NG136 (salt)' },
  harddough: { name: 'Hard dough bread', k: ['car'], b: 'caution', why: 'Soft, sweetened white bread raises sugar quickly.', portion: 'One thin slice', swap: 'Wholemeal or rye bread', t: 2, src: GI },
  malt: { name: 'Malt drink', k: ['ng', 'gh', 'car'], b: 'avoid', why: 'A 330 ml bottle has about 9 teaspoons of sugar. Sugar in a drink raises blood sugar faster than sugar in food.', portion: 'Best kept for rare treats', swap: 'Sparkling water with lime, or zobo with no sugar', t: 1, src: 'NICE NG28 · product labels' },
  palmwine: { name: 'Palm wine', k: ['ng', 'gh'], b: 'avoid', why: 'It contains alcohol and sugar. Alcohol can cause low blood sugar and adds to the risks of metformin.', portion: 'If you drink, keep it small and have it with food', swap: 'Zobo or tiger nut drink with no added sugar', t: 2, src: 'BNF: metformin · MHRA', alcohol: true },
  rum: { name: 'Rum punch', k: ['car'], b: 'avoid', why: 'Alcohol plus sugary juice. It can push blood sugar up, then down.', portion: 'If you drink, keep it small and have it with food', swap: 'Sorrel with no added sugar', t: 2, src: 'BNF: metformin', alcohol: true },
} satisfies Record<string, Food>;

export type FoodId = keyof typeof FOODS;
export const FOOD_IDS = Object.keys(FOODS) as FoodId[];
export const food = (id: FoodId): Food => FOODS[id];

export const CONDS: { id: CondId; label: string; sub: string; disabled: boolean }[] = [
  { id: 't2d', label: 'Type 2 diabetes', sub: 'Full guidance available', disabled: false },
  { id: 'pre', label: 'Pre-diabetes', sub: 'Uses the diabetes guidance', disabled: false },
  { id: 'bp', label: 'High blood pressure', sub: 'Coming soon', disabled: true },
  { id: 'chol', label: 'High cholesterol', sub: 'Coming soon', disabled: true },
];

export const MEDS: { id: MedId; label: string; sub: string }[] = [
  { id: 'metformin', label: 'Metformin', sub: 'Diabetes' },
  { id: 'gliclazide', label: 'Gliclazide', sub: 'Diabetes' },
  { id: 'insulin', label: 'Insulin', sub: 'Diabetes' },
  { id: 'ramipril', label: 'Ramipril', sub: 'Blood pressure' },
  { id: 'simva', label: 'Simvastatin', sub: 'Cholesterol' },
  { id: 'none', label: 'None of these', sub: '' },
];

/** Medicines that make alcohol a hypo / lactic-acidosis risk. */
export const GLUCOSE_MEDS: MedId[] = ['metformin', 'gliclazide', 'insulin'];

export const FREQS: Freq[] = ['Once a day', 'Twice a day', '3 times a day'];

export const KITCHENS: { id: KitchenId; label: string }[] = [
  { id: 'ng', label: 'Nigerian' },
  { id: 'gh', label: 'Ghanaian' },
  { id: 'car', label: 'Caribbean' },
];

export const MODES: Record<Mode, { note: string; color: string }> = {
  'Newly diagnosed': { note: 'Start small: make one food swap a week.', color: '#0b6e4f' },
  Stable: { note: '', color: '#0b6e4f' },
  Fasting: { note: 'Talk to your GP before you fast. Your medicine times may need to change.', color: '#8a6a2e' },
  Pregnant: { note: 'Your targets change in pregnancy. Check with your midwife before making big changes.', color: '#8a6a2e' },
  Unwell: { note: "If you are being sick or can't keep fluids down, stop metformin and call 111 or your GP.", color: '#b3261e' },
};
export const MODE_LIST = Object.keys(MODES) as Mode[];

export const ALERTS: Partial<Record<MedId, { sev: Severity; title: string; text: string }[]>> = {
  metformin: [
    { sev: 'MODERATE', title: 'Vitamin B12', text: 'Taking it for a long time can lower your B12. Ask your GP for a yearly blood test.' },
    { sev: 'MAJOR', title: 'Alcohol', text: 'Heavy drinking with metformin raises the risk of lactic acidosis, which is rare but serious.' },
  ],
  gliclazide: [{ sev: 'MAJOR', title: "Don't skip meals", text: 'Gliclazide can cause low blood sugar (a hypo) if you miss a meal or drink alcohol.' }],
  insulin: [{ sev: 'MAJOR', title: 'Match food to doses', text: 'Missing meals or drinking alcohol can cause a hypo. Always carry glucose tablets or sweets.' }],
  ramipril: [{ sev: 'MODERATE', title: 'Salt substitutes', text: "Low-sodium salts like LoSalt are high in potassium. Don't use them unless your GP says so." }],
  simva: [{ sev: 'MAJOR', title: 'Grapefruit', text: 'Avoid grapefruit juice. It raises simvastatin levels and increases side effects.' }],
};

export const SEVERITY: Record<Severity, { tagBg: string; tagFg: string; rule: string }> = {
  MAJOR: { tagBg: '#b3261e', tagFg: '#fff', rule: '#b3261e' },
  MODERATE: { tagBg: '#f4ecdc', tagFg: '#7a5a22', rule: '#b89150' },
};

/** Starchy foods that get the "breaking a fast" tip. */
export const FAST_STARCHES: FoodId[] = ['jollof', 'waakye', 'poundo', 'banku'];
