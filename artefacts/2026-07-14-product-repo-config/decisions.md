# Decision Log: 2026-07-14-product-repo-config

**Feature:** Per-Product Git Repo Configuration and Management
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Last updated:** 2026-07-14

---

**2026-07-14 | SCOPE | /definition — metric gap resolution**
**Decision:** Meta Metric 1 (pairing workflow validation) has no story that directly moves it — accepted as-is, not resolved via any of the skill's three standard options (write a story / descope / mark post-MVP).
**Alternatives considered:** Write a synthetic story just to show coverage in the matrix (rejected — would be a story with no real AC, existing only to satisfy the coverage check, exactly the kind of output-not-outcome pattern this pipeline's benefit-metric discipline exists to prevent). Descope the metric entirely (rejected — the discovery's own risk section explicitly named this hypothesis as needing validation; dropping the metric would silently hide that open question). Mark post-MVP (rejected — it isn't deferred work, it's a measurement that can only happen once the feature ships and is used).
**Rationale:** Meta Metric 1 is a behavioral/usage signal, inherently measurable only after the full feature ships — all 14 stories collectively enable it to be measured (nothing to observe usage of until the feature exists) but none of them individually implement it. This is a structural property of Tier 2 meta-metrics, not a coverage gap in this feature's story set.
**Made by:** Claude (agent), via /definition, 2026-07-14.
**Revisit trigger:** At /definition-of-done, confirm this metric's baseline/target are actually measured post-launch (per benefit-metric.md's own measurement method — manual observation by Hamish King) rather than silently left at "not-yet-measured" indefinitely.

---

**2026-07-14 | SCOPE | /definition — story gap resolution**
**Decision:** prc-s4.2 (delete/detach a product) ships with no direct metric linkage.
**Alternatives considered:** Force a metric connection (rejected — none of the 4 defined metrics genuinely move when a product is deleted; a fabricated linkage would be dishonest, not useful). Remove the story from MVP scope (rejected — discovery's MVP scope item 6 explicitly names product deletion as required functionality, and CLAUDE.md's own architecture-guardrails anti-pattern list already flags "mocking/forcing linkage to look complete" as the kind of shortcut that produces unreliable artefacts).
**Rationale:** Not every legitimate scope item has to move a numeric target — prc-s4.2 closes a structural completeness gap (zero product-delete capability exists today) that discovery named directly. Metric linkage exists to prevent scope creep dressed up as necessity, not to force every necessary story into a metric's shape.
**Made by:** Claude (agent), via /definition, 2026-07-14.
**Revisit trigger:** None — this is a stable, low-complexity story; no reason to expect it needs revisiting.

---

**2026-07-14 | SCOPE | /definition — scope accumulator ratio**
**Decision:** 14 stories against 6 discovery MVP scope items (2.33x ratio, over the skill's 1.5x drift-flag threshold) accepted as Option 3 — ratio is misleading, not real scope drift.
**Alternatives considered:** Treat as intentional growth requiring a discovery.md update (rejected — nothing here goes beyond what discovery's MVP scope already named; no new capability was added mid-decomposition). Treat as scope creep requiring deferral (rejected — every story traces cleanly to either a named MVP item or a structural requirement of the chosen slicing strategy/a metric's own definition).
**Rationale:** 12 of 14 stories map 1:1 onto the 6 MVP items — several items (repo configuration flow, route existing write paths, standards conversion, product management UX) are broad enough to legitimately span 2-3 stories each once decomposed. The remaining 2 stories (prc-s1.4, prc-s4.3) are verification stories: prc-s1.4 is the walking-skeleton strategy's own required proof point (chosen explicitly at Step 2 to de-risk before building further), and prc-s4.3 is Metric 3's own named measurement mechanism, not an independent scope addition.
**Made by:** Claude (agent), via /definition, 2026-07-14.
**Revisit trigger:** None.

---
<!-- Add further decisions as they arise during delivery. -->
