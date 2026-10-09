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

// Keep prepared foods distinct: planned grams are not raw shopping weights.
function plannerShoppingList(store,anchor,lookup){
  var totals={};
  plannerWeek(anchor).forEach(function(date){['breakfast','lunch','dinner'].forEach(function(meal){
    var slot=(store[date]||{})[meal];if(!slot||!Array.isArray(slot.items))return;
    slot.items.forEach(function(item){var food=lookup[item.id],g=Number(item.grams);if(!food||!Number.isFinite(g)||g<=0)return;
      if(!totals[item.id])totals[item.id]={id:Number(item.id),name:food.name,grams:0,meals:0};
      totals[item.id].grams+=g;totals[item.id].meals++;
    });
  });});
  return Object.values(totals).map(function(item){item.grams=Math.round(item.grams*100)/100;return item;}).sort(function(a,b){return a.name.localeCompare(b.name);});
}
function plannerShoppingChecked(item,checks){return checks[item.id]===item.grams;}

function plannerIngredientShoppingList(store,anchor,lookup,recipes,family,rawMode){
 if(!Number.isInteger(family)||family<1||family>20)return [];
 var totals={};
 plannerShoppingList(store,anchor,lookup).forEach(function(item){var recipe=rawMode&&recipes[item.id],food=lookup[item.id];
 var parts=recipe?recipe.ingredients.filter(function(p){return p.key!=='12_019';}).map(function(p){return {id:'raw-'+p.key,name:p.name,grams:item.grams*family*p.grams/recipe.yieldGrams,kind:'Raw / recipe ingredient'};}):[{id:'food-'+item.id,name:item.name,grams:item.grams*family,kind:rawMode&&(/boiled|cooked|porridge|sauce|stew|soup|fufu/i.test(food.name)||/dish/i.test(food.catLabel||''))?'Prepared weight — recipe unavailable':'As listed / edible weight'}];
 parts.forEach(function(p){if(!totals[p.id])totals[p.id]={id:p.id,name:p.name,grams:0,kind:p.kind};totals[p.id].grams+=p.grams;});
 });return Object.values(totals).map(function(p){p.grams=Math.round(p.grams*10)/10;return p;}).sort(function(a,b){return a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name);});
}
