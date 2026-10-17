/* Evidence review, 2026-10-17. Original records remain in foods-data.js and audit/food-inventory-original.json. */
var EVIDENCE_REVIEW_ACTIVE=true;
function applyEvidenceAudit(items){
 items.forEach(function(f){
  f.nutritionStatus=f.sourceCode?'source-matched':'unverified';
  f.nutritionLabel=f.sourceCode?(String(f.sourceCode).startsWith('USDA:')?'USDA reference':'FAO reference / estimate'):'Unverified nutrition';
  f.compositionOnly=true;
  f.evidence='Not rated';f.gi='Unknown';f.top3=false;
  f.micro='Not verified at nutrient level. No micronutrient quantity is asserted.';
  f.bio='Compound quantities and effects have not been verified.';
  f.benefits='Food-specific clinical claims and evidence grades are suspended pending source review. A composition table does not establish a treatment benefit.';
  f.use='Choose foods for your preferences and agreed care plan; this app does not assign therapeutic uses.';
  f.limits='Safety and drug interactions have not been assessed. Ask a pharmacist about medicines and follow authoritative food preparation guidance. Missing warnings do not mean a food is safe.';
 });
}
applyEvidenceAudit(foods);
function nutritionReviewNotice(){var seen=false;try{seen=localStorage.getItem('sk_review_notice_seen')==='1';localStorage.setItem('sk_review_notice_seen','1');}catch(e){}return '<details class="nutrition-review-notice drawer-review-notice"'+(seen?'':' open')+'><summary><strong>Nutrition estimates under review</strong><span class="review-notice-more" aria-hidden="true"> · Details</span></summary><p>Only source-matched foods are offered for new browsing. Existing saved meals may contain quarantined ingredients; incomplete totals are withheld. Raw/cooked weights and carbohydrate definitions can differ. No validated longevity score or medication advice is provided. <a href="nutrition-review.html">See evidence &amp; coverage</a>.</p></details>';}
function nutritionComplete(ids){var bases=new Set(ids.map(function(id){var f=typeof foodsById!=='undefined'?foodsById[id]:foods.find(function(x){return String(x.id)===String(id);});return f&&f.carbohydrateBasis;}).filter(Boolean));return bases.size<=1&&ids.every(function(id){var f=typeof foodsById!=='undefined'?foodsById[id]:foods.find(function(x){return String(x.id)===String(id);});return !!f&&f.nutritionStatus!=='unverified'&&['kcal','protein','carbs','fat','fiber'].every(function(k){return Number.isFinite(f[k]);});});}
function plannerNutritionText(items){return nutritionComplete(items.map(function(p){return p.id;}))?Math.round(items.reduce(function(t,p){return t+foodsById[p.id].kcal*p.grams/100;},0))+' kcal (estimate)':'Nutrition incomplete — retained foods await verification';}
