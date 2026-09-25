import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
const c={};vm.createContext(c);
vm.runInContext(fs.readFileSync(new URL('../js/filter-core.js',import.meta.url),'utf8'),c);
const items=[
{id:1,name:'Alpha',cat:'legume',african:true,nigeria:true,protein:10,gi:'Low',evidence:'High',drugSev:'none',regions:['West Africa'],conditions:['t2d']},
{id:2,name:'Beta',cat:'legume',african:false,protein:20,gi:'High',evidence:'Moderate',drugSev:'moderate',regions:[],conditions:['t2d']},
{id:3,name:'Gamma',cat:'grain',african:true,protein:5,gi:'Unknown',evidence:'Not rated',drugSev:'none',regions:['West Africa'],conditions:[]}
];
const query=s=>c.queryFoods(items,s,(f,q)=>f.name.toLowerCase().includes(q.toLowerCase()),()=>0).map(f=>f.id);
describe('combined food query',()=>{
 it('combines kitchen, category and search',()=>{expect(query({scope:'african',category:'legume'})).toEqual([1]);expect(query({scope:'african',category:'legume',term:'Beta'})).toEqual([])});
 it('applies evidence, region and drug filters',()=>{expect(query({evidence:'High',region:'West Africa'})).toEqual([1]);expect(query({drug:'moderate'})).toEqual([2]);expect(query({evidence:'Moderate'})).toEqual([1,2])});
 it('honours explicit sorting with conditions and searches',()=>{expect(query({condition:'t2d',sort:'protein',term:'a'})).toEqual([2,1]);expect(query({sort:'gi'})).toEqual([1,2,3]);expect(query({sort:'gi_desc'})).toEqual([2,1,3])});
 it('intersects saved items and category without mutating source',()=>{expect(query({scope:'favourites',favourites:{1:true,3:true},category:'grain'})).toEqual([3]);expect(items.map(f=>f.id)).toEqual([1,2,3])});
 it('uses the same query for render, export and AI context',()=>{const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');expect(html).toContain('var list=getVisibleFoods();');expect(html).toContain('var list = getVisibleFoods();');expect(html).toContain('var pool=getVisibleFoods();')});
});
