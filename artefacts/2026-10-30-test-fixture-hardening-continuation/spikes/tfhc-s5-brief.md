# Spike Brief: products.js/journeys.js fixture duplication

**Question:** Do `products.js` and/or `journeys.js` carry the same hand-rolled-fixture duplication problem already confirmed and closed for `skills.js` (12/45) and `journey.js` (16/41)?
**Type:** 4 — Data/integration (what does the real test code actually look like, independently re-derived)
**Blocking:** `tfhc-s5`'s own follow-on implementation story within this epic (gated on PROCEED, per `discovery.md` item 5)
**Scope:** Narrow — single targeted source sweep, up to 3 steps
**Done condition:** A confirmed duplication count for each of `products.js` and `journeys.js`, plus a recorded PROCEED/DEFER/REJECT verdict.
**Out of scope:** Implementing a fixture for either surface — that is a separate follow-on story, gated on this spike's verdict, not this spike itself. Migrating any individual test file.

**Note on pre-answering Steps 1–6:** this spike's question, blocking stage, type, scope, and done condition are already fully specified in `benefit-metric.md` (Metric 5) and `discovery.md` (item 5), both reviewed and approved earlier in this epic's own session. Proceeding directly to investigation rather than re-asking already-answered setup questions.

---

## Outcome options (pre-stated per discovery.md item 5)

- **PROCEED:** implement the walking-skeleton fixture pattern for whichever surface is confirmed, within this same MVP, same bounded shape as `tfhc-s3` (one fixture + one proof-of-pattern migration).
- **REDESIGN:** not applicable to this spike's question shape (there is no existing approach to redesign — this is a yes/no duplication-confirmation question).
- **DEFER/REJECT:** stays out of scope, no new discovery needed to say so.
