import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const foodsPath = join(__dirname, '../js/foods-data.js');

describe('foods-data.js', () => {
  it('evaluates to an array of 402 foods with sequential ids', () => {
    const code = readFileSync(foodsPath, 'utf8');
    const ctx = { console };
    vm.createContext(ctx);
    vm.runInContext(code, ctx);
    expect(Array.isArray(ctx.foods)).toBe(true);
    expect(ctx.foods.length).toBe(402);
    expect(ctx.foods[0].id).toBe(1);
    expect(ctx.foods[401].id).toBe(402);
    expect(new Set(ctx.foods.map(f => f.id)).size).toBe(402);
    for (const f of ctx.foods.slice(390)) {
      expect(f.sourceCode).toMatch(/^\d{2}_\d{3}$/);
      expect(f.sourceUrl).toContain('fao.org');
      expect(f.evidence).toBe('Not rated');
      for(const k of ['kcal','protein','carbs','fat','fiber']) expect(Number.isFinite(f[k]) && f[k]>=0).toBe(true);
    }
    expect(ctx.foods.every((f) => f.name && typeof f.kcal === 'number')).toBe(true);
  });
});
