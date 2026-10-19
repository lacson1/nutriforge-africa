import { DEMO, INIT, canContinue, foodRow, foodView, kitchenFoods, reducer, search, summary, type State } from './state';

const st = (p: Partial<State> = {}): State => ({ ...INIT, ...p });

describe('reducer', () => {
  it('"None of these" clears real medicines, and a real medicine clears "none"', () => {
    let s = reducer(st({ meds: ['metformin', 'ramipril'] }), { type: 'toggleMed', id: 'none' });
    expect(s.meds).toEqual(['none']);
    s = reducer(s, { type: 'toggleMed', id: 'insulin' });
    expect(s.meds).toEqual(['insulin']);
    s = reducer(s, { type: 'toggleMed', id: 'insulin' });
    expect(s.meds).toEqual([]);
  });

  it('demo fills the sample patient and opens the app', () => {
    const s = reducer(INIT, { type: 'demo' });
    expect(s).toMatchObject({ ...DEMO, screen: 'app', tab: 'check', food: null });
  });
});

describe('canContinue', () => {
  it('needs an answer on every step', () => {
    expect(canContinue(st({ screen: 'cond' }))).toBe(false);
    expect(canContinue(st({ screen: 'cond', cond: 't2d' }))).toBe(true);
    expect(canContinue(st({ screen: 'meds' }))).toBe(false);
    expect(canContinue(st({ screen: 'kitchen', kitchen: ['car'] }))).toBe(true);
    expect(canContinue(st({ screen: 'sit' }))).toBe(false);
    expect(canContinue(st({ screen: 'ready' }))).toBe(true);
  });
});

describe('kitchenFoods', () => {
  it('shows only the chosen kitchens, best verdict first', () => {
    const ids = kitchenFoods(st({ kitchen: ['car'] }));
    expect(ids).toEqual(['ricepeas', 'ackee', 'harddough', 'malt', 'rum']);
  });
  it('shows everything when no kitchen is chosen', () => {
    expect(kitchenFoods(st())).toHaveLength(14);
  });
});

describe('search', () => {
  it('matches part of a name, ignoring case and spaces', () => {
    expect(search('  JOLL ')).toEqual(['jollof']);
    expect(search('')).toEqual([]);
    expect(search('pizza')).toEqual([]);
  });
});

describe('medicine warnings', () => {
  it('flags alcohol only for glucose-lowering medicines', () => {
    expect(foodRow(st({ meds: ['metformin'] }), 'palmwine').flag).toBe(' · MEDICINE WARNING');
    expect(foodRow(st({ meds: ['ramipril'] }), 'palmwine').flag).toBe('');
    expect(foodRow(st({ meds: ['metformin'] }), 'jollof').flag).toBe('');
  });
  it('uses the metformin wording for metformin, the hypo wording otherwise', () => {
    expect(foodView(st({ meds: ['metformin'] }), 'rum').interaction?.title).toBe('Alcohol and metformin');
    expect(foodView(st({ meds: ['gliclazide'] }), 'rum').interaction?.title).toBe('Alcohol and hypos');
    expect(foodView(st({ meds: ['simva'] }), 'rum').interaction).toBeNull();
  });
});

describe('situation tips', () => {
  it('adds the fasting tip to starches only', () => {
    expect(foodView(st({ mode: 'Fasting' }), 'jollof').modeTip).toMatch(/Breaking a fast/);
    expect(foodView(st({ mode: 'Fasting' }), 'okra').modeTip).toBe('');
  });
  it('adds the unwell tip to every food', () => {
    expect(foodView(st({ mode: 'Unwell' }), 'okra').modeTip).toMatch(/Feeling unwell/);
  });
});

describe('summary', () => {
  it('describes the answers', () => {
    expect(summary(st({ ...DEMO, meds: ['metformin', 'ramipril'], freq: 'Once a day' }))).toEqual([
      { k: 'Condition', v: 'Type 2 diabetes' },
      { k: 'Medicines', v: 'Metformin (once a day), Ramipril' },
      { k: 'Kitchen', v: 'Nigerian, Ghanaian' },
      { k: 'Situation', v: 'Stable' },
    ]);
    expect(summary(st({ meds: ['none'] }))[1].v).toBe('None');
  });
});
