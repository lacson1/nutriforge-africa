/* NutriForge Africa — food search (multi-word AND, affordability synonyms, light fuzzy). */
var AFFORD_SYNONYM_GROUPS = [
  ['cheap', 'economical', 'inexpensive', 'affordable', 'budget', 'low-cost', 'low cost', 'economic', 'food security', 'accessible', 'widely available', 'staple'],
  ['expensive', 'costly', 'premium', 'imported', 'hard to source', 'very expensive', 'higher cost'],
];
function affordSynonymGroup(token) {
  var t = String(token || '').toLowerCase();
  for (var gi = 0; gi < AFFORD_SYNONYM_GROUPS.length; gi++) {
    var g = AFFORD_SYNONYM_GROUPS[gi];
    for (var i = 0; i < g.length; i++) if (g[i] === t) return g;
  }
  return null;
}
function foodSearchHaystack(f) {
  return [f.name, f.aka || '', f.benefits || '', f.bio || '', f.use || '', f.catLabel || '', f.micro || '', f.limits || ''].join(' ').toLowerCase();
}
function foodSearchHaystackShort(f) {
  return [f.name, f.aka || '', f.catLabel || ''].join(' ').toLowerCase();
}
function tokenMatchesHaystack(hay, t) {
  if (!t) return true;
  if (hay.indexOf(t) > -1) return true;
  var grp = affordSynonymGroup(t);
  if (grp) {
    for (var j = 0; j < grp.length; j++) {
      if (hay.indexOf(grp[j]) > -1) return true;
    }
  }
  return false;
}
function fuzzySubsequence(hay, needle) {
  if (!needle) return true;
  var qi = 0;
  for (var si = 0; si < hay.length && qi < needle.length; si++) {
    if (hay.charCodeAt(si) === needle.charCodeAt(qi)) qi++;
  }
  return qi === needle.length;
}
function tokenMatchesWithFuzzy(f, t) {
  var hay = foodSearchHaystack(f);
  if (tokenMatchesHaystack(hay, t)) return true;
  if (t.length >= 3 && fuzzySubsequence(foodSearchHaystackShort(f), t)) return true;
  return false;
}
function foodMatchesSearch(f, qraw) {
  var q = String(qraw || '').trim().toLowerCase();
  if (!q) return true;
  var toks = q.split(/[\s,]+/).filter(function (x) {
    return x.length > 0;
  });
  for (var ti = 0; ti < toks.length; ti++) {
    if (!tokenMatchesWithFuzzy(f, toks[ti])) return false;
  }
  return true;
}
function foodSearchRelevance(f, qraw) {
  var q = String(qraw || '').trim().toLowerCase();
  if (!q) return 0;
  var sc = 0;
  var nm = f.name.toLowerCase();
  var ak = (f.aka || '').toLowerCase();
  if (nm.indexOf(q) === 0) sc += 120;
  else if (nm.indexOf(q) > -1) sc += 70;
  if (ak.indexOf(q) > -1) sc += 35;
  var toks = q.split(/[\s,]+/).filter(Boolean);
  for (var i = 0; i < toks.length; i++) {
    var t = toks[i];
    if (nm.indexOf(t) === 0) sc += 45;
    else if (nm.indexOf(t) > -1) sc += 28;
    if (ak.indexOf(t) > -1) sc += 18;
    var cl = (f.catLabel || '').toLowerCase();
    if (cl.indexOf(t) > -1) sc += 10;
  }
  return sc;
}
