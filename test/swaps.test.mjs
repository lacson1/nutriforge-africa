import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../js/swaps-core.js',import.meta.url),'utf8'),c);
const a={id:1,name:'A',cat:'grain',kcal:120,carbs:25,protein:3,fat:1,fiber:1};
const b={...a,id:2,name:'B',fiber:4,protein:5,carbs:20,african:true};
const d={...a,id:3,name:'D',fiber:8,browseAsDish:true};
describe('food swaps',()=>{
 it('keeps category and dish type, excludes source, ranks improvements',()=>{
  expect(c.findFoodSwaps([a,b,d,{...b,id:4,cat:'fish'}],a,'fiber',false).map(f=>f.id)).toEqual([2]);
  expect(c.findFoodSwaps([a,b],a,'carbs',true).map(f=>f.id)).toEqual([2]);
  expect(c.findFoodSwaps([a,b],b,'fiber',false)).toEqual([]);
 });
 it('keeps cooked comparisons separate from dry or unspecified foods',()=>{
  const cooked={...a,name:'Rice (boiled)'};
  expect(c.findFoodSwaps([cooked,b,{...b,id:4,name:'Millet (cooked)'}],cooked,'fiber',false).map(f=>f.id)).toEqual([4]);
 });
 it('rejects missing nutrition instead of treating it as zero',()=>{
  expect(c.findFoodSwaps([a,{...b,carbs:null}],a,'carbs',false)).toEqual([]);
 });
 it('replaces one food at the chosen grams while preserving other foods and input state',()=>{
  const plate={1:a,3:d},portions={1:150,3:80};const out=c.applyFoodSwap(plate,portions,a,b,150);
  expect(Object.keys(out.plate)).toEqual(['2','3']);expect(out.portions[2]).toBe(150);expect(out.portions[3]).toBe(80);
  expect(out.replaced).toBe(true);expect(plate[1]).toBe(a);expect(portions[2]).toBeUndefined();
 });
 it('adds from browsing and rejects duplicate targets or invalid portions',()=>{
  expect(c.applyFoodSwap({}, {},a,b,75).replaced).toBe(false);
  expect(c.applyFoodSwap({2:b},{2:80},a,b,100)).toBeNull();
  for(const grams of [0,-1,NaN,Infinity,2001])expect(c.applyFoodSwap({}, {},a,b,grams)).toBeNull();
 });
});
