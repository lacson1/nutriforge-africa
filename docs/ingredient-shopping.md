# Ingredient shopping estimates

Source: FAO/INFOODS WAFCT 2019 workbook, sheets 07 (single-food yields) and 09 (mixed dishes), https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx.

`shopping-recipes.js` retains source food codes, observation number, ingredient codes, raw edible weights and yield factors. For a mixed dish, cooked batch weight = sum of all raw ingredients (including water) × recipe yield factor. Each shopping ingredient = planned dish weight × ingredient batch weight / cooked batch weight × family size. Water remains in the yield calculation but is omitted from the shopping list. The first documented observation is used; this is an estimate for that recipe, not an exact reverse calculation of the food composition table's averaged nutrient entry.

Single-food conversions use the exact source preparation's yield factor and an explicitly reviewed raw-food code. Unsupported recipes remain visibly labelled prepared weights. Ready-to-buy foods remain as listed. Raw quantities are edible portions, not untrimmed purchase weights; peel, bone and pack-size allowances are not estimated.

Family size is 1–20 equivalent portions and affects shopping only. Options and checkmarks use the existing profile-and-week storage scope. Changing required quantities invalidates old checkmarks. Planned grams, plate portions and diary totals are not changed.

The documented Babenda recipe includes beef stock; its combination is now labelled With meat stock rather than Plant-based.
