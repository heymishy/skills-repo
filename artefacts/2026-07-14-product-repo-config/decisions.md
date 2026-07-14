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

**Operator confirmation (2026-07-14, via /review run 1 finding 1-H1):** `/review` correctly re-surfaced this as a HIGH finding rather than treating the above reasoning as self-certifying (same agent authored both the original decision and the review). Hamish King reviewed the tradeoff independently (option 1: confirm as-is vs. option 2: force a thin Metric 2 linkage via "deleting a mis-configured product removes bad data from the denominator") and confirmed option 1 — the above reasoning stands. Finding 1-H1 is acknowledged and resolved, not overridden.

---

**2026-07-14 | SCOPE | /definition — scope accumulator ratio**
**Decision:** 14 stories against 6 discovery MVP scope items (2.33x ratio, over the skill's 1.5x drift-flag threshold) accepted as Option 3 — ratio is misleading, not real scope drift.
**Alternatives considered:** Treat as intentional growth requiring a discovery.md update (rejected — nothing here goes beyond what discovery's MVP scope already named; no new capability was added mid-decomposition). Treat as scope creep requiring deferral (rejected — every story traces cleanly to either a named MVP item or a structural requirement of the chosen slicing strategy/a metric's own definition).
**Rationale:** 12 of 14 stories map 1:1 onto the 6 MVP items — several items (repo configuration flow, route existing write paths, standards conversion, product management UX) are broad enough to legitimately span 2-3 stories each once decomposed. The remaining 2 stories (prc-s1.4, prc-s4.3) are verification stories: prc-s1.4 is the walking-skeleton strategy's own required proof point (chosen explicitly at Step 2 to de-risk before building further), and prc-s4.3 is Metric 3's own named measurement mechanism, not an independent scope addition.
**Made by:** Claude (agent), via /definition, 2026-07-14.
**Revisit trigger:** None.

---

**2026-07-14 | SCOPE | /review run 1 — prc-s3.3 HIGH finding resolved**
**Decision:** Narrowed `prc-s3.3`'s scope from "rework standardsList/standardsPost/standardsPut to read-through/write-through git" to "wire `standardsList` to read from the git-backed cache, with `standardsPromote`/`optoutPost`/`optoutDelete` proven unaffected" — dropping the write-through claim entirely.
**Alternatives considered:** Keep the original scope and just rewrite the Benefit Linkage sentence to sound less like a technical dependency (rejected — the underlying overlap was real, not just a wording problem: `prc-s3.1`'s own AC1 already requires the write path to run through `standardsPost`/`standardsPut`, so `prc-s3.3` claiming to "rework" that same write-through was describing work `prc-s3.1` already does).
**Rationale:** `/review` run 1 flagged (1-H1) that `prc-s3.3`'s benefit linkage was the exact "we need this to build the next thing" pattern the story template explicitly bans. Investigating why surfaced a real scope-boundary defect from `/definition`, not just weak prose — `prc-s3.1` and `prc-s3.3` overlapped on the write path. The corrected `prc-s3.3` has a genuine, distinct, user-observable job (read-side correctness + regression-boundary proof for promote/opt-out) with an honest benefit linkage. Complexity rating dropped from 2 to 1 to reflect the narrower scope.
**Made by:** Claude (agent), via /review fix-up, 2026-07-14 — operator confirmed the approach before the edit was made.
**Revisit trigger:** None.

---

**2026-07-14 | SCOPE | /test-plan — prc-s2.2 AC2 rewritten for independent testability**
**Decision:** Rewrote `prc-s2.2` AC2 from "verified by the implementation containing no `git clone`/`simple-git` dependency, unless AC4's fallback was genuinely needed" to "a Contents/Git Data API call sequence (tree/blob/commit) is present and was genuinely invoked for the primary path — independently verifiable regardless of whether a fallback path (AC4) also exists in the codebase."
**Alternatives considered:** Leave AC2 as written and have the coding agent interpret it at implementation time (rejected — `/review` finding 1-M1 already established this AC's outcome depends on AC4's conditional branch, which is exactly the independent-testability violation the story template warns against; deferring the fix to implementation time risks the same ambiguity resurfacing there instead).
**Rationale:** Surfaced while writing `prc-s2.2`'s test plan — the original AC2 could not be translated into a single, unconditional test. The corrected wording tests the same underlying intent (the API-only path was genuinely attempted, not skipped) without depending on AC4's outcome.
**Made by:** Claude (agent), via /test-plan, 2026-07-14.
**Revisit trigger:** None.

---

**2026-07-14 | ASSUMPTION | /test-plan — prc-s4.3 needs real GitHub test repos, not yet provisioned**
**Decision:** `prc-s4.3`'s E2E spec requires two real, disposable GitHub repos (one per test tenant) — flagged as a test-data gap rather than resolved, since this depends on external GitHub account/org provisioning outside this session's control.
**Alternatives considered:** Mock the GitHub API for this spec instead (rejected — this spec's entire purpose is proving real cross-tenant isolation against the real Contents API; mocking it would defeat the story, same reasoning as `prc-s1.4`'s real-commit requirement).
**Rationale:** This is the same class of external-dependency gap already tracked for this session's broader infra-provisioning work (Fly/Neon/Upstash/PostHog) — adding a note here rather than silently assuming it'll resolve itself, consistent with the DATABASE_URL-gated test precedent elsewhere in this repo (tests must skip visibly, never mock a canned result, when a real dependency is unavailable).
**Made by:** Claude (agent), via /test-plan, 2026-07-14.
**Revisit trigger:** Resolve before `/definition-of-ready` for `prc-s4.3` specifically — either provision test repos, or explicitly RISK-ACCEPT deferring this story's implementation until they exist.

---

**2026-07-14 | RISK-ACCEPT | /definition-of-ready — W3 (MEDIUM review findings), 3 stories**
**Decision:** Accept `prc-s1.4`'s 1-M1 (verification environment not yet named), `prc-s2.4`'s 1-M1 (commit-granularity interpretation adopted, not yet operator-confirmed), and `prc-s3.2`'s 1-M1 (benefit linkage reads as performance-indirect) without further story rework before DoR sign-off.
**Alternatives considered:** Block sign-off on all 3 until each is fully resolved (rejected — none represent a defect in what will be built; each is a documented interpretation or an environment detail that can be finalized during implementation-planning without re-running `/definition` or `/review`).
**Rationale:** `prc-s1.4`'s environment ambiguity narrows naturally at `/implementation-plan` time once a concrete worktree/branch exists to test against. `prc-s2.4`'s commit-granularity interpretation (one commit per named artefact file) is already the working assumption baked into its test plan — proceeding under it is lower-risk than blocking the whole story for a granularity choice with no strong counter-argument raised. `prc-s3.2`'s linkage, while indirectly worded, protects a real requirement (standards page load time) that the story's own NFR section already covers — the finding is about prose quality, not test coverage.
**Made by:** Hamish King (Founder/Operator) + Claude (agent), via /definition-of-ready, 2026-07-14.
**Revisit trigger:** If `prc-s2.4`'s implementation reveals the adopted commit-granularity interpretation doesn't hold up in practice (e.g. autosave-style intermediate writes turn out to be unavoidable), revisit at `/verify-completion`.

---

**2026-07-14 | RISK-ACCEPT | /definition-of-ready — W4 (verification scripts unreviewed), all 14 stories**
**Decision:** Proceed to DoR sign-off across all 14 `product-repo-config` stories without a domain-expert review of any AC verification script beyond the story author (same agent that wrote the story and test plan).
**Alternatives considered:** Block all 14 stories until a second reviewer walks through each script (rejected — no second reviewer exists in this solo-operator context; blocking indefinitely on unavailable review capacity would stall the epic entirely, matching the identical W4 gap already accepted for `team-identity-roles`' Epic 3 stories earlier in this session).
**Rationale:** Matches established precedent (`bri-s3.3`'s own DoR: "Not yet done — outstanding for all 6 Epic 3 stories," accepted as a warning, not a hard block). The verification scripts remain available for the operator to review at any point before or during implementation — this RISK-ACCEPT records that sign-off proceeded without that step formally completed, not that the step is waived permanently.
**Made by:** Hamish King (Founder/Operator) + Claude (agent), via /definition-of-ready, 2026-07-14.
**Revisit trigger:** None — standing acceptance for this feature, consistent with solo-operator delivery capacity named in the feature's own Constraints section.

---

**2026-07-14 | SCOPE | /definition-of-ready — prc-s1.2 missing D37 wiring AC (H-ADAPTER)**
**Decision:** Added AC5 to `prc-s1.2`, explicitly scoping the `setRepoAdapter`/`getRepoAdapter` pair's production wiring — the story's own Architecture Constraints already named this as a D37 adapter, but the original 4 ACs never included a wiring AC. Checked all 14 stories systematically (grepped every story for "D37"/"setX"/"injectable adapter") — `prc-s1.2` is the only one that explicitly calls for a new D37-shaped adapter.
**Alternatives considered:** Let it pass since `/review` Category E didn't flag it (rejected — H-ADAPTER is a DoR-specific check that `/review`'s Category E doesn't currently cover; the gap existing past `/review` is itself worth noting as a possible `/review` skill gap, not a reason to skip fixing it now). Treat it as covered implicitly by AC1-AC4's behavioural assertions (rejected — none of AC1-AC4 test the unwired-throws case or prove two sessions resolve independently, exactly the weaker shape CLAUDE.md's D37 rule warns against).
**Rationale:** This is precisely the class of gap CLAUDE.md's D37 rule was written to prevent (source: `tir-s1`, which shipped without a wiring AC and shipped a real bug, fixed in `tir-s7`). Caught here before implementation, not after.
**Made by:** Claude (agent), via /definition-of-ready, 2026-07-14.
**Revisit trigger:** Consider proposing a `/review` skill enhancement (Category E) to check for D37-adapter mentions in Architecture Constraints without a matching wiring AC — would have caught this one turn earlier. Not filed as a formal `/improve` proposal yet; noted here for now given this session already has one open proposal pending review.

---
<!-- Add further decisions as they arise during delivery. -->
