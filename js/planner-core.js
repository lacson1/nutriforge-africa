function plannerDateKey(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function plannerWeek(dateKey){
  var parts=String(dateKey).split('-').map(Number),date=new Date(parts[0],parts[1]-1,parts[2],12);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)||!Number.isFinite(date.getTime())||plannerDateKey(date)!==dateKey)return [];
  date.setDate(date.getDate()-(date.getDay()+6)%7);
  return Array.from({length:7},function(_,i){var day=new Date(date);day.setDate(date.getDate()+i);return plannerDateKey(day);});
}
function plannerSnapshot(ids,portions,lookup,name){
  if(!Array.isArray(ids)||!ids.length)return null;
  var unique=Array.from(new Set(ids.map(String)));
  if(unique.some(function(id){var g=portions[id]===undefined?100:Number(portions[id]);return !lookup[id]||!Number.isFinite(g)||g<1||g>2000;}))return null;
  return {name:String(name||'My plate').slice(0,60),items:unique.map(function(id){return {id:Number(id),grams:portions[id]===undefined?100:Number(portions[id])};})};
}
function plannerPut(store,date,meal,snapshot){
  if(!plannerWeek(date).length||!['breakfast','lunch','dinner'].includes(meal)||!snapshot)return null;
  var next=JSON.parse(JSON.stringify(store||{}));if(!next[date])next[date]={};next[date][meal]=JSON.parse(JSON.stringify(snapshot));return next;
}
