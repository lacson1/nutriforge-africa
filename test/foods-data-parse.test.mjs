import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const foodsPath = join(__dirname, '../js/foods-data.js');

describe('foods-data.js', () => {
  it('evaluates to an array of 390 foods with sequential ids', () => {
    const code = readFileSync(foodsPath, 'utf8');
    const ctx = { console };
    vm.createContext(ctx);
    vm.runInContext(code, ctx);
    expect(Array.isArray(ctx.foods)).toBe(true);
    expect(ctx.foods.length).toBe(390);
    expect(ctx.foods[0].id).toBe(1);
    expect(ctx.foods[389].id).toBe(390);
    expect(ctx.foods.every((f) => f.name && typeof f.kcal === 'number')).toBe(true);
  });
});
