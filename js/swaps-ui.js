var lastFoodSwap=null;
function buildSwapsDrawer(){
  return '<section class="swap-section"><p class="swap-eyebrow">SMALL CHANGES · MORE CHOICE</p><h2>Find a food that fits.</h2><p class="swap-lead">Choose a food, pick what matters to you, then add an alternative to your plate.</p>'+
    '<div id="swapPlateChoices" class="swap-plate-choices"></div><div class="swap-controls"><label>Find a food<input id="swapSearch" type="search" placeholder="Try rice, beans or fish" oninput="filterSwapSources(this.value)"></label>'+
    '<p id="swapSearchCount" class="swap-note" role="status"></p><label>1. Your food<select id="swapSource" onchange="selectSwapSource()"></select></label><div class="swap-control-row"><label>2. What matters most?<select id="swapGoal" onchange="renderSwapResults()"><option value="similar">A similar alternative</option><option value="fiber">More fibre</option><option value="protein">More protein</option><option value="carbs">Fewer carbs</option><option value="kcal">Fewer calories</option></select></label><label>Compare this amount (g)<input id="swapGrams" type="number" min="1" max="2000" step="1" value="100" oninput="renderSwapResults()"></label></div>'+
    '<label class="swap-check"><input id="swapAfrican" type="checkbox" onchange="renderSwapResults()"> African foods only</label></div>'+
    '<details class="swap-method"><summary>How comparisons work</summary><p class="swap-note">Values come from this app’s database. Check raw, dried and cooked descriptions: equal weights are not equivalent servings. Matches use category and labelled preparation, ordered by similarity. Recipes, allergens and suitability vary.</p></details>'+
    '<div id="swapStatus" role="status" aria-live="polite"></div><div id="swapResults"></div></section>';
}
function filterSwapSources(term){
  var select=document.getElementById('swapSource'), previous=select.value;
  var list=foods.filter(function(f){return (!f.duplicateOf || plateMap[f.id]) && (f.name+' '+(f.aka||'')).toLowerCase().includes((term||'').toLowerCase().trim());}).sort(function(a,b){return a.name.localeCompare(b.name);});
  var retained=foodsById[previous];
  if(retained && !list.some(function(f){return f.id===retained.id;}))list.unshift(retained);
  document.getElementById('swapSearchCount').textContent=term?(list.filter(function(f){return (f.name+' '+(f.aka||'')).toLowerCase().includes(term.toLowerCase().trim());}).length+' matching foods — choose below.'):'';
  select.innerHTML='<option value="">Choose a food…</option>'+list.map(function(f){return '<option value="'+f.id+'">'+safeHtml(f.name)+(plateMap[f.id]?' · On your plate':'')+'</option>';}).join('');
  if(list.some(function(f){return String(f.id)===previous;})) select.value=previous;
  renderSwapResults();
}
function selectSwapSource(){
  var id=document.getElementById('swapSource').value;
  document.getElementById('swapGrams').value=portionSizes[id]||100;
  renderSwapResults();
}
function initSwaps(){
  lastFoodSwap=null;
  renderSwapPlateChoices();
  filterSwapSources('');
  var first=Object.keys(plateMap)[0];
  if(first){document.getElementById('swapSource').value=first;selectSwapSource();}
}
function renderSwapPlateChoices(){
  var wrap=document.getElementById('swapPlateChoices');if(!wrap)return;
  var ids=Object.keys(plateMap);
  wrap.innerHTML=ids.length?'<span>Start from your plate</span><div>'+ids.map(function(id){return '<button type="button" class="ca-btn" onclick="pickPlateSwap('+Number(id)+')">'+safeHtml(plateMap[id].emoji||'')+' '+safeHtml(plateMap[id].name)+'</button>';}).join('')+'</div>':'';
}
function pickPlateSwap(id){
  document.getElementById('swapSearch').value='';filterSwapSources('');
  document.getElementById('swapSource').value=id;selectSwapSource();
}
function renderSwapResults(){
  var results=document.getElementById('swapResults'); if(!results)return;
  var source=foodsById[document.getElementById('swapSource').value], grams=Number(document.getElementById('swapGrams').value);
  if(!source){results.innerHTML='<div class="swap-empty">Choose a food above to explore alternatives.</div>';return;}
  if(!Number.isFinite(grams)||grams<1||grams>2000){results.innerHTML='<p class="swap-empty">Enter a portion between 1 and 2,000 g.</p>';return;}
  var goal=document.getElementById('swapGoal').value;
  var candidates=findFoodSwaps(foods,source,goal,document.getElementById('swapAfrican').checked);
  function num(v){return (Math.round(v*grams/10+1e-9)/10).toFixed(1).replace(/\.0$/,'');}
  results.innerHTML='<div class="swap-source-summary"><span>SWAPPING FROM</span><h3>'+safeHtml(source.emoji||'')+' '+safeHtml(source.name)+'</h3><p>'+grams+' g · '+num(source.kcal)+' kcal · '+num(source.protein)+' g protein · '+num(source.fiber)+' g fibre</p></div>'+
    '<p class="swap-results-label">'+candidates.length+' alternative'+(candidates.length===1?'':'s')+' · '+grams+' g before and after'+(plateMap[source.id]?' · Current plate portion: '+(portionSizes[source.id]||100)+' g':'')+'</p>'+
    (candidates.length?candidates.map(function(f){
      var metrics=[['kcal','Energy','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g'],['fiber','Fibre','g']];
      var focusMetric=goal==='similar'?'kcal':goal;var focusLabel={fiber:'Fibre',protein:'Protein',carbs:'Carbs',kcal:'Energy'}[focusMetric];
      var quick='<div class="swap-quick"><span>'+focusLabel+(focusMetric==='kcal'?' (kcal)':' (g)')+'</span><strong>'+num(source[focusMetric])+' <span aria-hidden="true">→</span> '+num(f[focusMetric])+'</strong><small>Current → Alternative</small></div>';
      return '<article class="swap-card"><h3>'+safeHtml(f.emoji||'')+' '+safeHtml(f.name)+'</h3><p class="swap-reason">'+safeHtml(foodSwapReason(source,f,goal,grams))+'</p>'+quick+'<details class="swap-full-nutrients"><summary>Compare all nutrients</summary><table class="swap-comparison"><caption class="sr-only">'+safeHtml(source.name)+' compared with '+safeHtml(f.name)+' at '+grams+' grams</caption><thead><tr><th scope="col">Nutrient</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Change</th></tr></thead><tbody>'+metrics.map(function(m){var delta=Number(num(f[m[0]]))-Number(num(source[m[0]]));return '<tr'+(goal===m[0]?' class="swap-focus-metric"':'')+'><th scope="row">'+m[1]+' <small>'+m[2]+'</small></th><td>'+num(source[m[0]])+'</td><td>'+num(f[m[0]])+'</td><td>'+(Math.abs(delta)<.05?'—':(delta>0?'+':'−')+Math.abs(delta).toFixed(1))+'</td></tr>';}).join('')+'</tbody></table></details><button class="ca-btn swap-action" type="button" '+(plateMap[f.id]?'disabled':'')+' onclick="useFoodSwap('+source.id+','+f.id+')">'+(plateMap[f.id]?'Already on your plate':plateMap[source.id]?'Replace '+safeHtml(source.name):'Add to my plate')+'</button><p class="swap-action-note">'+(plateMap[f.id]?'Choose another alternative.':plateMap[source.id]?'Uses '+grams+' g of '+safeHtml(f.name)+'. You can undo this.':'Adds '+grams+' g. Your existing foods stay on your plate.')+'</p></article>';
    }).join(''):'<div class="swap-empty">No matching alternatives for this category and preparation. Try another comparison or turn off African foods only.<button type="button" class="ca-btn swap-action" onclick="resetSwapFilters()">Show all similar alternatives</button></div>');
}
function useFoodSwap(sourceId,targetId){
  var source=foodsById[sourceId], target=foodsById[targetId];
  var next=applyFoodSwap(plateMap,portionSizes,source,target,Number(document.getElementById('swapGrams').value));if(!next)return;
  lastFoodSwap={source:source,target:target,grams:next.portions[target.id],replaced:next.replaced,sourcePortion:portionSizes[source.id]||100,targetPortion:portionSizes[target.id]};
  plateMap=next.plate;portionSizes=next.portions;savePersistence();render();renderSwapPlateChoices();
  document.getElementById('swapStatus').innerHTML='<p class="swap-success">'+safeHtml(next.replaced?source.name+' replaced with '+target.name+'.':target.name+' added to your plate.')+' <button type="button" class="ca-btn" onclick="undoLastFoodSwap()">Undo</button> <button type="button" class="ca-btn" onclick="openDrawer(\'plate\')">View plate →</button></p>';
  renderSwapResults();
}

function resetSwapFilters(){document.getElementById('swapGoal').value='similar';document.getElementById('swapAfrican').checked=false;renderSwapResults();}
function undoLastFoodSwap(){
  var next=undoFoodSwap(plateMap,portionSizes,lastFoodSwap);
  if(!next){document.getElementById('swapStatus').textContent='This food has changed since the swap. Review it in My Plate.';return;}
  plateMap=next.plate;portionSizes=next.portions;lastFoodSwap=null;savePersistence();render();renderSwapPlateChoices();renderSwapResults();
  document.getElementById('swapStatus').textContent='Swap undone. Your previous portion is restored.';
}

function openCardSwap(id){
  if(!foodsById[id])return;
  openDrawer('swaps');
  pickPlateSwap(id);
  document.getElementById('swapSource').focus();
}
