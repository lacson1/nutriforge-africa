export function Summary({ rows, tone }: { rows: { k: string; v: string }[]; tone?: 'cream' }) {
  return (
    <dl className={tone ? `kv ${tone}` : 'kv'}>
      {rows.map(r => (
        <div key={r.k} className="kv-row"><dt>{r.k}</dt><dd>{r.v}</dd></div>
      ))}
    </dl>
  );
}
