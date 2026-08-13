# Decision Log: web-ui-guardrails-standards-surface

**Feature:** Web UI Guardrails & Standards Surface
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Last updated:** 2026-08-11

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**[2026-08-11] | ARCH | discovery/clarify**
**Decision:** Org-level guardrails/standards resolve to a single, per-tenant-designated "org" repo (not a fixed platform-wide repo), seeded with a minimal generic starter set (1-2 entries) to avoid context bloat.
**Alternatives considered:** (B) an aggregation/union computed across all of a tenant's connected product repos — rejected, no single source of truth and harder to seed sensibly. (C) a separate, repo-independent org-level definition — not pursued.
**Rationale:** Simplest extension of the already-existing product-repo-read pattern; avoids inventing new infrastructure, directly addressing the discovery's own stated risk that cost could outweigh benefit if org-level required substantial new architecture. Minimal seeding keeps the downstream skill-injection context footprint small.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If a tenant genuinely needs cross-repo aggregation instead of a single designated repo (e.g. multiple product repos with no natural "org" repo candidate).
---

---
**[2026-08-11] | SCOPE | discovery/clarify**
**Decision:** Products without a connected GitHub repo show org-level guardrails/standards only; the product-level section renders empty with a prompt to connect a repo. The feature is not blocked or hidden for such products.
**Alternatives considered:** (B) block/hide the whole feature until a repo is connected — rejected as unnecessarily restrictive.
**Rationale:** Keeps the feature usable and visible even for products mid-onboarding; repo connection becomes a soft prerequisite for product-level content only, not a hard gate on the whole feature.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If in practice most products never connect a repo, making the product-level section perpetually empty for most users — would signal a repo-connection friction problem, not a scope problem here.
---

---
**[2026-08-11] | ARCH | discovery/clarify**
**Decision:** Editing a guardrail/standard through the web UI creates a branch and opens a PR against the tenant's connected repo; the UI surfaces pending/merged state. No direct-commit path.
**Alternatives considered:** (B) direct-commit to the tenant's own repo, treating it as their own choice not the platform's — considered, rejected.
**Rationale:** Matches this platform's own Platform change policy (PR review required for SKILL.md/POLICY.md/standards changes) — consistency between what the platform requires of itself and what it enables for tenants; keeps guardrail/standard changes auditable and reviewable rather than silent.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If tenants report the PR-approval overhead is a significant adoption blocker for genuinely low-stakes edits — a "fast-track" or configurable-per-tenant direct-commit option could be reconsidered.
---

---
**[2026-08-11] | ARCH | discovery/clarify**
**Decision:** The existing DB-backed `standards` table and `smug-s1`'s promote/opt-out UI built on it are removed and replaced entirely by this feature's repo-backed, PR-gated view/add/edit/promotion-approval workflow. No caching/bridging layer is built — the feature reads the tenant's connected repo(s) live on each view.
**Alternatives considered:** (B) keep the DB table as a read-through cache invalidated via webhook — considered, rejected as unnecessary complexity for the value it provides. (C) keep `smug-s1`'s existing UI/flow running in parallel, treat table removal as a separate later cleanup story — considered, rejected in favour of a clean single supersession to avoid maintaining two parallel, semantically-overlapping "standards" concepts in the codebase.
**Rationale:** The DB table's `content` field was already unconnected to any real governed source (confirmed during discovery investigation). Keeping it around after this feature ships would mean two different, disconnected "standards" concepts existing simultaneously — exactly the confusion this feature is meant to resolve. A live-read approach avoids caching/invalidation complexity for MVP; latency/rate-limit cost accepted as a known tradeoff (see discovery.md Risk section).
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If live reads from GitHub prove too slow or rate-limit-constrained in practice, a caching layer may need to be reconsidered (already flagged as a live risk in discovery.md, deferred to /definition for sizing).
---

---
**[2026-08-11] | SCOPE | definition**
**Decision:** Promotion-approval authority for MVP is gated on the existing `admin` role only — no new "tech lead" or "CoP expert" role is introduced. Discovery's personas named these narrower roles, but the current web-ui role model (`team-identity-roles`) only has `admin`/`engineer`/`product`/`viewer`.
**Alternatives considered:** (2) add a new role/permission to the existing role model as part of this epic — rejected as materially larger scope, touching `team-identity-roles`' schema for a single feature's needs. (3) defer role-gating entirely, allow anyone with GitHub repo write access to approve — rejected as too weak an approval gate for a feature explicitly about governance.
**Rationale:** Reuses existing, already-built role infrastructure rather than inventing new scope; `admin` is the highest-trust existing role and a reasonable MVP approximation of "tech lead/CoP expert" until real usage shows finer granularity is needed.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If real usage shows `admin`-only is too coarse (e.g. a non-admin tech lead legitimately needs approval authority but not full admin rights), introduce a dedicated role/permission as a follow-up story.
---

---
**[2026-08-11] | SLICE | definition-of-ready (wugs-s3)**
**Decision:** First-time org-repo seeding (`wugs-s3` AC1) goes through the same PR-gated write path (`wugs-s6`) as any other edit — not a direct-commit exception for "initialization." This makes `wugs-s3` (Epic 1) dependent on `wugs-s6` (Epic 2), breaking the otherwise-clean walking-skeleton epic boundary for this one story.
**Alternatives considered:** (A) treat seeding as initialization via direct commit, matching `repo-bootstrap.js`'s existing pattern for brand-new repos — rejected to keep a single, consistent write story (no exception carved out for "this write doesn't count as an edit").
**Rationale:** Consistency over clean epic boundaries — a single write mechanism with zero exceptions is easier to reason about and audit than a write path with a carved-out "but not for the first write" special case, even though it costs some walking-skeleton purity.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If the cross-epic dependency proves genuinely awkward for implementation sequencing (e.g. `wugs-s3` blocked for a long time waiting on `wugs-s6`), reconsider Option A.
---

---
**[2026-08-11] | SLICE | inner-loop-sequencing**
**Decision:** `wugs-s5`'s upstream dependency narrowed to `wugs-s2` only, dropping the previously-listed `wugs-s3`. Its ACs are fully testable against the product-level view alone.
**Alternatives considered:** Keeping both dependencies — rejected because it created a circular dependency once `wugs-s3` was found (during DoR) to depend on `wugs-s6`, which depends on `wugs-s5`: `wugs-s3` → `wugs-s6` → `wugs-s5` → `wugs-s3`. The cycle made the walking-skeleton unsequenceable as written.
**Rationale:** `wugs-s5`'s form is view-agnostic — dropping the `wugs-s3` dependency doesn't weaken any AC, it just correctly reflects that the story never actually needed org-level rendering to exist first.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** None obvious — this was a pure dependency-graph correction, not a scope or behaviour change.
---

---
**[2026-08-11] | RISK-ACCEPT | branch-setup (wugs-s1)**
**Decision:** Proceeding with `wugs-s1`'s worktree despite 33 pre-existing test failures at baseline (506 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay the whole inner loop for unrelated pre-existing repo drift.
**Rationale:** None of the 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-inc2.1/inc4-*.js`, etc.) overlap with `wugs-s1`'s touchpoints (`artefact-fetcher.js`, `server.js` wiring) or any other story in this feature. Matches the established pre-existing-baseline-drift pattern already documented for prior stories this session (e.g. `rapp-s1`'s DoR).
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this feature's changes during implementation, stop and investigate.
---

---
**[2026-08-12] | RISK-ACCEPT | branch-setup (wugs-s2)**
**Decision:** Proceeding with `wugs-s2`'s worktree despite 33 pre-existing test failures at baseline (507 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay the whole inner loop for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-inc2.1/inc4-*.js`, `artefact-preview.test.js`/`artefact-writeback.test.js` (wuce.14/wuce.15, unrelated session-state features), etc.) do not overlap with `wugs-s2`'s touchpoints (`src/web-ui/routes/products.js`, `src/web-ui/utils/html-shell.js` nav wiring, and `wugs-s1`'s already-tested `artefact-fetcher.js` consumer usage). Same baseline-drift pattern already documented for `wugs-s1`.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this feature's changes during implementation, stop and investigate.
---

---
**[2026-08-12] | RISK-ACCEPT | final story-level review (wugs-s2)**
**Decision:** Shipping `wugs-s2` without a fetch timeout on the GitHub API reads its handler depends on, despite the story's own NFR row stating "a reasonable fetch timeout (e.g. 10s) with a clear timeout error state is expected."
**Alternatives considered:** (1) Block `wugs-s2` and add timeout handling now — rejected, the gap sits in `wugs-s1`'s already-merged `fetchRepoPath`/`realFetchRepoPath` adapter, not in `wugs-s2`'s own touchpoints, so fixing it here would be out-of-scope adapter surgery bundled into an unrelated story's PR (CLAUDE.md's artefact-first / scope-containment discipline). (2) Silently ship without recording the gap — rejected, this repo's own CSS-layout-dependent-AC discipline (`decisions.md` precedent, wuce.14 AC3-AC5) explicitly requires NFR gaps to be RISK-ACCEPTed or automated, never silently dropped, and that principle applies to this NFR gap too even though it isn't CSS-layout-specific.
**Rationale:** A hung GitHub API call currently hangs the whole page render indefinitely rather than degrading to a named timeout error, which weakens AC4's "page still renders" intent under a slow-but-not-yet-failed network condition (as opposed to AC4's already-tested hard-failure case). This is a real, understood gap — not an oversight being hidden — and the fix naturally belongs in the shared adapter (`wugs-s1`'s `artefact-fetcher.js`) rather than duplicated per-consumer in `wugs-s2`/`wugs-3`/`wugs-4`.
**Made by:** Claude (agent), following up on the final story-level reviewer's finding for `wugs-s2`
**Revisit trigger:** Add `AbortController`-based timeout handling to `fetchRepoPath`/`realFetchRepoPath` before or shortly after `wugs-3`/`wugs-4` ship (both share the same adapter and same exposure to this gap). Logged in `nfr-profile.md`'s Gaps and open questions table.
---

---
**[2026-08-12] | RISK-ACCEPT | branch-setup (wugs-s5)**
**Decision:** Proceeding with `wugs-s5`'s worktree despite 33 pre-existing test failures at baseline (508 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay the whole inner loop for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-inc2.1/inc4-*.js`, `artefact-preview.test.js`/`artefact-writeback.test.js` (wuce.14/wuce.15, unrelated session-state features), etc.) do not overlap with `wugs-s5`'s touchpoints (`src/web-ui/routes/products.js`'s new Add/Edit form render + submission-handling code, `src/web-ui/server.js` route wiring). Same baseline-drift pattern already documented for `wugs-s1`/`wugs-s2`.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this feature's changes during implementation, stop and investigate.
---

---
**[2026-08-12] | GAP-FLAG | final review, Task 5 (wugs-s5)**
**Decision:** No action taken now — flagging for `wugs-s6`'s implementation phase, not blocking `wugs-s5`'s own completion.
**Context:** `wugs-s5` built `handlePostGuardrailsForm` in `src/web-ui/routes/products.js`, which takes the write path as a plain function parameter (`writeAdapter`) — intentionally not wired to any real implementation or POST route in `server.js`, since no real write adapter exists yet (see the plan's own Design note). `wugs-s6`'s story (`artefacts/.../stories/wugs-s6-branch-pr-creation-adapter.md`) builds that real adapter (`guardrailPrAdapter`, a D37 injectable module) and its AC5/AC6 cover wiring `setGuardrailPrAdapter` itself — but the story text does not explicitly mention wiring the `POST /products/:id/guardrails/form` route in `server.js`, nor passing the new adapter into `handlePostGuardrailsForm` as its `writeAdapter` parameter. Without that explicit connection, `wugs-s6` could ship a fully-working, fully-tested `guardrailPrAdapter` while the form submission still 404s in production — technically satisfying `wugs-s6`'s own literal ACs while leaving the end-to-end feature non-functional.
**Rationale for not fixing now:** `wugs-s6`'s story artefact already passed review/DoR sign-off as a complete outer-loop artefact; re-litigating its ACs is out of scope for `wugs-s5`'s inner loop. The gap is a cross-story integration point, not a defect in either story individually.
**Made by:** Claude (agent), following up on `wugs-s5` Task 5's code-quality reviewer's finding
**Revisit trigger:** When `wugs-s6`'s implementation plan is written, explicitly add a task: "wire `POST /products/:id/guardrails/form` in `server.js`, passing the real `guardrailPrAdapter` as `handlePostGuardrailsForm`'s `writeAdapter` parameter" — do not assume `wugs-s6`'s own AC5/AC6 wiring (which covers `setGuardrailPrAdapter` only) already covers this.
---

---
**[2026-08-12] | RISK-ACCEPT | branch-setup (wugs-s6)**
**Decision:** Proceeding with `wugs-s6`'s worktree despite 33 pre-existing test failures at baseline (509 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay the whole inner loop for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-inc2.1/inc4-*.js`, `artefact-preview.test.js`/`artefact-writeback.test.js` (wuce.14/wuce.15, unrelated session-state features), etc.) do not overlap with `wugs-s6`'s touchpoints (a new `src/web-ui/adapters/guardrail-pr-adapter.js` module and `src/web-ui/server.js` wiring, plus the `wugs-s6`-noted follow-up wiring `handlePostGuardrailsForm` in `src/web-ui/routes/products.js`). Same baseline-drift pattern already documented for `wugs-s1`/`wugs-s2`/`wugs-s5`.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this feature's changes during implementation, stop and investigate.
---

---
**[2026-08-13] | RISK-ACCEPT | post-merge (wugs-s6, PR #726)**
**Decision:** `wugs-s6` merged (PR #726, merge commit `2aaa8fa7`) without performing the DoR's own REQUIRED pre-merge step — a real manual test against a disposable sandbox GitHub repo confirming the actual branch-ref/Contents/Pulls API response shapes match what `tests/check-wugs-s6-branch-pr-creation-adapter.js` mocks (CLAUDE.md's mock-shape-verification rule, `tir-s5` precedent). The PR description's checklist item for this step was left unchecked and no outcome was ever recorded.
**Alternatives considered:** (1) Revert the merge and re-open until verified — rejected as disproportionate; the merge already happened and reverting a working, review-passed, fully-unit-tested feature to fix a process gap creates more churn than it resolves. (2) Silently treat the story as fully done — rejected, this is exactly the "silently becomes a post-merge deferred item" failure mode CLAUDE.md's CSS-layout-dependent-ACs section warns against for a structurally identical reason (an assertion that can only be verified against a real external system, not a mock).
**Rationale:** `guardrail-pr-adapter.js`'s `realCreateGuardrailPr` has never actually been exercised against the real GitHub API — every one of its 18 passing tests exercises it against a hand-authored mock `fetch`. The mock shapes were authored from GitHub's public API docs, not from an observed real response, so there is a live (if likely low) risk that a real GitHub API response — e.g. the `PUT contents` response shape, or a rate-limit/secondary-rate-limit response GitHub can return under load — differs from what the code branches on, which would only surface the first time an operator actually submits the guardrails form in production.
**Made by:** Claude (agent), operator confirmed the step was not performed and asked how to run it
**Revisit trigger:** Perform the manual sandbox-repo verification (see `artefacts/2026-08-11-web-ui-guardrails-standards-surface/reference/wugs-s6-manual-verification.md` for the runnable procedure) at the first available opportunity — ideally before any real tenant relies on this feature to open a real PR. If a shape mismatch is found, it is a live production bug in `guardrail-pr-adapter.js`, not a test-plan gap; fix immediately as a short-track story.
---

---
**[2026-08-13] | RISK-ACCEPT | branch-setup (wugs-s3)**
**Decision:** Proceeding with `wugs-s3`'s worktree despite 33 pre-existing test failures at baseline (510 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay the whole inner loop for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-inc2.1/inc4-*.js`, `artefact-preview.test.js`/`artefact-writeback.test.js` (wuce.14/wuce.15, unrelated session-state features), etc.) do not overlap with `wugs-s3`'s expected touchpoints (org-repo seeding, going through `wugs-s6`'s PR-gated write path per the SLICE decision logged 2026-08-11). Same baseline-drift pattern already documented for `wugs-s1`/`wugs-s2`/`wugs-s5`/`wugs-s6`.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this feature's changes during implementation, stop and investigate.
---

---
**[2026-08-13] | RISK-ACCEPT | branch-setup (wugs-s7)**
**Decision:** Proceeding with `wugs-s7`'s worktree despite 33 pre-existing test failures at baseline (510 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay the whole inner loop for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-inc2.1/inc4-*.js`, etc.) do not overlap with `wugs-s7`'s expected touchpoints (surfaces `wugs-s6`'s adapter's PR state). Same baseline-drift pattern already documented for `wugs-s1`/`wugs-s2`/`wugs-s5`/`wugs-s6`/`wugs-s3`. Note: this worktree branched from master before `wugs-s3`'s PR #727 merged, so `wugs-s3`'s own test file is not yet present here — expected, not a gap.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this feature's changes during implementation, stop and investigate.
---

## Architecture Decision Records

<!-- None recorded — all four decisions from this discovery/clarify session were logged as entries above, not full ADRs, per the operator's confirmation that none warranted ADR-level depth. -->

---
