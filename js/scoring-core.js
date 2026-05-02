/* NutriForge — drug severity heuristic, longevity score, evidence stars. */
function classifyDrug(limits) {
  var l = (limits || '').toLowerCase();
  if (l.indexOf('critical') > -1 || l.indexOf('ricin') > -1 || l.indexOf('fatal') > -1 ||
      l.indexOf('cyanide') > -1 || l.indexOf('annonacin') > -1 ||
      (l.indexOf('cyp3a4') > -1 && l.indexOf('statin') > -1)) return 'critical';
  if (l.indexOf('warfarin') > -1 || l.indexOf('anticoagulant') > -1 ||
      l.indexOf('cyp3a4') > -1 || l.indexOf('uterotonic') > -1 ||
      l.indexOf('g6pd') > -1 || l.indexOf('l-dopa interaction') > -1) return 'moderate';
  if (l.indexOf('interaction') > -1 || l.indexOf('allergy') > -1 ||
      l.indexOf('caution') > -1 || l.indexOf('avoid') > -1 ||
      l.indexOf('purine') > -1 || l.indexOf('oxalate') > -1 ||
      l.indexOf('fodmap') > -1 || l.indexOf('goitrogenic') > -1) return 'mild';
  return 'none';
}

function calcLongevity(f) {
  var score = f.evidence === 'High' ? 35 : f.evidence === 'Moderate' ? 20 : 5;
  score += Math.min(15, f.fiber * 1.5);
  score += Math.min(10, f.protein * 0.3);
  var bio = ((f.bio || '') + ' ' + (f.benefits || '')).toLowerCase();
  if (bio.indexOf('nrf2') > -1 || bio.indexOf('nf-kb') > -1 || bio.indexOf('inflammation') > -1) score += 8;
  if (bio.indexOf('rct') > -1 || bio.indexOf('randomis') > -1) score += 8;
  if (bio.indexOf('cancer') > -1 || bio.indexOf('cardiovascular') > -1 || bio.indexOf('mortality') > -1) score += 8;
  if (bio.indexOf('all-cause mortality') > -1 || bio.indexOf('longevity') > -1 || bio.indexOf('ageing') > -1) score += 6;
  if (bio.indexOf('microbiome') > -1 || bio.indexOf('akkermansia') > -1 || bio.indexOf('bifidobacterium') > -1) score += 5;
  if (f.gi === 'Low') score += 5;
  if (f.top3) score += 8;
  return Math.min(100, Math.round(score));
}

function confStars(ev) {
  return ev === 'High' ? 5 : ev === 'Moderate' ? 3 : 1;
}
