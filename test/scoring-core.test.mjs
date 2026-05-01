import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, '../js/scoring-core.js');

function loadScoring() {
  const code = readFileSync(path, 'utf8');
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx;
}

describe('scoring-core.js', () => {
  it('classifyDrug picks critical for cyanide mention', () => {
    const s = loadScoring();
    expect(s.classifyDrug('Raw forms contain cyanide risk')).toBe('critical');
  });

  it('classifyDrug picks moderate for warfarin', () => {
    const s = loadScoring();
    expect(s.classifyDrug('Vitamin K — warfarin interaction')).toBe('moderate');
  });

  it('classifyDrug picks mild for oxalate', () => {
    const s = loadScoring();
    expect(s.classifyDrug('High oxalate content')).toBe('mild');
  });

  it('confStars maps evidence tiers', () => {
    const s = loadScoring();
    expect(s.confStars('High')).toBe(5);
    expect(s.confStars('Moderate')).toBe(3);
    expect(s.confStars('Low')).toBe(1);
  });

  it('calcLongevity is monotonic with evidence and fibre', () => {
    const s = loadScoring();
    const low = { evidence: 'Low', fiber: 0, protein: 1, bio: '', benefits: '', gi: 'High', top3: false };
    const hi = { evidence: 'High', fiber: 10, protein: 20, bio: 'rct inflammation', benefits: 'cancer mortality', gi: 'Low', top3: true };
    expect(s.calcLongevity(hi)).toBeGreaterThan(s.calcLongevity(low));
    expect(s.calcLongevity(hi)).toBeLessThanOrEqual(100);
  });
});
