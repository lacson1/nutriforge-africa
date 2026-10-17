import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {describe,it,expect} from 'vitest';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const close=html.slice(html.indexOf('function closeDrawer(restoreFocus)'),html.indexOf('function t2dmGuideNavigate'));
describe('drawer dismissal',()=>{
 it('removes overlay, restores previous scrolling and returns focus without touching saved data',()=>{
  const events=[];
  const drawer={contains:()=>true,inert:false,setAttribute:(k,v)=>events.push([k,v]),removeAttribute:k=>events.push(['remove',k]),open:true,classList:{remove:k=>{events.push(['drawer',k]);if(k==='open')drawer.open=false;},contains:k=>k==='open'&&drawer.open}};
  const backdrop={classList:{remove:k=>events.push(['backdrop',k])}};
  const c={activeDrawer:'planner',plannerCombinationDraft:{preview:true},drawerPreviousOverflow:'auto',drawerReturnFocus:{isConnected:true,focus:()=>events.push('focus')},updatePlateTray:()=>events.push('tray'),requestAnimationFrame:f=>f(),setTimeout:f=>f(),document:{body:{style:{overflow:'hidden'},classList:{remove:()=>{}}},activeElement:{blur:()=>events.push('blur')},getElementById:id=>id==='drawer'?drawer:backdrop,querySelectorAll:()=>[],querySelector:()=>null}};
  vm.runInNewContext(close,c);c.closeDrawer();
  expect(drawer.inert).toBe(true);expect(c.activeDrawer).toBe(null);expect(c.document.body.style.overflow).toBe('auto');expect(c.drawerPreviousOverflow).toBe(null);expect(events).toContainEqual(['backdrop','visible']);expect(events).toContain('focus');
  c.closeDrawer();expect(c.document.body.style.overflow).toBe('auto');
 });
 it('uses full-width dismissal for expanded panels and keeps close controls explicit',()=>{
  const css=readFileSync(new URL('../savourkin-theme.css',import.meta.url),'utf8');
  expect(css).toMatch(/\.drawer\{right:0;transform:translateX\(100%\);visibility:hidden;pointer-events:none/);
  expect(html).toContain('type="button" class="drawer-close" aria-label="Close panel"');
  expect(html).toContain("if(activeDrawer){closeDrawer();e.preventDefault();return;}");
 });
});
