/* Ingredient exploration with optional bounded motion; no independent nutrition dataset or storage schema. */
var SKPlateScale = {
 preview: function(parts,multiplier,lookup){
  var m=Number(multiplier);
  if(!Number.isFinite(m)||m<0.5||m>3)return {valid:false,message:'Choose a multiplier between 0.5 and 3.'};
  var scaled=parts.map(function(p){return {id:p.id,g:Math.round(p.g*m)};});
  if(!scaled.length||scaled.some(function(p){return !Number.isFinite(p.g)||p.g<25||p.g>600;}))return {valid:false,message:'Each food must stay between 25 g and 600 g. Adjust individual portions below.'};
  return {valid:true,parts:scaled,totals:NFMealsCore.computeMealTotals(scaled,lookup),grams:scaled.reduce(function(s,p){return s+p.g;},0)};
 }
};
var skScaleBase=[],skScaleDraft=null,skIngredientReturn=null;
var skIngredientPhotos={398:'rice',411:'cowpeas',429:'plantain',418:'greens'};
// Rounded contributions use largest remainders so displayed rows sum to the dish total.
SKPlateScale.contributions=function(parts,lookup){
 var total=NFMealsCore.computeMealTotals(parts,lookup),rows=parts.map(function(p){return {id:p.id,g:p.g,values:NFMealsCore.computeMealTotals([p],lookup)};});
 if(!total.incomplete)['kcal','protein','carbs','fat','fiber'].forEach(function(k){
  var precision=k==='kcal'?1:10,units=parts.map(function(p){return lookup[p.id][k]*p.g/100*precision;}),rounded=units.map(function(v){return Math.floor(v+1e-9);});
  var left=Math.round(total[k]*precision)-rounded.reduce(function(a,b){return a+b;},0);
  units.map(function(v,i){return {i:i,r:v-rounded[i]};}).sort(function(a,b){return b.r-a.r||a.i-b.i;}).slice(0,left).forEach(function(x){rounded[x.i]++;});
  rows.forEach(function(r,i){r.values[k]=rounded[i]/precision;});
 });
 return {totals:total,rows:rows,grams:parts.reduce(function(n,p){return n+p.g;},0)};
};
var skDishId='',skNutrient='fiber',skOrbitParts=[];
var skExampleDish={id:'welcome',name:'Rice, cowpeas, plantain & greens',parts:[{id:398,g:150},{id:411,g:100},{id:429,g:60},{id:418,g:75}]};
function skDishes(){return [skExampleDish].concat(typeof COMBINATION_MEALS==='undefined'?[]:COMBINATION_MEALS.filter(function(m){return !NFMealsCore.computeMealTotals(m.parts,foodsById).incomplete;}));}
function selectOrbitDish(id){skPauseMotion();skDishId=id;renderPlateExploration(Object.keys(plateMap));}
function renderPlateExploration(ids){
 var host=document.getElementById('orbitIngredients');if(!host)return;
 var dish=skDishes().find(function(d){return d.id===skDishId;});
 skScaleBase=dish?dish.parts.map(function(p){return {id:p.id,g:p.g};}):ids.map(function(id){return {id:Number(id),g:portionSizes[id]||100};});skScaleDraft=null;
 var select=document.getElementById('orbitDishSelect');
 select.innerHTML='<option value="">My current plate</option>'+skDishes().map(function(d){return '<option value="'+d.id+'">'+safeHtml(d.name)+'</option>';}).join('');select.value=skDishId;
 document.getElementById('orbitNutrient').value=skNutrient;
 var plan=document.querySelector('[onclick="planPlateJourney()"]');if(plan){plan.disabled=!!dish;plan.title=dish?'Add the dish to your plate before planning it':'';}
 var slider=document.getElementById('plateScale');slider.value=1;slider.disabled=!skScaleBase.length;
 document.getElementById('plateScaleValue').textContent='1×';document.getElementById('plateScaleApply').disabled=!dish;
 document.getElementById('plateScaleApply').textContent=dish?'Add this dish to my plate':'Apply portions to plate';
 document.getElementById('plateScalePreview').textContent=dish?'Exploring a suggested serving. Your current plate and saved meals are unchanged. Adding combines these portions with existing foods.':'Preview every portion together. Apply when ready; saved meals stay unchanged.';
 renderDishOrbit(skScaleBase);
}
function renderDishOrbit(parts){
 skOrbitParts=parts;var result=SKPlateScale.contributions(parts,foodsById),t=result.totals;
 var labels={fiber:'Fibre',protein:'Protein',carbs:'Carbohydrate',fat:'Fat',kcal:'Energy'},unit=skNutrient==='kcal'?'kcal':'g';
 var name=(skDishes().find(function(d){return d.id===skDishId;})||{}).name||'Your assembled plate';
 var photo=typeof SKDishImages!=='undefined'&&SKDishImages[skDishId];
 var visual=document.getElementById('plateVisual');visual.removeAttribute('role');visual.removeAttribute('aria-label');visual.style.background='none';
 var diagram='<div class="dish-weight-diagram" role="img" aria-label="Ingredient proportions by prepared weight" style="background:'+skWeightGradient(parts)+'"></div>';
 visual.innerHTML=diagram+(photo?'<img class="dish-photo dish-photo-loading" src="'+safeHtml(photo.src)+'" alt="'+safeHtml(photo.alt)+'" width="768" height="768" decoding="async" onload="dishImageLoaded(this)" onerror="dishImageFailed(this)">':'');
 document.querySelector('.plate-visual-caption').textContent=photo?'Loading dish illustration…':'Prepared-weight diagram · your custom plate';
 document.getElementById('orbitDishSummary').innerHTML='<h3>'+safeHtml(name)+'</h3><strong class="dish-weight">'+result.grams+' <span class="nutrient-unit">g</span></strong><p>Combined serving · '+(skDishId?'suggested portions':'current foods')+'</p>'+(parts.length?(t.incomplete?'<p>Nutrition incomplete — source or carbohydrate basis cannot be combined.</p>':'<dl class="dish-nutrients">'+[['Energy','kcal','kcal'],['Protein','protein','g'],['Fibre','fiber','g'],['Carbohydrate','carbs','g'],['Fat','fat','g']].map(function(a){return '<div><dt>'+a[0]+'</dt><dd>'+t[a[1]]+' <span class="nutrient-unit">'+a[2]+'</span></dd></div>';}).join('')+'</dl><small>Source-based estimates for the listed prepared weights.</small>'):'<p>Add foods or choose a dish above.</p>');
 document.getElementById('orbitIngredients').innerHTML=result.rows.map(function(r,i){var f=foodsById[r.id],v=r.values,photo=skIngredientPhotos[r.id];
  return '<button type="button" class="orbit-food" onclick="openPlateIngredient('+r.id+')" aria-label="View '+safeHtml(f.name)+' portion and source">'+(photo?'<img src="assets/'+photo+'-editorial.jpg" alt="Illustrative '+safeHtml(f.name)+'">':'<span class="ingredient-dot" aria-hidden="true" style="--food-color:'+plateColors[i%plateColors.length]+'"></span>')+'<span><strong>'+safeHtml(f.name)+'</strong><small>'+r.g+' g · named preparation</small>'+(v.incomplete?'<small>Nutrition incomplete</small>':'<b>'+v.kcal+' <span class="nutrient-unit">kcal</span></b><small>'+labels[skNutrient]+' '+v[skNutrient]+' '+unit+'</small>')+'<small>Portion, preparation &amp; source ↗</small></span></button>';
 }).join('');
 document.getElementById('orbitArithmetic').textContent=!parts.length?'':t.incomplete?'Individual estimates do not imply a complete dish total. Missing values are not zero.':result.rows.map(function(r){return r.values[skNutrient];}).join(' + ')+' = '+t[skNutrient]+' '+unit+' '+labels[skNutrient].toLowerCase()+'. Contributions are rounded together to reconcile with the dish total.';
 skInitMotion();
}
function dishImageLoaded(img){
 if(!img.isConnected)return;
 img.classList.remove('dish-photo-loading');var diagram=img.previousElementSibling;if(diagram)diagram.hidden=true;
 document.querySelector('.plate-visual-caption').textContent='AI-generated dish illustration · not a measured portion';
}
function dishImageFailed(img){
 if(!img.isConnected)return;
 img.remove();document.querySelector('.plate-visual-caption').textContent='Illustration unavailable · prepared-weight diagram';
}
function skWeightGradient(parts){var total=parts.reduce(function(n,p){return n+p.g;},0),angle=0;return total?'conic-gradient('+parts.map(function(p,i){var start=angle;angle+=p.g/total*360;return plateColors[i%plateColors.length]+' '+start+'deg '+angle+'deg';}).join(',')+')':'#504338';}
function previewPlateScale(value){
 skPauseMotion();
 skScaleDraft=SKPlateScale.preview(skScaleBase,value,foodsById);
 document.getElementById('plateScaleValue').textContent=Number(value)+'×';
 var out=document.getElementById('plateScalePreview'),apply=document.getElementById('plateScaleApply');
 apply.disabled=!skScaleDraft.valid||(!skDishId&&Number(value)===1);
 if(!skScaleDraft.valid){out.textContent=skScaleDraft.message+' Last valid preview remains shown.';return;}
 renderDishOrbit(skScaleDraft.parts);
 out.textContent='Preview: '+skScaleDraft.grams+' g. Ingredient amounts and dish totals update together. Your current plate and saved meals are unchanged.';
}
function applyPlateScale(){
 var draft=skScaleDraft||SKPlateScale.preview(skScaleBase,1,foodsById);if(!draft.valid)return;
 if(skDishId&&draft.parts.some(function(p){return p.g+(plateMap[p.id]?(portionSizes[p.id]||100):0)>600;})){document.getElementById('plateScalePreview').textContent='Adding this dish would take a food above 600 g. Reduce the serving or adjust your current plate first.';return;}
 draft.parts.forEach(function(p){portionSizes[p.id]=p.g+(skDishId&&plateMap[p.id]?(portionSizes[p.id]||100):0);plateMap[p.id]=foodsById[p.id];});skDishId='';savePersistence();render();updatePlatePanel();
 document.getElementById('plateScalePreview').textContent='Applied to your current plate. Use Plan this plate or Save a plate below to save it. Existing planned meals are unchanged.';
 document.getElementById('plateScale').focus();
}
function openPlateIngredient(id){
 skPauseMotion();
 var f=foodsById[id];if(!f)return;var g=(skOrbitParts.find(function(p){return p.id===id;})||{}).g||portionSizes[id]||100,t=NFMealsCore.computeMealTotals([{id:id,g:g}],foodsById);
 var contribution=SKPlateScale.contributions(skOrbitParts,foodsById).rows.find(function(p){return p.id===id;});if(contribution)t=contribution.values;
 var dialog=document.getElementById('plateIngredientDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='plateIngredientDialog';dialog.className='ingredient-dialog';dialog.setAttribute('aria-labelledby','ingredientTitle');document.body.appendChild(dialog);dialog.addEventListener('close',function(){if(skIngredientReturn&&skIngredientReturn.isConnected)skIngredientReturn.focus();});dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
 skIngredientReturn=document.activeElement;
 dialog.innerHTML='<button type="button" class="dialog-close" aria-label="Close ingredient" onclick="document.getElementById(\'plateIngredientDialog\').close()">×</button><h2 id="ingredientTitle">'+safeHtml(f.name)+'</h2><p>'+g+' g of the food in its named preparation. Values below describe this portion; rounding is reconciled with the complete dish when available.</p>'+(t.incomplete?'<p class="nutrition-review-notice">Nutrition incomplete. This saved food is retained, but its source and preparation have not been verified.</p>':'<dl>'+[['Energy','kcal','kcal'],['Protein','protein','g'],['Carbohydrate','carbs','g'],['Fat','fat','g'],['Fibre','fiber','g']].map(function(a){return '<div><dt>'+a[0]+'</dt><dd>'+t[a[1]]+' <span class="nutrient-unit">'+a[2]+'</span></dd></div>';}).join('')+'</dl>')+'<p>'+safeHtml(f.nutritionLabel||'Unverified nutrition')+'</p>'+(f.sourceNote?'<p>'+safeHtml(f.sourceNote)+'</p>':'')+(f.carbohydrateBasis?'<p><strong>Carbohydrate basis:</strong> '+safeHtml(f.carbohydrateBasis)+'</p>':'')+(f.sourceUrl&&/^https:\/\//.test(f.sourceUrl)?'<p><a href="'+safeHtml(f.sourceUrl)+'" target="_blank" rel="noopener">Open composition source · '+safeHtml(f.sourceCode)+'</a></p>':'<p><a href="nutrition-review.html">Read the evidence review</a></p>')+'<p>No medication or treatment advice is provided.</p>';
 var recipe=typeof SHOPPING_RECIPES!=='undefined'&&SHOPPING_RECIPES[id];
 if(recipe&&recipe.kind==='recipe')dialog.insertAdjacentHTML('beforeend','<details><summary>Documented raw recipe ingredients</summary><p>Source recipe scaled to '+g+' g cooked yield. Raw weights include water and do not sum to the cooked serving. Nutrient contributions within this recipe are unavailable; the dish composition estimate above is kept whole.</p><ul>'+recipe.ingredients.map(function(p){return '<li>'+safeHtml(p.name)+': '+Math.round(p.grams*g/recipe.yieldGrams*10)/10+' g raw</li>';}).join('')+'</ul><a href="'+safeHtml(SHOPPING_RECIPE_SOURCE)+'" target="_blank" rel="noopener">Recipe source '+safeHtml(recipe.sourceCode)+'</a></details>');
 else dialog.insertAdjacentHTML('beforeend','<p>Shown as one named prepared food. No additional ingredient or recipe breakdown is inferred.</p>');
 dialog.showModal();dialog.querySelector('button').focus();
}
// Contain keyboard focus in the existing drawer; native ingredient dialog owns its own focus.
if(typeof document!=='undefined')document.addEventListener('keydown',function(event){
 if(event.key!=='Tab')return;
 var modal=document.getElementById('plateIngredientDialog');if(modal&&modal.open)return;
 var drawer=document.getElementById('drawer');if(!drawer||!drawer.classList.contains('open'))return;
 var nodes=Array.from(drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')).filter(function(e){return e.getClientRects().length>0;});
 if(!nodes.length)return;var first=nodes[0],last=nodes[nodes.length-1];
 if(event.shiftKey&&(document.activeElement===first||!drawer.contains(document.activeElement))){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(document.activeElement===last||!drawer.contains(document.activeElement))){event.preventDefault();first.focus();}
});

// Optional bounded orbital motion. Nutrition, portions and saved data stay independent.
var SKOrbitMotion={enabled:false,hover:false,focus:false,
 policy:function(reduced,width,count){return !reduced&&width>=600&&count>0;},
 playing:function(allowed){return allowed&&this.enabled&&!this.hover&&!this.focus;}
};
function skPauseMotion(){SKOrbitMotion.enabled=false;skUpdateMotion();}
function skToggleMotion(){SKOrbitMotion.enabled=!SKOrbitMotion.enabled;skUpdateMotion();}
function skUpdateMotion(){
 var orbit=document.querySelector('.plate-orbit'),button=document.getElementById('orbitMotionToggle'),note=document.getElementById('orbitMotionStatus');if(!orbit||!button)return;
 var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var allowed=SKOrbitMotion.policy(reduced,orbit.clientWidth*16/(parseFloat(getComputedStyle(document.documentElement).fontSize)||16),orbit.querySelectorAll('.orbit-food').length);
 if(!allowed)SKOrbitMotion.enabled=false;
 var playing=SKOrbitMotion.playing(allowed);
 orbit.dataset.motion=playing?'playing':'paused';orbit.dataset.motionAllowed=String(allowed);
 button.disabled=!allowed;button.textContent=SKOrbitMotion.enabled?'Pause orbit':'Play orbit';button.setAttribute('aria-pressed',String(SKOrbitMotion.enabled));
 note.textContent=!allowed?(reduced?'Static view · reduced motion preference.':'Static on this small screen. Widen the window to play.'):(playing?'Orbit playing · hover an ingredient card to pause.':SKOrbitMotion.enabled?'Paused while you explore a card.':'Static view · play a gentle orbit when ready.');
}
function skInitMotion(){
 var orbit=document.querySelector('.plate-orbit');if(!orbit)return;
 if(!document.getElementById('orbitMotionToggle')){
  orbit.insertAdjacentHTML('beforebegin','<div class="orbit-motion-controls"><button type="button" class="ca-btn" id="orbitMotionToggle" aria-pressed="false" onclick="skToggleMotion()">Play orbit</button><p id="orbitMotionStatus" role="status" aria-live="polite"></p></div>');
 }
 if(!orbit.dataset.motionWired){
  orbit.dataset.motionWired='true';
  orbit.addEventListener('pointerover',function(e){SKOrbitMotion.hover=!!e.target.closest('.orbit-food');skUpdateMotion();});
  orbit.addEventListener('pointerout',function(e){SKOrbitMotion.hover=!!(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('.orbit-food'));skUpdateMotion();});
  orbit.addEventListener('focusin',function(){SKOrbitMotion.focus=true;skUpdateMotion();});
  orbit.addEventListener('focusout',function(){setTimeout(function(){SKOrbitMotion.focus=orbit.contains(document.activeElement);skUpdateMotion();},0);});
  orbit.addEventListener('pointerdown',skPauseMotion);
  if(typeof ResizeObserver!=='undefined'){var observer=new ResizeObserver(function(){if(!orbit.isConnected){observer.disconnect();return;}skUpdateMotion();});observer.observe(orbit);}
 }
 skUpdateMotion();
}
if(typeof window!=='undefined')window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',skUpdateMotion);
