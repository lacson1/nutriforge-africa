import { SEVERITY, type Severity } from '../data';

export function SevTag({ sev }: { sev: Severity }) {
  const c = SEVERITY[sev];
  return <span className="sev" aria-label={`Severity: ${sev.toLowerCase()}`} style={{ background: c.tagBg, color: c.tagFg }}>{sev}</span>;
}

export function AlertCard({ sev, title, text, raised, mutedText }: { sev: Severity; title: string; text: string; raised?: boolean; mutedText?: boolean }) {
  return (
    <div className={raised ? 'alert raised' : 'alert'} style={{ borderLeftColor: SEVERITY[sev].rule }}>
      <span className="alert-head"><SevTag sev={sev} /><strong>{title}</strong></span>
      <span className={mutedText ? 'muted' : undefined}>{text}</span>
    </div>
  );
}
