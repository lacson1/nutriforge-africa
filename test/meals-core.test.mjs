import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mealsPath = join(__dirname, '../js/meals-core.js');

function loadMeals() {
  const code = readFileSync(mealsPath, 'utf8');
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.NFMealsCore;
}

describe('meals-core.js', () => {
  const foodsById = {
    1: { kcal: 100, protein: 10, carbs: 20, fat: 2, fiber: 3 },
    2: { kcal: 50, protein: 5, carbs: 5, fat: 1, fiber: 1 },
  };

  it('computeMealTotals scales by grams', () => {
    const M = loadMeals();
    const t = M.computeMealTotals([{ id: 1, g: 200 }], foodsById);
    expect(t.kcal).toBe(200);
    expect(t.protein).toBe(20);
    expect(t.carbs).toBe(40);
    expect(t.fat).toBe(4);
    expect(t.fiber).toBe(6);
  });

  it('aggregateDiaryEntries uses foodId and default 100g', () => {
    const M = loadMeals();
    const t = M.aggregateDiaryEntries([{ foodId: 2 }, { foodId: 1, grams: 50 }], foodsById);
    expect(t.kcal).toBe(100);
    expect(t.protein).toBe(10);
  });

  it('ignores unknown foods', () => {
    const M = loadMeals();
    const t = M.computeMealTotals([{ id: 99, g: 100 }], foodsById);
    expect(t.kcal).toBe(0);
  });
});
