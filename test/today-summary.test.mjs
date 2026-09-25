import {it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function summary(total){
 const mount={innerHTML:'',contains:()=>false},note={value:''};
 const c={document:{activeElement:{},getElementById:id=>id==='todayDashboardBody'?mount:id==='todayFocusNote'?note:null},window:{},loadDiaryAndProfiles(){},todayISO:()=> '2026-09-25',loadRawTodayFocus:()=>null,getEffectiveTodayFocus:()=>null,todayFocusAllowedId:()=>true,diaryByDate:{'2026-09-25':[{}]},foodsById:{},NFMealsCore:{aggregateDiaryEntries:()=>total},diaryGoals:{kcal:1000,protein:120,fiber:35},plateMap:{},portionSizes:{},getMealPlatesMap:()=>({}),mealPlateSlotLabel:m=>m,diaryDate:'2026-09-25',buildTodayFocusPresets:()=>[],safeHtml:x=>String(x),browseContextSummaryHtml:()=> 'All foods'};
 vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function refreshTodayDashboard(){'),html.indexOf('function loadSavedPlates(){')),c);c.refreshTodayDashboard();return mount.innerHTML;
}
it('shows exceeded targets without overflowing the meter',()=>{
 const s=summary({kcal:1153,protein:19.6,fiber:16.1});
 expect(s).toContain('115% of target · 153 above target');expect(s).toContain('width:100%');expect(s).not.toContain('width:115%');expect(s).toContain('19.6');
});
it('keeps actions above optional focus and filter details',()=>{
 const s=summary({kcal:0,protein:0,fiber:0});
 expect(s.indexOf('Open today’s diary')).toBeLessThan(s.indexOf('todayFocusDetails'));
 expect(s).toContain('id="todayFocusDetails"><summary>');expect(s).toContain('0% of target');
});
it('keeps rerendered focus buttons from triggering outside-click dismissal',()=>{
 expect(html).toContain('event.stopPropagation();todayFocusPick(');
 expect(html).toContain('event.stopPropagation();commitTodayFocusSave()');
});
