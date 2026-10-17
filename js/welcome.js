/* Interactive welcome uses the same food records and persistence as My Plate. */
var welcomeParts = [{id:398,g:150},{id:411,g:100},{id:429,g:60},{id:418,g:75}];
function exploreWelcomeFoods(){
  closeDrawer();
  document.getElementById('foodBrowser').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  document.getElementById('srch').focus({preventScroll:true});
}
function toggleWelcome(){
  var body=document.getElementById('welcomeBody');
  body.hidden=!body.hidden;
  document.getElementById('welcomeToggle').textContent=body.hidden?'Show welcome':'Hide welcome';
  document.getElementById('welcomeToggle').setAttribute('aria-expanded',String(!body.hidden));
  try{localStorage.setItem('nf_welcome_collapsed',body.hidden?'1':'0')}catch(e){}
}
function initWelcome(){
  try{if(localStorage.getItem('nf_welcome_collapsed')==='1')toggleWelcome()}catch(e){}
  updateWelcome();
  initJourneyMeasurement();
  var entry=new URLSearchParams(location.search);
  if(entry.get('start')==='planner')setTimeout(previewPlannerWeek,0);
  if(entry.get('start')==='dish')setTimeout(function(){skDishId='welcome';openDrawer('plate');},0);
  if(entry.get('start')==='plate')setTimeout(function(){openDrawer('plate');},0);
  if(entry.get('start')==='food'){
    var food=foodsById[Number(entry.get('id'))];
    if(food)setTimeout(function(){clearAll();term=food.name.toLowerCase();document.getElementById('srch').value=food.name;render();var card=document.getElementById('c'+food.id);if(card){setCardExpanded(card,true);card.scrollIntoView({block:'start',behavior:'auto'});var button=card.querySelector('[data-card-toggle]');if(button)button.focus({preventScroll:true});}else{document.getElementById('foodBrowser').scrollIntoView({block:'start',behavior:'auto'});document.getElementById('srch').focus({preventScroll:true});}},0);
  }
}
function changeWelcomePortion(index,delta){
  var part=welcomeParts[index];if(!part)return;
  part.g=Math.max(25,Math.min(300,part.g+delta));
  updateWelcome();
}
function addWelcomePlate(){
  var over=welcomeParts.some(function(p){return (plateMap[p.id]?(portionSizes[p.id]||100):0)+p.g>600;});
  if(over){document.getElementById('welcomeFeedback').textContent='A food would exceed 600 g. Reduce its example portion or adjust it in My Plate first.';return;}
  document.getElementById('welcomeFeedback').textContent='';
  welcomeParts.forEach(function(part){
    var previous=plateMap[part.id]?(portionSizes[part.id]||100):0;
    plateMap[part.id]=foodsById[part.id];
    portionSizes[part.id]=Math.min(600,previous+part.g);
  });
  savePersistence();render();openDrawer('plate');
}
function updateWelcome(){
  var visual=document.getElementById('welcomePlateVisual');if(!visual)return;
  var ids=Object.keys(plateMap),count=ids.length;
  document.getElementById('welcomeStatus').textContent=count?'Your plate has '+count+' food'+(count===1?'':'s')+'. Pick up where you left off.':'Your week starts with familiar food.';
  document.getElementById('welcomePlateAction').innerHTML=(count?'Continue my plate':'Build my plate')+' <span aria-hidden="true">→</span>';
  var colors=['#cdbb83','#a78858','#d59b42','#63875e'];
  var names=['Brown rice','Cowpeas','Plantain','Sweet potato leaves'];
  var total=welcomeParts.reduce(function(n,p){return n+p.g},0),angle=0;
  visual.style.background='conic-gradient('+welcomeParts.map(function(p,i){var start=angle;angle+=p.g/total*360;return colors[i]+' '+start+'deg '+angle+'deg'}).join(',')+')';
  visual.setAttribute('aria-label','Example plate by weight: '+welcomeParts.map(function(p,i){return names[i]+' '+p.g+' grams'}).join(', '));
  visual.innerHTML='<div><strong>'+total+'<small> g</small></strong><span>total weight</span></div>';
  var rows=document.getElementById('welcomeIngredients');
  // Keep controls mounted when portions change so keyboard focus is preserved.
  if(!rows.children.length) rows.innerHTML=welcomeParts.map(function(p,i){return '<div class="welcome-ingredient"><strong><i style="background:'+colors[i]+'" aria-hidden="true"></i>'+names[i]+'</strong><div><button type="button" aria-label="Reduce '+names[i]+' portion" onclick="changeWelcomePortion('+i+',-25)">−</button><output id="welcomeGrams'+i+'"></output><button type="button" aria-label="Increase '+names[i]+' portion" onclick="changeWelcomePortion('+i+',25)">+</button></div></div>'}).join('');
  welcomeParts.forEach(function(p,i){document.getElementById('welcomeGrams'+i).textContent=p.g+' g';var buttons=rows.children[i].querySelectorAll('button');buttons[0].disabled=p.g<=25;buttons[1].disabled=p.g>=300;});
  var t=computeMealTotals(welcomeParts);
  document.getElementById('welcomeNutrition').innerHTML='<div><strong>'+t.kcal+'</strong><span>kcal</span></div><div><strong>'+t.protein+' g</strong><span>protein</span></div><div><strong>'+t.fiber+' g</strong><span>fibre</span></div>';
}

document.addEventListener('click',function(e){var g=document.getElementById('guidesMenu');if(g&&!g.contains(e.target))g.open=false;});
document.addEventListener('keydown',function(e){var g=document.getElementById('guidesMenu');if(e.key==='Escape'&&g&&g.open){g.open=false;g.querySelector('summary').focus();}});
