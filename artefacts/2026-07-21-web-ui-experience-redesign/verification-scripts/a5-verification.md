# AC Verification Script: Surface discovery-only and ideation-only work in a Roadmap tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a5-roadmap-tab.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a5-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Open the skills-framework product (this repo's own self-registered product) and click the Roadmap tab.

---

## Scenarios

### Scenario 1 — Discovery-only work appears (AC1)
1. Look at the Roadmap tab.

**Expected:** You see "Context Graph Primitive — Structural Codebase Context for Outer/Inner Loop" (or a similarly real discovery-only feature from this repo) listed with a "Discovery" stage label and a date.

### Scenario 2 — Ideate-only work is labelled differently (AC2)
1. Find "Strategy and Data Grounding for Pipeline Sessions" in the list.

**Expected:** It shows a distinct stage label from plain "Discovery" (e.g. "Ideate only"), since this feature has an ideate.md.

### Scenario 3 — Already-shipped work doesn't clutter the roadmap (AC3)
1. Look for "Product Rollup & Aggregation Layer" (or any feature you know has already progressed to real stories) in the Roadmap tab.

**Expected:** It does NOT appear here — it's tracked elsewhere in the product view (the Modules/By-epic tabs), not duplicated in Roadmap.

### Scenario 4 — Empty state (AC4)
1. If you can access a product/repo with genuinely zero early-stage artefacts, open its Roadmap tab.

**Expected:** A clear message like "Nothing in early-stage discovery right now" — not a blank page or an error.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Discovery-only shown | | |
| 2 — Ideate-only distinct label | | |
| 3 — Tracked work excluded | | |
| 4 — Empty state | | |
