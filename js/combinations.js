/* Practical meal ideas use stable catalogue IDs and edible prepared weights. */
var COMBINATION_MEALS = [
 {id:'rice-beans',name:'Rice, beans & okra',tag:'Plant-based',note:'A familiar bowl with a grain, beans and vegetables.',parts:[{id:398,g:150},{id:411,g:150},{id:415,g:100}]},
 {id:'fonio-greens',name:'Fonio, cowpeas & greens',tag:'Plant-based',note:'Serve the cooked grains and beans with soft leafy greens.',parts:[{id:404,g:150},{id:413,g:150},{id:417,g:100}]},
 {id:'sweet-beans',name:'Sweet potato, beans & ewedu',tag:'Plant-based',note:'A simple combination of cooked sweet potato, cowpeas and jute leaves.',parts:[{id:409,g:180},{id:411,g:150},{id:414,g:100}]},
 {id:'rice-groundnut',name:'Rice & groundnut fish sauce',tag:'With fish',note:'A Burkina Faso sauce with fish and vegetables, served with rice. Contains fish and groundnuts.',parts:[{id:403,g:150},{id:425,g:180}]},
 {id:'cassava-okra',name:'Cassava & okra fish sauce',tag:'With fish',note:'Boiled cassava with a Burkina Faso okra and fish sauce. Contains fish.',parts:[{id:407,g:150},{id:426,g:200}]},
 {id:'yam-spinach',name:'Yam fufu & spinach fish sauce',tag:'With fish',note:'The source yam fufu includes palm oil; the spinach sauce includes fish and vegetables.',parts:[{id:428,g:150},{id:427,g:180}]},
 {id:'koko-fruit',name:'Hausa koko & banana',tag:'Plant-based',note:'Fermented millet porridge with ripe banana. Porridge sweetness depends on your recipe.',parts:[{id:419,g:250},{id:399,g:100}]},
 {id:'yogurt-papaya',name:'Yoghurt, papaya & peanuts',tag:'With dairy',note:'Plain Greek yoghurt with papaya and groundnuts. Contains milk and peanuts.',parts:[{id:74,g:170},{id:121,g:150},{id:107,g:20}]},
 {id:'gappal-orange',name:'Gappal & fresh orange',tag:'With dairy',note:'The source millet porridge includes milk and sugar. Serve with orange segments. Contains milk.',parts:[{id:430,g:200},{id:400,g:100}]},
 {id:'fonio-babenda',name:'Fonio & babenda greens',tag:'With meat stock',note:'Cooked fonio with a leafy-green, rice and groundnut dish. Contains groundnuts and beef stock in the source recipe.',parts:[{id:406,g:150},{id:424,g:200}]},
 {id:'cassava-cowpeas',name:'Cassava, cowpeas & greens',tag:'Plant-based',note:'Boiled cassava with black cowpeas and cooked sweet potato leaves.',parts:[{id:407,g:150},{id:412,g:150},{id:418,g:100}]},
 {id:'jollof-okra',name:'Jollof fonio & okra',tag:'With fish',note:'Jollof fonio already includes fish and vegetables; add boiled okra on the side. Contains fish.',parts:[{id:420,g:250},{id:415,g:100}]}
];
var comboMealQuery='',comboMealFilter='all',comboMealScales={},lastComboAddition=null;
function comboMealParts(meal,scale){
 if(!meal || [0.75,1,1.5].indexOf(Number(scale))<0)return [];
 return meal.parts.map(function(p){return {id:p.id,g:Math.round(p.g*Number(scale))};});
}
function comboMealMerge(plate,portions,parts,lookup){
 var nextPlate=Object.assign({},plate),nextPortions=Object.assign({},portions),added=[];
 parts.forEach(function(p){if(!nextPlate[p.id] && lookup[p.id] && Number.isFinite(p.g) && p.g>0 && p.g<=2000){nextPlate[p.id]=lookup[p.id];nextPortions[p.id]=p.g;added.push({id:p.id,g:p.g,previous:portions[p.id]});}});
 return {plate:nextPlate,portions:nextPortions,added:added};
}
function buildComboMealIdeas(){
 return '<section class="combo-meal-intro"><p class="swap-eyebrow">EVERYDAY MEAL IDEAS</p><h2>Put good food together.</h2><p>Choose a combination, adjust its size, then make it yours in My Plate.</p><label class="combo-meal-search">Find a meal<input type="search" class="combo-search" id="comboMealSearch" placeholder="Try rice, beans or ewedu" oninput="comboMealQuery=this.value;renderComboMeals()"></label><div class="combo-filters" aria-label="Meal type">'+[['all','All ideas'],['Plant-based','Plant-based'],['With fish','With fish'],['With dairy','With dairy'],['With meat stock','With meat stock']].map(function(x){return '<button type="button" class="combo-chip" data-meal-filter="'+x[0]+'" onclick="comboMealFilter=this.dataset.mealFilter;renderComboMeals()">'+x[1]+'</button>';}).join('')+'</div><p class="combo-meal-help">Illustrative portions, not a personal prescription. Nutrition is an estimate for the listed foods; recipe ingredients are included in sauces. Add any extras separately.</p><p id="comboMealStatus" role="status" aria-live="polite"></p><div class="combo-meal-tools"><button type="button" class="ca-btn" onclick="openDrawer(\'plate\')">Review my plate</button><button type="button" class="ca-btn" onclick="openComboWeekBuilder()">Build a full week</button><button type="button" class="ca-btn" id="comboMealUndo" hidden onclick="undoComboMeal()">Undo last addition</button></div><div id="comboMealCards"></div></section>';
}
function renderComboMeals(){
 var host=document.getElementById('comboMealCards');if(!host)return;
 var q=comboMealQuery.toLowerCase().trim();
 document.getElementById('comboMealSearch').value=comboMealQuery;
 document.querySelectorAll('[data-meal-filter]').forEach(function(b){var on=b.dataset.mealFilter===comboMealFilter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 var list=COMBINATION_MEALS.filter(function(m){return (comboMealFilter==='all'||m.tag===comboMealFilter)&&(!q||(m.name+' '+m.note+' '+m.parts.map(function(p){var f=foodsById[p.id];return f.name+' '+f.aka;}).join(' ')).toLowerCase().includes(q));});
 host.innerHTML=list.map(function(m){var scale=comboMealScales[m.id]||1,parts=comboMealParts(m,scale),t=computeMealTotals(parts),missing=parts.filter(function(p){return !plateMap[p.id];});
 return '<article class="combo-meal-card"><span class="combo-meal-tag">'+m.tag+'</span><h3>'+safeHtml(m.name)+'</h3><p>'+safeHtml(m.note)+'</p><label class="combo-meal-size" for="combo-size-'+m.id+'">Meal size<select id="combo-size-'+m.id+'" onchange="comboMealScales[\''+m.id+'\']=Number(this.value);renderComboMeals();document.getElementById(this.id).focus()">'+[[.75,'Smaller · ¾ portion'],[1,'Standard portion'],[1.5,'Larger · 1½ portions']].map(function(s){return '<option value="'+s[0]+'"'+(s[0]===scale?' selected':'')+'>'+s[1]+'</option>';}).join('')+'</select></label><ul>'+parts.map(function(p){var f=foodsById[p.id];return '<li><span>'+safeHtml(f.emoji+' '+f.name)+'</span><strong>'+p.g+' g</strong></li>';}).join('')+'</ul><p class="combo-meal-nutrition" aria-live="polite">'+t.kcal+' kcal · '+t.protein+' g protein · '+t.fiber+' g fibre</p><details><summary>All nutrients</summary><p>Carbs '+t.carbs+' g · Fat '+t.fat+' g. Totals cover this suggested combination.</p></details><button type="button" class="ca-btn combo-meal-add" '+(!missing.length?'disabled':'')+' onclick="addComboMeal(\''+m.id+'\')">'+(!missing.length?'Foods already on your plate':missing.length===parts.length?'Add combination to my plate':'Add '+missing.length+' missing food'+(missing.length===1?'':'s'))+'</button><button type="button" class="ca-btn combo-meal-plan" onclick="planComboMeal(\''+m.id+'\')">Plan this meal →</button><small>Existing plate foods and their portions stay unchanged.</small></article>';}).join('')||'<div class="combo-meal-card"><h3>No matching meal ideas</h3><p>Try another food or reset the filters.</p><button type="button" class="ca-btn" onclick="comboMealQuery=\'\';comboMealFilter=\'all\';renderComboMeals()">Show all ideas</button></div>';
}
function addComboMeal(id){
 var meal=COMBINATION_MEALS.find(function(m){return m.id===id;});if(!meal)return;
 var result=comboMealMerge(plateMap,portionSizes,comboMealParts(meal,comboMealScales[id]||1),foodsById);if(!result.added.length)return;
 plateMap=result.plate;portionSizes=result.portions;lastComboAddition=result.added;savePersistence();render();renderComboMeals();
 document.getElementById('comboMealStatus').textContent='Added '+result.added.length+' foods. Review your plate to adjust portions or choose swaps.';
 document.getElementById('comboMealUndo').hidden=false;document.getElementById('comboMealUndo').focus();
}
function undoComboMeal(){
 if(!lastComboAddition)return;
 if(lastComboAddition.some(function(p){return !plateMap[p.id]||portionSizes[p.id]!==p.g;})){document.getElementById('comboMealStatus').textContent='Your plate has changed. Review it to remove foods individually.';return;}
 lastComboAddition.forEach(function(p){delete plateMap[p.id];if(p.previous===undefined)delete portionSizes[p.id];else portionSizes[p.id]=p.previous;});lastComboAddition=null;savePersistence();render();renderComboMeals();document.getElementById('comboMealStatus').textContent='Addition undone.';document.getElementById('comboMealUndo').hidden=true;document.getElementById('comboMealSearch').focus();
}

function comboPlannerSnapshot(meal,scale,lookup){
 var parts=comboMealParts(meal,scale);if(!parts.length)return null;
 var portions={};parts.forEach(function(p){portions[p.id]=p.g;});
 return plannerSnapshot(parts.map(function(p){return p.id;}),portions,lookup,meal.name);
}
function planComboMeal(id){
 var meal=COMBINATION_MEALS.find(function(m){return m.id===id;});
 var snapshot=comboPlannerSnapshot(meal,comboMealScales[id]||1,foodsById);if(!snapshot)return;
 openDrawer('planner');
 plannerCombinationDraft={profile:activeProfileId||'personal',snapshot:snapshot};renderPlanner();
 document.getElementById('plannerStatus').textContent='Choose a day and meal slot, then save this combination. Your current plate stays unchanged.';
 document.getElementById('plannerDay').focus();
}
