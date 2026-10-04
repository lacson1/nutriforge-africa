import { useEffect, useReducer } from 'react';
import { AppShell } from './components/AppTabs';
import { Onboarding, Welcome } from './components/Onboarding';
import { DEMO, INIT, load, persist, reducer, type State } from './state';

export interface AppOptions {
  /** 'app' skips onboarding with a sample patient, like the design's startScreen prop. */
  start?: 'welcome' | 'app';
  showPlate?: boolean;
  /** Load and save answers in localStorage. */
  remember?: boolean;
}

export function optionsFromUrl(search: string): AppOptions {
  const p = new URLSearchParams(search);
  return { start: p.get('start') === 'app' ? 'app' : undefined, showPlate: p.get('plate') !== '0', remember: true };
}

function initialState({ start, remember }: AppOptions): State {
  if (start === 'app') return { ...INIT, ...DEMO, screen: 'app' };
  return (remember && load()) || INIT;
}

type Jump = [label: string, patch: Partial<State>];
const JUMPS: Jump[] = [
  ['Welcome', { screen: 'welcome' }],
  ['1 · Condition', { screen: 'cond' }],
  ['2 · Medicines', { screen: 'meds' }],
  ['3 · Kitchen', { screen: 'kitchen' }],
  ['4 · Situation', { screen: 'sit' }],
  ['All set', { screen: 'ready' }],
  ['Check a food', { screen: 'app', tab: 'check', food: null }],
  ['Food detail (palm wine)', { screen: 'app', tab: 'check', food: 'palmwine' }],
  ['Medicines tab', { screen: 'app', tab: 'meds', food: null }],
];

function currentJump(s: State) {
  if (s.screen !== 'app') return JUMPS.findIndex(j => j[1].screen === s.screen);
  if (s.tab === 'meds') return 8;
  if (s.food === 'palmwine') return 7;
  if (s.tab === 'check' && !s.food) return 6;
  return -1;
}

export default function App(opts: AppOptions) {
  const [s, dispatch] = useReducer(reducer, opts, initialState);
  const showPlate = opts.showPlate ?? true;

  useEffect(() => { if (opts.remember) persist(s); }, [s, opts.remember]);

  const isOnb = ['cond', 'meds', 'kitchen', 'sit', 'ready'].includes(s.screen);
  const barBg = s.screen === 'welcome' ? '#0b6e4f' : isOnb ? '#f9f6f1' : '#fff';
  const barFg = s.screen === 'welcome' ? '#fff' : '#1a1a1a';

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', barBg);
  }, [barBg]);

  const cur = currentJump(s);
  const jump = (patch: Partial<State>) =>
    dispatch(patch.screen === 'app' && !s.cond ? { type: 'demo', patch } : { type: 'patch', patch });

  return (
    <div className="stage">
      <aside className="panel" aria-label="Prototype navigation">
        <div className="panel-kicker">NutriForge · prototype</div>
        <h1>Onboarding, then "Can I eat this?"</h1>
        <p>Your answers shape everything that follows. The foods you see depend on your kitchen, warnings depend on your medicines, and banners depend on your situation.</p>
        <div className="jumps">
          {JUMPS.map(([label, patch], i) => (
            <button key={label} className="jump" aria-current={i === cur} onClick={() => jump(patch)}>
              <span>{label}</span><span className="jump-n">{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="phone">
        <div className="sbar" style={{ background: barBg, color: barFg }} aria-hidden="true">
          <span>9:41</span><span className="sbar-batt" />
        </div>
        {s.screen === 'welcome' && <Welcome dispatch={dispatch} />}
        {isOnb && <Onboarding s={s} dispatch={dispatch} />}
        {s.screen === 'app' && <AppShell s={s} dispatch={dispatch} showPlate={showPlate} />}
      </div>
    </div>
  );
}
