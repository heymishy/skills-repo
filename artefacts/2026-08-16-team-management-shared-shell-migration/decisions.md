# Decision Log: team-management-shared-shell-migration

**Feature:** Migrate team-management admin pages onto the shared HTML shell
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-16

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
**[2026-08-16] | RISK-ACCEPT | definition-of-ready (W4, tmss-s1)**
**Decision:** Proceeding with DoR sign-off on `tmss-s1` despite W4 (verification script reviewed by a domain expert) not being independently satisfied — the verification script exists and is complete, but no separate domain expert has reviewed it ahead of implementation.
**Alternatives considered:** Pause DoR sign-off until a separate reviewer walks the script — the more thorough option, deferred for the same practical reason applied consistently across this session's other features (`wuce-self-serve-invites`, `web-ui-guardrails-standards-surface`): solo-operator repo, no separate domain-expert role available.
**Rationale:** The verification script was written directly from this story's own reviewed ACs; post-merge smoke testing (the script's own second intended use) remains the real verification checkpoint. This story's scope is additionally low-risk — a mechanical swap to an already-proven, already-used-elsewhere shared function, not novel logic.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If this feature ever has a genuinely separate domain-expert reviewer available, use them for W4 satisfaction on future stories rather than accepting this gap by default.
---

---
**[2026-08-16] | ASSUMPTION | definition-of-ready (H-GOV, tmss-s1)**
**Decision:** H-GOV (governance approval check, reads `## Approved By` from a discovery artefact) is treated as not applicable for this story. This feature has no `discovery.md` at all — short-track explicitly skips discovery per `CLAUDE.md`'s documented short-track path (`/test-plan → /definition-of-ready → coding agent`), matching the precedent already established by `pcr-s1` (`2026-07-11-pipeline-conflict-reduction`), which also reached DoD-complete with no discovery artefact and no H-GOV check performed.
**Alternatives considered:** (1) Block DoR sign-off until a discovery artefact is authored retroactively — rejected, would defeat the purpose of the short-track path, which exists precisely to avoid the full outer-loop chain for bounded refactors. (2) Treat H-GOV as an automatic FAIL for any feature with no discovery.md — rejected, this would make short-track structurally impossible to ever pass DoR, which is inconsistent with `pcr-s1`'s real, already-shipped precedent.
**Rationale:** H-GOV's own detail section only defines behaviour for a discovery artefact that exists but has an empty/missing/engineer-only `Approved By` section — it does not define behaviour for "no discovery artefact exists because this is short-track by design." The operator (sole platform owner) is directly requesting and reviewing this work in-session, which is the practical equivalent of approval in a solo-operator context, matching this session's own repeated W4 reasoning.
**Made by:** Hamish King — Platform owner (requested the work directly); Claude (agent) identified and applied the precedent
**Revisit trigger:** If `/definition-of-ready`'s own SKILL.md is ever updated to explicitly define short-track H-GOV behaviour, defer to that instead of this precedent-based interpretation.
---

---
**[2026-08-16] | RISK-ACCEPT | branch-setup (tmss-s1)**
**Decision:** Proceeding with `tmss-s1`'s worktree despite 33 pre-existing test failures at baseline (522 files run via `npm test`, 33 failed, exit code 0).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this feature and would delay this bounded refactor for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`check-bee3-posthog.js`, `check-mfc1/mfc2-*.js`, `check-ougl*.js`, `check-i*.js`, etc.) exactly match the same baseline already independently verified multiple times this session (e.g. `wuce-self-serve-invites`'s `wsi-s1` decisions.md, which did a byte-for-byte diff confirming this exact file list is pre-existing, unrelated repo drift). None overlap with `tmss-s1`'s expected touchpoints (`src/web-ui/routes/team-management.js`, a new `tests/check-tmss-s1-*.js` file).
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this story's changes during implementation, stop and investigate.
---

---
**[2026-08-16] | CORRECTION | implementation-plan authoring, tmss-s1 (pre-Task-1)**
**Decision:** The test plan's AC3 test design (`teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegressions`) proposed proving the `_escapeHtml`→`escHtml()` swap has no regression by crafting a `"`-containing CSRF token and checking it renders as `&quot;`. This is wrong: `middleware/csrf.js`'s `csrfField()` already calls its own internal `_escapeHtml` on the token independently (`csrfField(token) { return '...' + _escapeHtml(token) + '...'; }`) — the CSRF field's escaping is entirely unrelated to `team-management.js`'s own escaping function, so that test would pass identically whether or not `team-management.js`'s swap was done correctly (or done at all). It tests the wrong function. Corrected: `team-management.js`'s `_escapeHtml`/`escHtml` calls only ever wrap `VALID_ROLES` values when building `<option>` tags — a real behavioural test must exercise that actual call site, not a proxy. Since `VALID_ROLES` (`modules/team-management.js`) is a plain, non-frozen, directly-exported array, the corrected test temporarily pushes a crafted value (e.g. `'<script>bad</script>'`) into it, calls the handler, asserts the rendered `<option value="...">` is HTML-escaped, then splices the array back to its original contents (test cleanup) so no other test sees the mutation.
**Alternatives considered:** (1) Keep the CSRF-token-based test as originally planned — rejected, it is a tautological test that cannot fail even if the refactor is done wrong. (2) Only source-scan for `_escapeHtml`'s absence, with no behavioural proof — rejected, this proves the old function is gone but not that the replacement (`escHtml`) is actually being called at the real site, which is the part that matters for a genuine no-regression guarantee.
**Rationale:** Caught during implementation-plan authoring by re-deriving the real call sites in `team-management.js` and cross-checking `csrf.js`'s own escaping behaviour directly, rather than trusting the test-plan's own text — the same "read real code before planning" discipline already logged as a proposal candidate for `/implementation-plan` in `wuce-self-serve-invites`'s `/improve` pass.
**Made by:** Claude (agent), via direct source reading of `middleware/csrf.js` and `modules/team-management.js` before finalizing the implementation plan
**Revisit trigger:** None — this is now the corrected, locked-in test design for AC3.
---

---
**[2026-08-16] | CORRECTION | Task 2 execution, tmss-s1 (post-implementation, pre-commit)**
**Decision:** Migrating `handleGetCreateInviteForm` to `renderShell()` broke `wsi-s6`'s own existing test (`tests/check-wsi-s6-invite-creation-ui.js`, AC4) — its assertion `!/<div[^>]*onclick/.test(html)` scanned the WHOLE rendered page for a div-with-onclick masquerading as the submit control, and `renderShell()` legitimately adds one, unrelated to the form (`<div class="sw-overlay" id="sw-overlay" onclick="swCloseSidebar()">`, the mobile sidebar dismissal overlay). Fixed by scoping the check to the `<form>...</form>` block only, matching the assertion's own actual intent (no styled div/anchor faking the submit button INSIDE the form) rather than the whole page. This is the 5th live instance of this session's recurring shared-dependency-check-gap pattern (see `wuce-self-serve-invites`'s `/improve` pass, which already logged 4 instances and a consolidated `/implementation-plan` proposal for a "list every OTHER story's test file that depends on this shared thing" step) — caught here specifically BECAUSE this story ran the full suite after every task, per its own implementation plan, not because any planning step anticipated it.
**Alternatives considered:** (1) Leave `wsi-s6`'s test broken and note it as a known gap — rejected, violates this story's own NFR (no regressions) and the branch-setup baseline comparison this story is explicitly using as its safety net. (2) Revert `handleGetCreateInviteForm`'s migration to avoid touching `wsi-s6`'s test at all — rejected, would defeat this story's entire purpose (AC2 requires exactly this migration).
**Rationale:** The fix is narrow (test-only, one file, no production code change) and makes the test MORE correct, not just unblocked — a whole-page scan for "no div with onclick anywhere" was always fragile the moment the page gained any other legitimate interactive element, which was inevitable once a shared, richer shell was introduced.
**Made by:** Claude (agent), found via this story's own "run full suite after every task" discipline
**Revisit trigger:** None — this is now the corrected, locked-in assertion shape for `wsi-s6`'s AC4 test.
---

## Architecture Decision Records

<!-- None recorded yet. -->

---
