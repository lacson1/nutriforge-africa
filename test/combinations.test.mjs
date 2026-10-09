import {it,expect} from 'vitest';
import fs from 'node:fs';import vm from 'node:vm';
const c={};vm.createContext(c);for(const f of ['foods-data','combinations','meals-core'])vm.runInContext(fs.readFileSync(new URL('../js/'+f+'.js',import.meta.url),'utf8'),c);
const lookup=Object.fromEntries(c.foods.map(f=>[f.id,f]));
it('uses existing foods and scales edible weights and totals',()=>{for(const m of c.COMBINATION_MEALS){expect(m.parts.every(p=>lookup[p.id]&&p.g>0)).toBe(true);const parts=c.comboMealParts(m,1.5);expect(parts[0].g).toBe(Math.round(m.parts[0].g*1.5));expect(c.NFMealsCore.computeMealTotals(parts,lookup).kcal).toBeGreaterThan(0);}expect(c.comboMealParts(c.COMBINATION_MEALS[0],-1)).toEqual([]);});
it('adds missing ingredients without overwriting or duplicating the current plate',()=>{const m=c.COMBINATION_MEALS[0],p=m.parts[0];const plate={[p.id]:lookup[p.id]},portions={[p.id]:275};const added=c.comboMealMerge(plate,portions,m.parts,lookup);expect(added.portions[p.id]).toBe(275);expect(added.added).toHaveLength(2);expect(Object.keys(plate)).toHaveLength(1);expect(c.comboMealMerge(added.plate,added.portions,m.parts,lookup).added).toHaveLength(0);});
it('rejects unknown foods and invalid weights',()=>{expect(c.comboMealMerge({}, {},[{id:99999,g:100},{id:398,g:Infinity},{id:398,g:2001}],lookup).added).toHaveLength(0);});
