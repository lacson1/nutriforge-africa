/* One query for the visible list, CSV export and assistant food context. */
function queryFoods(items, state, matchesSearch, relevance) {
  var list = items.filter(function(f) {
    if(state.scope === 'african' && !f.african) return false;
    if(state.scope === 'nigeria' && !f.nigeria) return false;
    if(state.scope === 'dishes' && !f.browseAsDish) return false;
    if(state.scope === 'favourites' && !(state.favourites || {})[f.id]) return false;
    if(state.category && f.cat !== state.category) return false;
    if(state.term && !matchesSearch(f, state.term)) return false;
    if(state.evidence === 'High' && f.evidence !== 'High') return false;
    if(state.evidence === 'Moderate' && ['High','Moderate'].indexOf(f.evidence)<0) return false;
    if(state.drug === 'critical' && f.drugSev !== 'critical') return false;
    if(state.drug === 'moderate' && ['critical','moderate'].indexOf(f.drugSev)<0) return false;
    if(state.drug === 'mild' && (!f.drugSev || f.drugSev === 'none')) return false;
    if(state.region && state.region !== 'all' && (f.regions || []).indexOf(state.region)<0) return false;
    return !state.condition || (f.conditions || []).indexOf(state.condition)>-1;
  });
  var numeric = {kcal_asc:['kcal',1],kcal_desc:['kcal',-1],protein:['protein',-1],protein_asc:['protein',1],carbs:['carbs',-1],carbs_asc:['carbs',1],fat:['fat',-1],fat_asc:['fat',1],fiber:['fiber',-1],fiber_asc:['fiber',1],longevity:['longevity',-1],longevity_asc:['longevity',1],confidence:['stars',-1],confidence_asc:['stars',1]};
  return list.sort(function(a,b) {
    var order=state.sort || 'name', d=0;
    if(numeric[order]) { var key=numeric[order]; d=(a[key[0]]-b[key[0]])*key[1]; }
    else if(order === 'gi' || order === 'gi_desc') {
      var ranks={Low:0,'Low-Medium':1,Medium:2,High:3};
      var av=ranks[a.gi],bv=ranks[b.gi];
      if(av===undefined || bv===undefined) d=av===bv?0:av===undefined?1:-1;
      else d=(av-bv)*(order==='gi'?1:-1);
    } else if(order === 'name_desc') d=b.name.localeCompare(a.name);
    else if(state.term && relevance) d=relevance(b,state.term)-relevance(a,state.term);
    return d || a.name.localeCompare(b.name);
  });
}
function getVisibleFoods() {
  return queryFoods(foods,{scope:filter,category:categoryFilter,term:term,sort:sort,evidence:evidenceFilter,drug:drugFilter,region:regionFilter,condition:activeCondition,favourites:favourites},foodMatchesSearch,foodSearchRelevance);
}
