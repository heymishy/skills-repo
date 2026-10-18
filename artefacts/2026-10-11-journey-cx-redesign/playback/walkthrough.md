# Playback Walkthrough: 2026-10-11-journey-cx-redesign

**Captured:** 2026-10-18, live against `https://wuce-staging.fly.dev`, logged in as the real operator account — the second real capture produced with `fpd-s5`'s own real-capture loop fix, against a genuinely different feature (not `web-ui-pm-flow`) to prove the cross-story/cross-feature path-namespacing fix for real.

## jcx-s6 — Restructure the Customer experience tab into a real timeline + swimlane grid

### AC1 — Stages render left-to-right as columns

Real screenshot of the real "Customer experience" tab on a real journey (`jae-s3 live-verify (skills-framework)`), captured live:

![Customer experience swimlane grid](jcx-s6/screenshots/AC1.png)

Stage columns (Evaluate, Discover, Purchase, Onboard, Retain — scrollable) render left-to-right exactly as `jcx-s6-dod.md`'s own AC1 describes, with swimlane rows (Emotion, Customer actions, ...) aligned underneath — this same page was already live-confirmed once before, by a prior session, at merge time; this capture is the first time it's been captured through the Feature Playback mechanism itself.

### AC2 — Swimlane rows (emotion, customer actions, touchpoints, pain points) render per stage column

![Customer experience swimlane grid with two stages populated](jcx-s6/screenshots/AC2.png)

Real screenshot, captured 2026-10-18 against a disposable test journey on production (`skills-framework.fly.dev`, "fpd-s5 playback-capture verification (disposable)"). Shows Emotion, Customer actions, Touchpoints, and Pain points each rendering as their own labeled row, with real content aligned under the Evaluate and Discover stage columns.

### AC3 — Curve points carry their own stage name directly on the chart

Same screenshot as AC2 (`jcx-s6/screenshots/AC3.png`, identical capture): the "Evaluate" and "Discover" labels appear directly beneath their emotion points on the curve itself, not only in a separate list.

### AC4 — `customer_actions`/`touchpoints` surfaced in their own swimlane rows

Same screenshot as AC2 (`jcx-s6/screenshots/AC4.png`, identical capture): "Compares pricing across vendors" / "Reads reviews, asks peers, shortlists 3 vendors" (Customer actions) and "Pricing page, sales demo call" / "Review sites, community forum, LinkedIn" (Touchpoints) both render in their own rows — closing the data-surfacing gap the spike found.

## jcx-s3 — Emotion curve across stages

### AC1 — Connected curve across 2+ stages with emotion set

![Emotion curve: Evaluate positive, Discover negative](jcx-s3/screenshots/AC1.png)

Real capture, same journey/session as above. A connected line renders from the Evaluate stage (positive) to the Discover stage (negative), visually tracking position per the emotion value — not independent chips.

### AC2 — Unset stages show an explicit "no emotion data yet" marker on the curve

Same screenshot (`jcx-s3/screenshots/AC2.png`, identical capture): Purchase, Onboard, and Retain — none of which have an emotion value set — each show "No data yet" directly on the curve rather than being silently skipped or rendered at a misleading default position.

### AC3 — Whole-curve empty state when no stages have emotion set

![Customer experience tab before any emotion data is set](jcx-s3/screenshots/AC3.png)

Real capture from earlier in the same session, before any stage had emotion data: "No emotion data yet. Set each stage's emotion in the side panel to see the journey's emotional arc." — a clear, friendly empty state, not a blank space or broken flat line.

### AC4 — Curve points carry text labels, not colour alone

Same screenshot as AC1 (`jcx-s3/screenshots/AC4.png`, identical capture): "positive" and "negative" render as visible text under each point, reusing the existing emotion-chip text-label convention (MC-A11Y-02).

## jcx-s4 — Persona card with discovery-sourced suggestions

### AC2 — Blank-entry form fallback when no discovery-sourced persona suggestion exists

![Blank persona form, no error](jcx-s4/screenshots/AC2.png)

Real capture: this disposable test journey's product ("No product") has no discovery artefact to scan, so the persona editor falls back to a plain blank Name/Role/Goal form — no broken empty state, no error shown.

### AC3 — Saving a persona updates the journey and renders on the card

![Saved persona card: Priya Shah, Procurement Lead](jcx-s4/screenshots/AC3.png)

Real capture: after saving Name "Priya Shah", Role "Procurement Lead", Goal "Find the best-value vendor without compromising on support quality", the persona card on the Customer experience tab renders the saved values with an "Edit persona" action — confirmed again after a full page reload, so this is real persisted state, not a transient client-side render.

### AC4 — Reopening the editor shows the currently-saved persona, not suggestions

![Persona form reopened, pre-filled with the saved values](jcx-s4/screenshots/AC4.png)

Real capture: clicking "Edit persona" reopens the form pre-filled with the already-saved Name/Role/Goal values — it does not re-offer discovery-sourced suggestions as if nothing were saved.

**AC1 and AC5 (discovery-sourced suggestion offering and multi-persona-source scanning) were not captured this pass** — they require a product with 1+ features carrying a discovery artefact that names a persona in its "Who It Affects" section, which this disposable test journey's product ("No product") does not have. Deferred to a future capture pass against a real product.

## How this package was produced

Captured via the operator's own authenticated Chrome session, same method and same transparency note (JPEG bytes under a `.png` name — no image-conversion tool available in this sandbox) as the `web-ui-pm-flow` capture. This feature's own `dodStatus` field at the feature level was never set (`undefined`) despite all 7 of its real stories (`jcx-s1`-`jcx-s7`) being individually `dodStatus: complete` — the same pattern already found in `feature-playback-demo` itself. A feature-level-only search for capture targets would have missed this (and ~270 other features in this repo with at least one real DoD-complete story) entirely.

The jcx-s3/jcx-s4/jcx-s6 captures above were taken 2026-10-18 against a disposable test journey ("fpd-s5 playback-capture verification (disposable)", journey UUID `1b7e4d0d-f7a8-437b-8f7a-1502218c833e`) created specifically for this purpose on production (`skills-framework.fly.dev`) — not against real customer data. The journey is safe to leave in place or delete; it carries no production meaning beyond generating this evidence.
