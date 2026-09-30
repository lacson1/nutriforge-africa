import { CONDS, FREQS, KITCHENS, MEDS, MODE_LIST } from '../data';
import { canContinue, kitchenFoods, NEXT, PREV, STEPS, summary, type Action, type State } from '../state';
import { Summary } from './Summary';

interface Props { s: State; dispatch: (a: Action) => void }

export function Welcome({ dispatch }: Pick<Props, 'dispatch'>) {
  const go = (patch: Partial<State>) => dispatch({ type: 'patch', patch });
  return (
    <div className="welcome enter">
      <div className="welcome-brand">NutriForge</div>
      <div className="welcome-body">
        <h2>Food advice that knows your kitchen.</h2>
        <p className="welcome-lede">Jollof, fufu, waakye, rice and peas. Find out how the food you already cook fits with your health and your medicines.</p>
      </div>
      <div className="welcome-actions">
        <button className="btn-light" onClick={() => go({ screen: 'cond' })}>Get started</button>
        <button className="btn-ghost-light" onClick={() => dispatch({ type: 'demo' })}>I already have an account</button>
        <p className="welcome-note">This app does not replace advice from your GP, nurse or pharmacist.</p>
      </div>
    </div>
  );
}

export function Onboarding({ s, dispatch }: Props) {
  const go = (patch: Partial<State>) => dispatch({ type: 'patch', patch });
  const step = s.screen as (typeof STEPS)[number] | 'ready';
  const stepIdx = STEPS.indexOf(step as (typeof STEPS)[number]);
  const ok = canContinue(s);

  return (
    <div className="onb">
      <div className="onb-head">
        <div className="onb-nav">
          <button className="link-btn" onClick={() => go({ screen: PREV[step] })}>‹ Back</button>
          <span className="step-label">{stepIdx >= 0 ? `Step ${stepIdx + 1} of 4` : 'All set'}</span>
        </div>
        <div className="progress" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={stepIdx >= 0 ? stepIdx + 1 : 4}>
          {STEPS.map((_, i) => <span key={i} className={stepIdx < 0 || i <= stepIdx ? 'on' : ''} />)}
        </div>
      </div>

      <div className="onb-body">
        <div key={step} className="enter">
          {step === 'cond' && <CondStep s={s} go={go} />}
          {step === 'meds' && <MedsStep s={s} go={go} dispatch={dispatch} />}
          {step === 'kitchen' && <KitchenStep s={s} dispatch={dispatch} />}
          {step === 'sit' && <SitStep s={s} go={go} />}
          {step === 'ready' && <Ready s={s} />}
        </div>
      </div>

      <div className="onb-foot">
        <button className="btn-primary" disabled={!ok} onClick={() => ok && go({ screen: NEXT[step], tab: 'check', food: null })}>
          {step === 'ready' ? 'Start checking foods' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

type Go = (patch: Partial<State>) => void;

function CondStep({ s, go }: { s: State; go: Go }) {
  return (
    <div className="stack" role="radiogroup" aria-labelledby="q-cond">
      <h2 id="q-cond" className="q-title">What are you managing?</h2>
      <p className="q-lede">Pick the one your GP talks to you about most.</p>
      {CONDS.map(c => (
        <button key={c.id} role="radio" aria-checked={s.cond === c.id} disabled={c.disabled} className="opt radio pad14" onClick={() => go({ cond: c.id })}>
          <span className="opt-text"><strong>{c.label}</strong><span className="opt-sub">{c.sub}</span></span>
          <span className="dot" />
        </button>
      ))}
    </div>
  );
}

function MedsStep({ s, go, dispatch }: { s: State; go: Go; dispatch: Props['dispatch'] }) {
  return (
    <div className="stack">
      <h2 id="q-meds" className="q-title">Which medicines do you take?</h2>
      <p className="q-lede">We check each food against these. Tick all that apply.</p>
      <div className="stack" role="group" aria-labelledby="q-meds">
        {MEDS.map(m => {
          const on = s.meds.includes(m.id);
          return (
            <button key={m.id} role="checkbox" aria-checked={on} className="opt check" onClick={() => dispatch({ type: 'toggleMed', id: m.id })}>
              <span className="box" aria-hidden="true">{on ? '✓' : ''}</span>
              <span className="opt-text"><strong>{m.label}</strong><span className="opt-sub">{m.sub}</span></span>
            </button>
          );
        })}
      </div>
      {s.meds.includes('metformin') && (
        <div className="freq">
          <span id="q-freq" className="freq-q">How often do you take metformin?</span>
          <div className="freq-opts" role="radiogroup" aria-labelledby="q-freq">
            {FREQS.map(f => (
              <button key={f} role="radio" aria-checked={s.freq === f} className="seg" onClick={() => go({ freq: f })}>{f}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KitchenStep({ s, dispatch }: { s: State; dispatch: Props['dispatch'] }) {
  return (
    <div className="stack">
      <h2 className="q-title">What do you cook at home?</h2>
      <p className="q-lede" style={{ marginBottom: 12 }}>We'll show your foods first. Pick as many as you like.</p>
      <div className="chips">
        {KITCHENS.map(k => (
          <button key={k.id} aria-pressed={s.kitchen.includes(k.id)} className="chip" onClick={() => dispatch({ type: 'toggleKitchen', id: k.id })}>{k.label}</button>
        ))}
      </div>
      <p className="fine">Don't see yours? You can still search for any food we have.</p>
    </div>
  );
}

function SitStep({ s, go }: { s: State; go: Go }) {
  return (
    <div className="stack">
      <h2 id="q-sit" className="q-title">Right now, which fits you best?</h2>
      <p className="q-lede">You can change this any time. For example, if you get ill.</p>
      <div className="stack" role="radiogroup" aria-labelledby="q-sit">
        {MODE_LIST.map(m => (
          <button key={m} role="radio" aria-checked={s.mode === m} className="opt radio" onClick={() => go({ mode: m })}>
            <strong>{m}</strong>
            <span className="dot" />
          </button>
        ))}
      </div>
      <label htmlFor="nf-name" className="field-label">What should we call you? <span>(optional)</span></label>
      <input id="nf-name" className="field" autoComplete="given-name" value={s.name} onChange={e => go({ name: e.target.value })} />
    </div>
  );
}

function Ready({ s }: { s: State }) {
  const first = s.name.trim();
  return (
    <div className="ready">
      <h2>{first ? `You’re all set, ${first}.` : 'You’re all set.'}</h2>
      <p>Here's what we'll use. You can change it later in Me.</p>
      <Summary rows={summary(s)} />
      <div className="callout"><strong>{kitchenFoods(s).length} foods</strong> from your kitchen are ready to check.</div>
    </div>
  );
}
