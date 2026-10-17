import {it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const example=JSON.parse(read('assets/landing-nutrition.json'));
const c={};vm.runInNewContext(read('js/foods-data.js'),c);
it('uses traceable cooked food records and reconciles all serving totals',()=>{
 const keys=['kcal','protein','carbs','fat','fiber'];
 expect(example.rows.reduce((s,r)=>s+r.grams,0)).toBe(385);
 for(const r of example.rows){const f=c.foods.find(f=>f.id===r.id);expect(r.sourceCode).toBe(f.sourceCode);expect(r.sourceUrl).toBe(f.sourceUrl);for(const k of keys){expect(r.per100g[k]).toBe(f[k]);expect(r.values[k]).toBeCloseTo(f[k]*r.grams/100,8);}}
 for(const k of keys)expect(example.totals[k]).toBeCloseTo(example.rows.reduce((s,r)=>s+r.values[k],0),8);
 expect(example.totals.kcal).toBeCloseTo(593.75);expect(example.totals.protein).toBeCloseTo(18.01);
 const html=read('landing.html');expect(html).toContain('594');expect(html).toContain('18.0 g');expect(html).toContain('13.7 g');expect(html).toContain('Example serving • estimated nutrition');expect(html).toContain('no extra oil');
});
it('keeps app entry actions read-only for existing plate and planner data',()=>{
 const c={URLSearchParams,location:{search:'?start=plate'},document:{getElementById:()=>({}),addEventListener(){}},localStorage:{getItem:()=>null},setTimeout:fn=>fn(),initJourneyMeasurement(){},openDrawer:n=>c.opened=n};
 vm.runInNewContext(read('js/welcome.js'),c);c.updateWelcome=()=>{};c.initWelcome();expect(c.opened).toBe('plate');
 c.location.search='?start=food&id=999999';c.foodsById={};c.initWelcome();expect(c.opened).toBe('plate');
});
