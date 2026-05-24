# Factual corrections — Sourdough Calculator content audit

Cross-referenced with common artisan practice (Tartine-style workflows, Maurizio Leo / The Perfect Loaf, standard bakers’ percentages).

## Autolyse vs fermentolyse

| Term | Definition | App behavior |
|------|------------|--------------|
| **Autolyse** | Rest of **flour + water only** (no levain, no salt). Develops gluten and extensibility. | Step 1 / timeline autolyse block — copy now states this explicitly. |
| **Fermentolyse** | Rest of flour + water **with levain** included. Faster enzyme activity; not the same as autolyse. | **Not** used in default workflow. Glossary entry added so users do not confuse the two. |
| **Final mix** | Levain, salt, and held-back water (bassinage) added **after** autolyse, then bulk fermentation begins. | Guide step 2 renamed; timeline step 3 renamed to “חיוב, מלח והתפחה ראשונית בקערה”. |

## Terminology standardized (Hebrew UI)

| Casual / old | Professional (Hebrew) |
|--------------|------------------------|
| אחוז מחמצת | שיעור חיוב (מחמצת) — *inoculation rate* |
| התפחה ראשונית (alone) | התפחה ראשונית **בקערה** — *bulk fermentation* |
| התפחה איטית במקרר | התפחה **קרה** במקרר — *cold retard* |
| מים % | אחוז הידרציה (שיטת הבייקר) |
| טמפרטורת מים | טמפרטורת בצק יעד (DDT) / מי לישה לפי DDT |
| שיא (vague) | שיא פעילות — peak activity (volume + aroma) |

## Values & guardrails

- **Hydration >85%**: Warn that gluten structure needs strong flour (Manitoba / high-protein bread flour), not only “too wet”.
- **Salt**: Baker’s % typically **1.8–2.2%** of total flour; hard bounds unchanged, soft guidance copy improved.
- **DDT**: Target dough temperature after mix usually **24–26°C** for bulk at room temp; friction factor must be measured, not guessed.
- **Cold retard**: Fermentation slows markedly below **4°C**; copy mentions fridge, not “any cool place”.
- **Float test**: Indicates **peak levain activity**, not merely “any float”.
- **Bassinage**: Held water is excluded from autolyse and from baker’s hydration until added at final mix.

## Scheduling / fermentation model

- Blackout bypass suggestions use **15% rate per °C** (documented in `fermentationTemp.ts`).
- Safe dough temp band **4–30°C**; outside range → suggest **inoculation rate** change, not unsafe temps.

## Not changed (already correct)

- Reverse timeline math and step order (feed → autolyse → mix/bulk → preshape → retard → bake).
- Bassinage split in `bakingMath` (water held from autolyse).
- Express mode short **autolyse** (30 min) remains flour+water only unless user adds levain early manually.
