import type { FoodRow } from '../state';

/** A food in a list: colour bar, name, then either its verdict tag or its portion. */
export function FoodRowButton({ row, sub, onOpen }: { row: FoodRow; sub: 'verdict' | 'portion'; onOpen: () => void }) {
  return (
    <button className="food-row" onClick={onOpen}>
      <span className="food-row-bar" style={{ background: row.color }} />
      <span className="food-row-text">
        <strong>{row.name}</strong>
        {sub === 'verdict'
          ? <span className="food-row-tag" style={{ color: row.color }}>{row.label}{row.flag}</span>
          : <span className="food-row-sub">{row.portion}</span>}
      </span>
      <span className="chev" aria-hidden="true">›</span>
    </button>
  );
}
