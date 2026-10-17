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
  it('classifyDrug does not infer severity from cyanide mentions', () => {
    const s = loadScoring();
    expect(s.classifyDrug('Raw forms contain cyanide risk')).toBeNull();
  });

  it('classifyDrug does not infer severity from warfarin', () => {
    const s = loadScoring();
    expect(s.classifyDrug('Vitamin K — warfarin interaction')).toBeNull();
  });

  it('classifyDrug does not infer severity from oxalate', () => {
    const s = loadScoring();
    expect(s.classifyDrug('High oxalate content')).toBeNull();
  });

  it('confStars does not display unsupported evidence ratings', () => {
    const s = loadScoring();
    expect(s.confStars('High')).toBe(0);
    expect(s.confStars('Moderate')).toBe(0);
    expect(s.confStars('Low')).toBe(0);
  });

  it('does not infer longevity from keywords or nutrient amounts', () => {
    const s = loadScoring();
    const low = { evidence: 'Low', fiber: 0, protein: 1, bio: '', benefits: '', gi: 'High', top3: false };
    const hi = { evidence: 'High', fiber: 10, protein: 20, bio: 'rct inflammation', benefits: 'cancer mortality', gi: 'Low', top3: true };
    expect(s.calcLongevity(hi)).toBeNull();
    expect(s.calcLongevity(low)).toBeNull();
  });
});
