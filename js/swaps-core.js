/* Deterministic, same-category comparisons using the existing per-100 g data. */
function findFoodSwaps(items, source, goal, africanOnly) {
  if (!source) return [];
  var metric = {fiber:['fiber',1],protein:['protein',1],carbs:['carbs',-1],kcal:['kcal',-1]}[goal];
  var keys = ['kcal','protein','carbs','fat','fiber'];
  function valid(f) { return keys.every(function(k){return typeof f[k]==='number' && Number.isFinite(f[k]) && f[k]>=0;}); }
  if (!valid(source)) return [];
  function preparation(f) {
    var text=(f.name+' '+(f.catLabel||'')).toLowerCase();
    if(/\b(dried|dry|powder|flour|bran)\b/.test(text)) return 'dry';
    if(/\b(cooked|boiled|steamed|roasted|baked|grilled)\b/.test(text)) return 'cooked';
    if(/\braw\b/.test(text)) return 'raw';
    return 'unspecified';
  }
  var prep=preparation(source);
  return items.filter(function(f){
    return f.id!==source.id && f.name.toLowerCase()!==source.name.toLowerCase() && preparation(f)===prep && f.cat===source.cat && !!f.browseAsDish===!!source.browseAsDish && valid(f) &&
      (!africanOnly || f.african) && (!metric || (f[metric[0]]-source[metric[0]])*metric[1]>0.05);
  }).sort(function(a,b){
    function distance(f){return keys.reduce(function(sum,k){return sum+(metric && k===metric[0]?0:Math.abs(f[k]-source[k])/Math.max(1,source[k]));},0);}
    return distance(a)-distance(b) || a.name.localeCompare(b.name);
  }).slice(0,6);
}
function applyFoodSwap(plate, portions, source, target, grams) {
  if(!source || !target || source.id===target.id || plate[target.id] || !Number.isFinite(grams) || grams<1 || grams>2000) return null;
  var nextPlate=Object.assign({},plate), nextPortions=Object.assign({},portions);
  var replaced=!!nextPlate[source.id];
  if(replaced) delete nextPlate[source.id];
  nextPlate[target.id]=target; nextPortions[target.id]=grams;
  return {plate:nextPlate,portions:nextPortions,replaced:replaced};
}
