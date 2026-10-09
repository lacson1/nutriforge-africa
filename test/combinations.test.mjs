import {it,expect} from 'vitest';
import fs from 'node:fs';import vm from 'node:vm';
const c={};vm.createContext(c);for(const f of ['foods-data','combinations','meals-core','planner-core'])vm.runInContext(fs.readFileSync(new URL('../js/'+f+'.js',import.meta.url),'utf8'),c);
const lookup=Object.fromEntries(c.foods.map(f=>[f.id,f]));
it('uses existing foods and scales edible weights and totals',()=>{for(const m of c.COMBINATION_MEALS){expect(m.parts.every(p=>lookup[p.id]&&p.g>0)).toBe(true);const parts=c.comboMealParts(m,1.5);expect(parts[0].g).toBe(Math.round(m.parts[0].g*1.5));expect(c.NFMealsCore.computeMealTotals(parts,lookup).kcal).toBeGreaterThan(0);}expect(c.comboMealParts(c.COMBINATION_MEALS[0],-1)).toEqual([]);});
it('adds missing ingredients without overwriting or duplicating the current plate',()=>{const m=c.COMBINATION_MEALS[0],p=m.parts[0];const plate={[p.id]:lookup[p.id]},portions={[p.id]:275};const added=c.comboMealMerge(plate,portions,m.parts,lookup);expect(added.portions[p.id]).toBe(275);expect(added.added).toHaveLength(2);expect(Object.keys(plate)).toHaveLength(1);expect(c.comboMealMerge(added.plate,added.portions,m.parts,lookup).added).toHaveLength(0);});
it('rejects unknown foods and invalid weights',()=>{expect(c.comboMealMerge({}, {},[{id:99999,g:100},{id:398,g:Infinity},{id:398,g:2001}],lookup).added).toHaveLength(0);});

it('creates independent planner snapshots with the selected portion size',()=>{
 expect(c.COMBINATION_MEALS).toHaveLength(12);
 const meal=c.COMBINATION_MEALS[0],snapshot=c.comboPlannerSnapshot(meal,.75,lookup);
 expect(snapshot.name).toBe(meal.name);expect(snapshot.items[0].grams).toBe(113);
 const next=c.plannerPut({},'2026-10-12','lunch',snapshot);snapshot.items[0].grams=999;
 expect(next['2026-10-12'].lunch.items[0].grams).toBe(113);expect(meal.parts[0].g).toBe(150);
 expect(c.comboPlannerSnapshot(meal,0,lookup)).toBeNull();expect(c.comboPlannerSnapshot(null,1,lookup)).toBeNull();
});
