import { ALERTS, MEDS, MODES, type FoodId } from '../data';
import { foodRow, foodView, kitchenFoods, realMeds, search, summary, type Action, type State, type Tab } from '../state';
import { AlertCard } from './AlertCard';
import { FoodRowButton } from './FoodRowButton';
import { Summary } from './Summary';

interface Props { s: State; dispatch: (a: Action) => void; showPlate: boolean }

const TABS: { id: Tab; label: string }[] = [
  { id: 'check', label: 'Check' },
  { id: 'saved', label: 'Saved' },
  { id: 'meds', label: 'Medicines' },
  { id: 'me', label: 'Me' },
];

export function AppShell({ s, dispatch, showPlate }: Props) {
  const go = (patch: Partial<State>) => dispatch({ type: 'patch', patch });
  const open = (id: FoodId) => go({ screen: 'app', tab: 'check', food: id, q: '' });
  const view = s.tab === 'check' ? (s.food ? `food:${s.food}` : 'check') : s.tab;

  return (
    <div className="app">
      <main className="app-scroll" id="app-main">
        <div key={view} className="enter">
          {s.tab === 'check' && !s.food && <CheckHome s={s} go={go} open={open} />}
          {s.tab === 'check' && s.food && <FoodDetail s={s} id={s.food} go={go} dispatch={dispatch} showPlate={showPlate} />}
          {s.tab === 'saved' && <Saved s={s} open={open} />}
          {s.tab === 'meds' && <Medicines s={s} />}
          {s.tab === 'me' && <Me s={s} go={go} dispatch={dispatch} />}
        </div>
      </main>
      <nav className="tabbar" role="tablist" aria-label="Sections">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={s.tab === t.id} aria-controls="app-main" className="tab" onClick={() => go({ tab: t.id, food: null, q: '' })}>
            <span className="tab-bar" />{t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

type Go = (patch: Partial<State>) => void;

function CheckHome({ s, go, open }: { s: State; go: Go; open: (id: FoodId) => void }) {
  const mode = s.mode ?? 'Stable';
  const note = MODES[mode];
  const q = s.q.trim();
  const results = search(s.q);
  return (
    <div className="page">
      <h2 className="page-title" style={{ margin: '0 0 14px', lineHeight: 1.15 }}>Can I eat this?</h2>
      {note.note && (
        <div className="mode-note" style={{ borderLeftColor: note.color }} role={mode === 'Unwell' ? 'alert' : undefined}>
          <strong>{mode}: </strong>{note.note}
        </div>
      )}
      <label htmlFor="nf-q" className="search-label">Type a food or drink</label>
      <div className="search">
        <input id="nf-q" type="search" enterKeyHint="search" autoComplete="off" value={s.q} placeholder="Jollof, waakye, malt…"
          aria-controls={q ? 'nf-sug' : undefined} aria-expanded={!!q}
          onChange={e => go({ q: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter' && results.length) open(results[0]); if (e.key === 'Escape') go({ q: '' }); }} />
        {q && (
          <div className="sug" id="nf-sug">
            {results.map(id => {
              const r = foodRow(s, id);
              return (
                <button key={id} className="sug-row" onClick={() => open(id)}>
                  <span>{r.name}</span><span className="sug-tag" style={{ color: r.color }}>{r.label}</span>
                </button>
              );
            })}
            {!results.length && <div className="sug-empty" role="status">We don't have that food yet. We've noted it.</div>}
          </div>
        )}
      </div>
      <h3 className="section-h">From your kitchen</h3>
      <div className="list">
        {kitchenFoods(s).map(id => <FoodRowButton key={id} row={foodRow(s, id)} sub="verdict" onOpen={() => open(id)} />)}
      </div>
    </div>
  );
}

function FoodDetail({ s, id, go, dispatch, showPlate }: { s: State; id: FoodId; go: Go; dispatch: Props['dispatch']; showPlate: boolean }) {
  const f = foodView(s, id);
  const saved = s.saved.includes(id);
  return (
    <article className="detail">
      <div className="detail-bar">
        <button className="link-btn" onClick={() => go({ food: null })}>‹ Check</button>
        <button className="save" aria-pressed={saved} onClick={() => dispatch({ type: 'toggleSaved', id })}>{saved ? 'Saved ✓' : 'Save'}</button>
      </div>
      <div className="verdict">
        <span className="verdict-dot" style={{ background: f.color }} />
        <span className="verdict-label" style={{ color: f.color }}>{f.label}</span>
      </div>
      <h2>{f.name}</h2>
      <p className="why">{f.why}</p>
      {f.interaction && <AlertCard raised sev="MAJOR" title={f.interaction.title} text={f.interaction.text} />}
      {f.modeTip && <div className="tip">{f.modeTip}</div>}
      <div className={showPlate ? 'plate-box' : 'plate-box no-plate'}>
        {showPlate && <div className="plate" role="img" aria-label="Plate: half vegetables, a quarter protein, a quarter starch" />}
        <div className="plate-text">
          <strong>How much</strong>
          <span>{f.portion}</span>
          <span className="plate-rule">Half vegetables · a quarter protein · a quarter starch</span>
        </div>
      </div>
      <div className="swap"><span>Try instead</span><strong>{f.swap}</strong></div>
      <div className="source">
        <span className="tier" aria-label={f.tierLabel} title={f.tierLabel} style={{ color: f.tierColor }}>{f.dots}</span>
        <span className="source-text">{f.src}</span>
      </div>
    </article>
  );
}

function Saved({ s, open }: { s: State; open: (id: FoodId) => void }) {
  return (
    <div className="page">
      <h2 className="page-title" style={{ margin: '0 0 6px' }}>Saved foods</h2>
      <p className="muted" style={{ margin: '0 0 14px', fontSize: 14 }}>Your go-to list for shopping and cooking.</p>
      {!s.saved.length && <div className="empty">Nothing saved yet. Open any food and tap <strong>Save</strong>.</div>}
      {s.saved.map(id => <FoodRowButton key={id} row={foodRow(s, id)} sub="portion" onOpen={() => open(id)} />)}
    </div>
  );
}

function Medicines({ s }: { s: State }) {
  const meds = realMeds(s);
  return (
    <div className="page stack" style={{ gap: 10 }}>
      <h2 className="page-title" style={{ margin: '0 0 4px' }}>Your medicines</h2>
      {!meds.length && <div className="empty">No medicines added. You can add them in Me.</div>}
      {meds.map(id => {
        const m = MEDS.find(x => x.id === id)!;
        return (
          <section key={id} className="med-card" aria-label={m.label}>
            <div className="med-head">
              <strong>{m.label}</strong>
              <span>{m.sub}{id === 'metformin' ? ` · ${s.freq.toLowerCase()}, with food` : ''}</span>
            </div>
            {(ALERTS[id] ?? []).map(a => <AlertCard key={a.title} mutedText {...a} />)}
          </section>
        );
      })}
    </div>
  );
}

function Me({ s, go, dispatch }: { s: State; go: Go; dispatch: Props['dispatch'] }) {
  return (
    <div className="page stack" style={{ gap: 12 }}>
      <h2 className="page-title">{s.name.trim() || 'Me'}</h2>
      <Summary rows={summary(s)} tone="cream" />
      <button className="btn-outline" onClick={() => go({ screen: 'cond' })}>Change my answers</button>
      <button className="btn-text" onClick={() => dispatch({ type: 'reset' })}>Restart prototype</button>
    </div>
  );
}
