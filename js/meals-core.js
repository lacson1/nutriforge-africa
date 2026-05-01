/* NutriForge Africa — pure meal/diary macro aggregation (no DOM). */
var NFMealsCore = {
  computeMealTotals: function (parts, foodsById) {
    var o = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    (parts || []).forEach(function (p) {
      var food = foodsById[p.id];
      if (!food || !p.g) return;
      var m = p.g / 100;
      o.kcal += food.kcal * m;
      o.protein += food.protein * m;
      o.carbs += food.carbs * m;
      o.fat += food.fat * m;
      o.fiber += food.fiber * m;
    });
    o.kcal = Math.round(o.kcal);
    o.protein = Math.round(o.protein * 10) / 10;
    o.carbs = Math.round(o.carbs * 10) / 10;
    o.fat = Math.round(o.fat * 10) / 10;
    o.fiber = Math.round(o.fiber * 10) / 10;
    return o;
  },
  aggregateDiaryEntries: function (entries, foodsById) {
    var t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    (entries || []).forEach(function (entry) {
      var food = foodsById[entry.foodId];
      if (!food) return;
      var g = entry.grams || 100;
      var m = g / 100;
      t.kcal += food.kcal * m;
      t.protein += food.protein * m;
      t.carbs += food.carbs * m;
      t.fat += food.fat * m;
      t.fiber += food.fiber * m;
    });
    t.kcal = Math.round(t.kcal);
    t.protein = Math.round(t.protein * 10) / 10;
    t.carbs = Math.round(t.carbs * 10) / 10;
    t.fat = Math.round(t.fat * 10) / 10;
    t.fiber = Math.round(t.fiber * 10) / 10;
    return t;
  },
};
