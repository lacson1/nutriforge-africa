# Mobile app design brief

_Started 2026-09-26 11:56 UTC_

---

## User

Design a mobile app for

## Assistant



## Assistant

_[tool: list_files]_

_[tool: ask_user]_

Your message got cut off after "for", so I've put up a short form. I need to know what the app is for, who uses it, which screens to include and what you want delivered. The design system attached to this project is empty, so the form also asks you to pick a visual style.

## User

Answered — audience: Patients / public; platform: iOS; variations: 3 options side by side; visual: NutriForge v5.0 style

## Assistant

_[tool: read_skill_prompt]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

I've built three clickable iPhone home screens side by side for a NutriForge patient app, in the NutriForge v5.0 style. You didn't say what the app was for, so I assumed a UK patient of Nigerian heritage with type 2 diabetes, on metformin 500 mg twice a day.

- **1a, condition home:** pick your situation (newly diagnosed, stable, fasting, pregnant, unwell) to change the advice shown. There's a vitamin B12 alert for metformin users, and foods sorted into four groups from "eat often" to "avoid".
- **1b, search first:** type a food and get a verdict, a portion size, a swap and the source. Palm wine also shows a warning about alcohol with metformin.
- **1c, my day:** a timeline of meals and medicine. Tap a meal to see a suggested plate, and tap a dose to mark it taken.

The clinical wording and sources are placeholders. A clinician should check them before anyone relies on this. The source lines name guidelines and references (NICE, BNF, MHRA, glycaemic index tables); I didn't include any study reference numbers.

If you had a different condition or purpose in mind, tell me and I'll switch it.

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "Mobile app design brief"
Project currently has 2 file(s)
User is viewing file: NutriForge Patient App.dc.html
</system-info>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/0f31c11e-d18e-433b-aa55-b9d7b24178b0/`. Before producing any visuals, explore it: call `list_files("/projects/0f31c11e-d18e-433b-aa55-b9d7b24178b0/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/0f31c11e-d18e-433b-aa55-b9d7b24178b0/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/0f31c11e-d18e-433b-aa55-b9d7b24178b0/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

## Assistant

_[tool: list_files]_

The design system attached to this project is still empty, so the three screens (1a, 1b, 1c) follow the NutriForge v5.0 style you picked.

What should I do next? For example:
- Build out one screen into a full flow, such as onboarding and then 1b.
- Combine 1a and 1c into one design.
- Switch the condition, for example to hypertension or sickle cell disease.

## User

Build out one screen into a full flow, such as onboarding and then 1b.

## Assistant

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

I've built the full flow in `NutriForge Onboarding Flow.dc.html`: a welcome screen, four onboarding steps, an "all set" summary, then the 1b food check. The app has four tabs: Check (with a detail page per food), Saved, Medicines and Me.

Your answers change what the app shows:
- **Kitchen:** Nigerian, Ghanaian or Caribbean decides which foods appear first.
- **Medicines:** these decide the warnings. Palm wine and rum punch get a major warning for anyone on metformin, gliclazide or insulin. The Medicines tab lists each drug's own warnings, such as B12 for metformin, salt substitutes for ramipril and grapefruit for simvastatin.
- **Situation:** "Fasting" or "Unwell" adds a banner on the check screen and a tip on relevant foods.

The panel on the left jumps straight to any screen. There are two tweaks: start at the welcome screen or go straight into the app, and show or hide the plate diagram.

High blood pressure and high cholesterol are greyed out as "Coming soon" because there's only diabetes guidance so far. The clinical wording still needs a clinician to check it.

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

I've added the full flow as <a href="#2a">2a</a>, above the original three screens. It goes welcome, then conditions, medicines, the food you cook at home, a safety screen, and on into the search home from 1b. It's out for a final check now.

- **Continue stays greyed out** until you've made a choice on each step.
- **Medicine warnings depend on what you picked.** For example, Palm wine warns about alcohol with metformin, gliclazide or insulin, and Coconut water warns about potassium with ramipril.
- **Your chosen foods come first.** The ones you cook at home lead the suggestions and the search placeholder, and I added Ghanaian, Caribbean and Somali dishes.
- **The "Edit" button on the home screen** goes back to the medicines step.

The warning text and sources are placeholders, so a clinician should check them before anyone relies on this.

## User

next 2 step implement

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I've added both remaining steps as <a href="#3a">3a</a>, one screen at the top of the file. It's still going through a final check.

- **Combined home:** today's meals and doses come first, then the medicine alert, "My situation", and the four food groups.
- **Condition switch:** a toggle in the header swaps everything between type 2 diabetes on metformin and high blood pressure on ramipril.
- **Blood pressure version:** it has its own foods focused on cutting salt, and a warning about ramipril with salt substitutes like LoSalt. The pregnancy and sick-day advice changes too, and it has its own meal plan.

A clinician should still check the wording before anyone relies on it.

## User

what are the next 5 things to do

## Assistant

1. **Get a clinician to check the content.** Every food verdict, portion, warning and source in the app is a placeholder. Nothing should go in front of patients until a GP or dietitian has signed it off.
2. **Test with 3–5 real patients.** Show 2a and 3a to UK patients of African heritage who have diabetes or high blood pressure. Check whether they can find an answer to "Can I eat jollof?" in under 10 seconds, and whether they understand the evidence dots.
3. **Build the missing tabs.** Three are designed but have no screens yet:
   - Medicines: a dose list, reminders, and every interaction in one place.
   - Handout: a one-page A4 summary to print or show your GP.
   - My plate: build a meal and see its verdict.
4. **Choose one home screen.** 1b is search-first and 3a is a day plan. Pick one as the default and make the other a tab, based on what you learn in step 2.
5. **Design the edge cases.** For example: a food we don't cover, more than one condition at once, medicines not on the list, and an urgent "call 999 or 111" state when you mark yourself as unwell.

## User

impelent all

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

I've built all five. Most of it is a new section 4 at the top of the app file, plus a separate "Clinical Review and Test Pack" file for the first two items. It's still going through a final check.

- **Missing tabs:**
  - 4a, Medicines: an expanding card for each medicine, a reminder switch, and a list of foods and drinks to watch, by severity.
  - 4b, Handout: a one-page A4 preview with a large-print option, plus Print and Share with GP buttons.
  - 4c, My plate: pick a vegetable, protein, starch and drink, plus a starch portion. The plate picture and the verdict update as you choose.
- **Edge cases (4d):** a food we don't have yet, one food with two conditions (the stricter advice wins), a medicine we can't check yet, and "Feeling unwell". The last one shows "Call 999" or the sick-day rules depending on what you tick.
- **Home screen:** I've suggested Today (3a) as the default, with search in a "Check" tab. The tab bar is now five tabs.
- **Clinical sign-off:** all 36 clinical claims are listed in the pack. A reviewer can mark each one Approve, Edit or Remove, and there's space for their name, registration number and signature.
- **Patient test:** a 5-person, 30-minute script with who to recruit, 6 tasks, a pass/fail grid, and 5 questions to ask afterwards. Task 2 settles the home-screen choice: if 3 or more of 5 go straight to search, make "Check" the home screen.

The sign-off and test results are saved in the browser, so they're still there after a reload. Both parts of the pack can be printed.

The Print, Share with GP, Add a medicine and Call buttons are for show only; they don't do anything yet.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I fixed the text wrapping in the review pack: the filter buttons and the review counts now stay on one line. The final check found no other problems in either file.

## User

proceed to next steps

## User

proceed to next steps

## User

proceed

## Assistant

_[tool: copy_starter_component]_

_[tool: dc_write]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

I've made the handout a real printable A4 page and connected the app's buttons to it. It's still going through a final check.

- **New handout file:** it fills itself in from the patient's conditions and medicines. It includes foods to eat often, go easy on and avoid, plus medicine warnings. It also has the sick-day rules, when to call 999 or 111, and a line for a GP or dietitian to sign.
- **Print (4b and 5a):** opens the handout filled in with the answers from onboarding, then opens the print window. If large print is on, the handout uses bigger text.
- **Share with GP:** uses the phone's share menu. On a computer without one, it opens the handout instead.

With no onboarding answers, the handout shows type 2 diabetes and high blood pressure on metformin and ramipril as an example. The Call 999 and 111 buttons still do nothing.

Next, run the 5-person patient test with 5a and the review pack.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I fixed the medicine warnings on the handout: "MODERATE" was running into the text next to it, and the label column is now wide enough in both normal and large print.

## User

push it to my mobile

## Assistant

_[tool: read_file]_

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: get_public_file_url]_

_[tool: present_fs_item_for_download]_

I've made a version that fits your phone's screen and opens in any mobile browser. I haven't tested it on a real phone.

**Open it on your phone:** <https://a75296e2-2e37-439e-b955-d9fa3cb2e277.claudeusercontent.com/v1/design/projects/a75296e2-2e37-439e-b955-d9fa3cb2e277/serve/NutriForge%20Mobile.html?t=8732379036b689da73132d4fd09819bb658866cc491a96e75b06e1ec9c295721.4467c4db-e996-4be6-bc5f-3e9256e0c6aa.00a7f258-6394-4e80-8aba-0d95106f1819.1790544297.fp&direct=1>

The link stops working after about an hour. In Safari, tap Share and then "Add to Home Screen" to open it like an app.

To keep it longer, download the file above and send it to your phone with AirDrop or email, then open it in a browser. It works without internet, apart from the heading font.

This is the onboarding flow into the "Can I eat this?" screen, which I built earlier. On a laptop it still shows the phone frame.

