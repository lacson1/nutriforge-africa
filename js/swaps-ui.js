function buildSwapsDrawer(){
  return '<section class="swap-section"><p class="swap-eyebrow">SMALL CHANGES · MORE CHOICE</p><h2>Find your next swap.</h2><p class="swap-lead">Explore alternatives in the same food category and compare equal weights.</p>'+
    '<div class="swap-controls"><label>Find a food<input id="swapSearch" type="search" placeholder="Try rice, beans or fish" oninput="filterSwapSources(this.value)"></label>'+
    '<label>Food to swap<select id="swapSource" onchange="selectSwapSource()"></select></label><div class="swap-control-row"><label>Compare for<select id="swapGoal" onchange="renderSwapResults()"><option value="similar">Similar nutrition</option><option value="fiber">More fibre</option><option value="protein">More protein</option><option value="carbs">Fewer carbs</option><option value="kcal">Fewer calories</option></select></label><label>Portion (g)<input id="swapGrams" type="number" min="1" max="2000" step="1" value="100" oninput="renderSwapResults()"></label></div>'+
    '<label class="swap-check"><input id="swapAfrican" type="checkbox" onchange="renderSwapResults()"> African foods only</label></div>'+
    '<p class="swap-note">Values come from this app’s database. Check raw, dried and cooked descriptions: equal weights are not equivalent servings. Matches use category and labelled preparation, ordered by similarity. Recipes, allergens and suitability vary.</p>'+
    '<div id="swapStatus" role="status" aria-live="polite"></div><div id="swapResults"></div></section>';
}
function filterSwapSources(term){
  var select=document.getElementById('swapSource'), previous=select.value;
  var list=foods.filter(function(f){return (f.name+' '+(f.aka||'')).toLowerCase().includes((term||'').toLowerCase().trim());}).sort(function(a,b){return a.name.localeCompare(b.name);});
  select.innerHTML='<option value="">Choose a food…</option>'+list.map(function(f){return '<option value="'+f.id+'">'+safeHtml(f.name)+(plateMap[f.id]?' · On your plate':'')+'</option>';}).join('');
  if(list.some(function(f){return String(f.id)===previous;})) select.value=previous;
  renderSwapResults();
}
function selectSwapSource(){
  var id=document.getElementById('swapSource').value;
  document.getElementById('swapGrams').value=portionSizes[id]||100;
  document.getElementById('swapStatus').textContent='';
  renderSwapResults();
}
function initSwaps(){
  filterSwapSources('');
  var first=Object.keys(plateMap)[0];
  if(first){document.getElementById('swapSource').value=first;selectSwapSource();}
}
function renderSwapResults(){
  var results=document.getElementById('swapResults'); if(!results)return;
  var source=foodsById[document.getElementById('swapSource').value], grams=Number(document.getElementById('swapGrams').value);
  if(!source){results.innerHTML='<div class="swap-empty">Choose a food above to explore alternatives.</div>';return;}
  if(!Number.isFinite(grams)||grams<1||grams>2000){results.innerHTML='<p class="swap-empty">Enter a portion between 1 and 2,000 g.</p>';return;}
  var goal=document.getElementById('swapGoal').value;
  var candidates=findFoodSwaps(foods,source,goal,document.getElementById('swapAfrican').checked);
  function num(v){return (v*grams/100).toFixed(1).replace(/\.0$/,'');}
  results.innerHTML='<div class="swap-source-summary"><span>SWAPPING FROM</span><h3>'+safeHtml(source.emoji||'')+' '+safeHtml(source.name)+'</h3><p>'+grams+' g · '+num(source.kcal)+' kcal · '+num(source.protein)+' g protein · '+num(source.fiber)+' g fibre</p></div>'+
    '<p class="swap-results-label">'+candidates.length+' alternatives · compared at '+grams+' g each</p>'+
    (candidates.length?candidates.map(function(f){
      var metrics=[['kcal','Energy','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fiber','Fibre','g']];
      return '<article class="swap-card"><h3>'+safeHtml(f.emoji||'')+' '+safeHtml(f.name)+'</h3><p class="swap-category">'+safeHtml(f.catLabel||f.cat)+'</p><div class="swap-metrics">'+metrics.map(function(m){var delta=(f[m[0]]-source[m[0]])*grams/100;return '<div><span>'+m[1]+'</span><strong>'+num(f[m[0]])+' <small>'+m[2]+'</small></strong><span>'+(Math.abs(delta)<.05?'No change':(delta>0?'+':'−')+Math.abs(delta).toFixed(1)+' '+m[2])+'</span></div>';}).join('')+'</div><button class="ca-btn swap-action" type="button" '+(plateMap[f.id]?'disabled':'')+' onclick="useFoodSwap('+source.id+','+f.id+')">'+(plateMap[f.id]?'Already on your plate':plateMap[source.id]?'Replace on my plate':'Add to my plate')+'</button></article>';
    }).join(''):'<div class="swap-empty">No matching alternatives for this category and preparation. Try another comparison or turn off African foods only.</div>');
}
function useFoodSwap(sourceId,targetId){
  var source=foodsById[sourceId], target=foodsById[targetId];
  var next=applyFoodSwap(plateMap,portionSizes,source,target,Number(document.getElementById('swapGrams').value));if(!next)return;
  plateMap=next.plate;portionSizes=next.portions;savePersistence();render();
  document.getElementById('swapStatus').innerHTML='<p class="swap-success">'+safeHtml(next.replaced?source.name+' replaced with '+target.name+'.':target.name+' added to your plate.')+' <button type="button" class="ca-btn" onclick="openDrawer(\'plate\')">View plate →</button></p>';
  renderSwapResults();
}
