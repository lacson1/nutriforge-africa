# Food library review — October 2026

Added 28 preparation-specific entries from FAO/INFOODS WAFCT 2019, sheet `03 NV_sum_39 (per 100g EP)`. Each entry retains the source code, original food description, source link, and carbohydrate basis. Raw nutrient cells are retained in `test/fixtures/wafct-expansion.json` for validation. Brackets in the source can indicate alternative analytical definitions; these are disclosed in the source note. Mixed dishes represent the source recipe, not every version of that dish. GI and clinical evidence remain unreviewed.

Source: https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx

Names now emphasise the edible ingredient and preparation: ogbono seeds, fresh versus dried spirulina, pickled herring, banku, and attiéké. Previous names remain searchable aliases. This is a naming and composition expansion, not a clinical validation of all existing claims.

Duplicate choices for Bambara groundnuts, dried spirulina, garden egg, bovine colostrum, scent leaf and ogbono are suppressed in general browse and new swap suggestions. Legacy records and their nutrient values remain available by stable ID for existing plates, diaries and saved favourites. No historical quantities or nutrient records are migrated. Fresh spirulina and genuine preparation variants remain separate choices.

Verification: source-cell comparisons, unique IDs and visible names, alias search, legacy favourite access, duplicate exclusion in swaps, full automated suite, plus browser checks for search, Dishes filtering, adding/removing an added food from the plate, and cooked-food swaps.
