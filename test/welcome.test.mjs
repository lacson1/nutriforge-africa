import {it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
function setup(){
 const feedback={textContent:''};
 const c={document:{getElementById:()=>feedback,addEventListener(){}},plateMap:{999:{name:'Existing'}},portionSizes:{999:75},saved:0,rendered:0,drawer:null};
 vm.createContext(c);
 vm.runInContext(fs.readFileSync(new URL('../js/foods-data.js',import.meta.url),'utf8'),c);
 c.foodsById=Object.fromEntries(c.foods.map(f=>[f.id,f]));
 c.savePersistence=()=>c.saved++;c.render=()=>c.rendered++;c.openDrawer=n=>c.drawer=n;
 vm.runInContext(fs.readFileSync(new URL('../js/welcome.js',import.meta.url),'utf8'),c);
 c.updateWelcome=()=>{};
 return {c,feedback};
}
it('uses actual catalogue foods and clamps interactive portions',()=>{
 const {c}=setup();
 expect(c.foodsById[c.welcomeParts[0].id].name).toBe('Brown rice (boiled, drained)');
 c.changeWelcomePortion(0,25);expect(c.welcomeParts[0].g).toBe(175);
 c.changeWelcomePortion(0,-1000);expect(c.welcomeParts[0].g).toBe(25);
 c.changeWelcomePortion(0,1000);expect(c.welcomeParts[0].g).toBe(300);
});
it('adds the edited example without replacing the existing plate',()=>{
 const {c}=setup();c.changeWelcomePortion(0,25);c.addWelcomePlate();
 expect(c.portionSizes[398]).toBe(175);expect(c.portionSizes[999]).toBe(75);expect(Object.keys(c.plateMap)).toHaveLength(4);
 expect(c.saved).toBe(1);expect(c.drawer).toBe('plate');
});
it('rejects oversized additions atomically rather than silently clipping portions',()=>{
 const {c,feedback}=setup();c.plateMap[398]=c.foodsById[398];c.portionSizes[398]=500;c.addWelcomePlate();
 expect(c.saved).toBe(0);expect(c.plateMap[37]).toBeUndefined();expect(c.portionSizes[398]).toBe(500);expect(feedback.textContent).toContain('600 g');
});
