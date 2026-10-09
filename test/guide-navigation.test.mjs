import {it,expect} from 'vitest';import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync(new URL('../t2dm-clinical-field-guide.html',import.meta.url),'utf8');
it('responds to parent hash navigation after mount and cleans up the listener',()=>{
 const state={},listeners={};let cleanup;
 const c={URLSearchParams,hydratedRef:{current:false},FOODS:[],window:{location:{hash:'#state=mgmt&view=principles'},addEventListener:(n,f)=>listeners[n]=f,removeEventListener:(n,f)=>{if(listeners[n]===f)delete listeners[n];}},useEffect:fn=>cleanup=fn(),setPatientState:v=>state.focus=v,setView:v=>state.view=v,setTheme:v=>state.theme=v,setMealItems:v=>state.meal=v};
 vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('const PATIENT_STATES ='),html.indexOf('const STATE_OVERRIDES =')),c);
 const start=html.indexOf('  useEffect(() => {',html.indexOf('// Read initial and parent-frame navigation;'));
 vm.runInContext(html.slice(start,html.indexOf('\n  useEffect(() => {',start+10)),c);
 expect(state).toMatchObject({focus:'management',view:'principles'});
 for(const [hash,focus,view] of [['#state=remission&view=principles','remission','principles'],['#state=ins&view=foods','insulin','foods'],['#state=all&view=principles','all','principles'],['','all','foods']]){c.window.location.hash=hash;listeners.hashchange();expect(state).toMatchObject({focus,view});}
 cleanup();expect(listeners.hashchange).toBeUndefined();
});
