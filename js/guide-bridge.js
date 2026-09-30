/* Same-origin meal handoff. Guide serving counts are never assumed to be grams. */
function validateGuideMeal(value) {
  if(!value || value.version!==1 || !Array.isArray(value.items) || !value.items.length || value.items.length>81)return null;
  if(!value.items.every(function(row){return row && typeof row.id==='string' && typeof row.name==='string' && row.name.length<=160 && Number.isFinite(row.servings) && row.servings>0 && row.servings<=100;}))return null;
  return value;
}
function mergeGuideMeal(plate,portions,rows,lookup){
  var nextPlate=Object.assign({},plate), nextPortions=Object.assign({},portions), totals={};
  if(!rows.length)return null;
  for(var row of rows){
    if(!lookup[row.id] || !Number.isFinite(row.grams) || row.grams<1 || row.grams>2000)return null;
    totals[row.id]=(totals[row.id]||0)+row.grams;
  }
  for(var id in totals){
    var total=(nextPlate[id]?(Number(nextPortions[id])||100):0)+totals[id];
    if(total>2000)return null;
    nextPlate[id]=lookup[id];nextPortions[id]=total;
  }
  return {plate:nextPlate,portions:nextPortions};
}
var pendingGuideMeal=null;
function readGuideMeal(){
  try{return validateGuideMeal(JSON.parse(sessionStorage.getItem('nf_guide_handoff')));}catch(e){return null;}
}
function buildGuideImportDrawer(){
  if(!pendingGuideMeal)return '<p>No guide meal is waiting to be imported.</p>';
  var aliases={ugu:21,ogbono:133};
  var options=foods.slice().sort(function(a,b){return a.name.localeCompare(b.name);});
  return '<section class="guide-import"><h2>Bring your meal into My Plate</h2><p>Match each food and enter the <strong>total grams for all its guide servings</strong>. Serving counts are a guide reference, not a weight conversion. Uncheck foods you do not want to add.</p><form onsubmit="event.preventDefault();confirmGuideImport()">'+pendingGuideMeal.items.map(function(row,i){
    var match=foods.find(function(f){return f.name.toLowerCase()===row.name.toLowerCase();});
    var selected=match?match.id:(aliases[row.id]||'');
    return '<fieldset class="swap-card"><legend>'+safeHtml(row.name)+'</legend><label class="guide-import-include"><input type="checkbox" data-guide-include="'+i+'" checked> Include · '+row.servings+' guide serving'+(row.servings===1?'':'s')+'</label><label>Main app food<select data-guide-food="'+i+'"><option value="">Choose the matching food…</option>'+options.map(function(f){return '<option value="'+f.id+'" '+(f.id===selected?'selected':'')+'>'+safeHtml(f.name)+'</option>';}).join('')+'</select></label><label>Total weight (g)<input data-guide-grams="'+i+'" type="number" min="1" max="2000" step="any" placeholder="Enter total grams"></label></fieldset>';
  }).join('')+'<p id="guideImportError" role="alert"></p><button class="ca-btn swap-action" type="submit">Add reviewed foods to My Plate</button></form><p class="swap-note">Existing plate foods stay. Matching foods have their weights added. Main app nutrition uses its own database and will differ from the guide’s illustrative estimates.</p></section>';
}
function confirmGuideImport(){
  var rows=pendingGuideMeal.items.map(function(row,i){
    if(!document.querySelector('[data-guide-include="'+i+'"]').checked)return null;
    return {id:document.querySelector('[data-guide-food="'+i+'"]').value,grams:Number(document.querySelector('[data-guide-grams="'+i+'"]').value)};
  }).filter(Boolean);
  var next=mergeGuideMeal(plateMap,portionSizes,rows,foodsById);
  if(!next){document.getElementById('guideImportError').textContent='Choose a matching food and enter 1–2,000 g for each included row. Include at least one food; combined weights cannot exceed 2,000 g per food.';return;}
  plateMap=next.plate;portionSizes=next.portions;savePersistence();
  try{sessionStorage.removeItem('nf_guide_handoff');}catch(e){}
  pendingGuideMeal=null;history.replaceState(null,'',location.pathname+location.search);render();openDrawer('plate');
}
function reviewGuideMeal(){
  pendingGuideMeal=readGuideMeal();
  if(pendingGuideMeal)openDrawer('guideImport');
}
