import {it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
const c={};vm.createContext(c);
for(const name of ['foods-data','search-core','filter-core','swaps-core'])vm.runInContext(fs.readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'),c);
const source=JSON.parse(fs.readFileSync(new URL('./fixtures/wafct-expansion.json',import.meta.url),'utf8'));
it('matches added nutrient values to retained FAO source rows',()=>{
 const cols={kcal:'H',protein:'J',fat:'K',carbs:'L',fiber:'M'};
 expect(source).toHaveLength(28);
 for(const row of source){const f=c.foods.find(f=>f.id===row.id);expect(f.sourceCode).toBe(row.sourceCode);expect(f.aka).toContain(row.sourceName);for(const [key,col] of Object.entries(cols))expect(f[key]).toBeCloseTo(Number(row.raw[col].replace(/[\[\]]/g,'')),3);expect(f.gi).toBe('Unknown');expect(f.compositionOnly).toBe(true);}
 expect(new Set(c.foods.filter(f=>f.sourceCode).map(f=>f.sourceCode)).size).toBe(40);
});
it('keeps legacy IDs for saved meals but hides duplicate browse choices',()=>{
 const visible=c.queryFoods(c.foods,{scope:'all'},c.foodMatchesSearch,c.foodSearchRelevance);
 for(const id of [365,358,376,364,143,133]){const f=c.foods.find(f=>f.id===id);expect(f).toBeDefined();expect(visible.some(x=>x.id===id)).toBe(false);expect(c.queryFoods(c.foods,{scope:'favourites',favourites:{[id]:true}},c.foodMatchesSearch,c.foodSearchRelevance).map(x=>x.id)).toEqual([id]);}
 expect(new Set(visible.map(f=>f.name.toLowerCase())).size).toBe(visible.length);
});
it('finds familiar aliases and keeps cooked staples usable in swaps',()=>{
 expect(c.foodMatchesSearch(c.foods.find(f=>f.id===414),'ewedu')).toBe(true);
 expect(c.foodMatchesSearch(c.foods.find(f=>f.id===381),'attieke')).toBe(true);
 const rice=c.foods.find(f=>f.id===403);const swaps=c.findFoodSwaps(c.foods,rice,'fiber',false);
 expect(swaps.length).toBeGreaterThan(0);expect(swaps.every(f=>!f.duplicateOf)).toBe(true);
 const source=c.foods.find(f=>f.id===358);expect(c.findFoodSwaps(c.foods,source,'similar',false).some(f=>f.id===114)).toBe(false);
});
