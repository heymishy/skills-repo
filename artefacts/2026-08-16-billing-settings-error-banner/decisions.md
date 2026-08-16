# Decision Log: billing-settings-error-banner

**Feature:** Show a visible error banner on Settings when a billing-portal redirect carries an error
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
**[2026-08-16] | DESIGN | story authoring (bse-s1) — unrecognized `error` values show no banner, not a generic fallback**
**Decision:** When `req.query.error` is present but does not match either of `bpe-s1`'s two known codes (`no_billing_account`, `billing_unavailable`), `handleGetSettings` renders no banner at all, rather than a generic "Something went wrong" fallback message.
**Alternatives considered:** (1) Show a generic fallback banner for any non-empty `error` value — rejected: a vague message tied to an action the user may not have taken (an unrecognized value could be a stray/typo'd query param, a browser history artifact, or a future error code from a not-yet-deployed change this story has no visibility into) risks being more confusing than showing nothing, and would require inventing wording not grounded in any real, currently-known failure mode. (2) Show the raw `error` value's text as the message — rejected outright on security grounds (reflected-content risk on a user-controlled query parameter — see NFR profile, Security).
**Rationale:** The story's actual scope is narrowly "make `bpe-s1`'s two known error codes visible" (per `beta-006.md`'s triage) — not "handle arbitrary error query values generically." Failing silently for anything outside that known set is strictly no worse than today's behaviour (nothing renders either way) and avoids fabricating a message for a condition this story cannot describe accurately.
**Made by:** Claude (agent), story authoring
**Revisit trigger:** If a third billing-portal error code is ever introduced upstream (in `billing.js` or elsewhere), extend the allowlist dictionary rather than adding a generic fallback.
---

---
**[2026-08-16] | ASSUMPTION | story authoring (bse-s1) — query-string parsing follows the codebase's existing `req.query` convention, not a new `req.url` parser**
**Decision:** `beta-006.md`'s triage described the root cause as "`handleGetSettings` never parses `req.url`'s query string" and suggested the fix in those terms. Before implementing, the actual established convention across this codebase's other route handlers was checked directly (`grep -n "req.query" src/web-ui/routes/*.js` and a read of `src/web-ui/server.js`): the router already parses the URL's query string into `req.query` before any handler runs (`server.js:1913`, `req.query = parseQuery(parsed.searchParams);`), and every other handler that needs a query parameter reads `req.query.X` (`billing.js:219`, `products.js:1334`, `journey.js:3130`, `account-linking.js:106`, and others). This story implements the fix as `req.query && req.query.error`, matching that established convention, rather than hand-rolling a second `req.url`/`URLSearchParams` parser inside `settings.js` as `beta-006.md`'s literal wording might suggest.
**Alternatives considered:** Parse `req.url` directly inside `settings.js` (matching `beta-006.md`'s literal description) — rejected: this codebase already has a working, tested, universally-used query-parsing layer at the router level; adding a second, file-local parsing mechanism would be an inconsistent pattern with no benefit.
**Rationale:** `beta-006.md`'s grep-based root-cause description (`req.url`/`URLSearchParams`/`query` all absent from the handler) was accurate as a diagnosis of the symptom (no query parsing of any kind occurs) but was not a prescription for which parsing mechanism to add. Verifying against the actual codebase convention before implementing avoids introducing an inconsistent second pattern.
**Made by:** Claude (agent), via direct grep/read verification before writing the story
**Revisit trigger:** None — this is a closed, evidence-based implementation choice.
---

---
**[2026-08-16] | ASSUMPTION | definition-of-ready (H-GOV, bse-s1)**
**Decision:** H-GOV (governance approval check, reads `## Approved By` from a discovery artefact) is treated as not applicable for this story. This feature has no `discovery.md` at all — short-track explicitly skips discovery per `CLAUDE.md`'s documented short-track path, matching the precedent already established by `tmss-s1`, `pcr-s1`, `nia-s1`, and `bcf-s1`, all of which reached DoR sign-off (or DoD-complete, for `pcr-s1`) with no discovery artefact and no H-GOV check performed.
**Alternatives considered:** Re-derive the H-GOV reasoning from scratch — rejected per this repo's own instruction to cite prior precedent directly rather than re-deriving; the underlying facts (short-track has no discovery.md by design) are identical to the prior cases.
**Rationale:** The operator (sole platform owner) is directly requesting and reviewing this work in-session, which is the practical equivalent of approval in a solo-operator context — same reasoning already logged by `tmss-s1`/`nia-s1`/`bcf-s1`.
**Made by:** Claude (agent), citing `bcf-s1`'s `decisions.md` entry (2026-08-16) as direct precedent
**Revisit trigger:** If `/definition-of-ready`'s own SKILL.md is ever updated to explicitly define short-track H-GOV behaviour, defer to that instead of this precedent-based interpretation.
---

---
**[2026-08-16] | RISK-ACCEPT | definition-of-ready (W4, bse-s1)**
**Decision:** Proceeding with DoR sign-off on `bse-s1` despite W4 (verification script reviewed by a domain expert) not being independently satisfied — the verification script exists and is complete, but no separate domain expert has reviewed it ahead of implementation.
**Alternatives considered:** Pause DoR sign-off until a separate reviewer walks the script — deferred for the same practical reason applied consistently across this repo's other recent short-track features (`tmss-s1`, `nia-s1`, `bpe-s1`, `bcf-s1`): solo-operator repo, no separate domain-expert role available.
**Rationale:** The verification script was written directly from this story's own reviewed ACs; unlike `nia-s1`'s AC3, this story has no CSS-layout-dependent gap for the script to be the sole safety net for — all 4 ACs are already fully covered by automated tests, so the verification script here is a defense-in-depth smoke check, not the only verification path for any AC.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If this feature ever has a genuinely separate domain-expert reviewer available, use them for W4 satisfaction on future stories rather than accepting this gap by default.
---

---
**[2026-08-16] | RISK-ACCEPT | branch-setup (bse-s1)**
**Decision:** Proceeding with `bse-s1`'s worktree despite 33 pre-existing test failures at baseline (526 files run via `npm test` in `.worktrees/bse-s1`, 33 failed, exit code 1, 509560ms).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this bounded bug fix and would delay it for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`scripts/check-pipeline-state-integrity.js`, `tests/artefact-preview.test.js`, `tests/artefact-writeback.test.js`, `tests/check-bee3-posthog.js`, `tests/check-i1.2/i3.1/i3.2/i3.3-*.js`, `tests/check-ilc2-agent-selfrecord.js`, `tests/check-inc2.1/inc4-*.js`, `tests/check-iwu2-right-panel-layout.js`, `tests/check-mfc1/mfc2-*.js`, `tests/check-ougl1-6-*.js`, `tests/check-p11-hgov.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-decision.js`, `tests/check-rb-s5-optional-outer-loop-install.js`, `tests/check-s0.2-tenant-login-fallback.js`, `tests/check-sec3-return-to.js`, `tests/check-sec5-session-rotation.js`, `tests/check-srt1-status-report-template.js`, `tests/check-wsm2-collaborative-sessions.js`, `tests/check-wuce24-guided-question-form.js`, `tests/check-wuce3-attributed-signoff.js`, `tests/check-wuce4-docker-deployment.js`, `tests/check-wucp1-context-autoloader.js`) are byte-for-byte the identical 33-file list already independently verified earlier the same day by `bcf-s1`'s own branch-setup RISK-ACCEPT entry (526 files, 33 failed) — confirming this is a stable, pre-existing repo-wide baseline, not something newly introduced. None overlap with `bse-s1`'s expected touchpoints (`src/web-ui/routes/settings.js`, a new `tests/check-bse-s1-billing-settings-error-banner.js` file) — confirmed via direct grep of the failed-file list for "settings"/"billing"/"bse-s1", zero matches.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this story's changes during implementation, stop and investigate.
---

---
**[2026-08-16] | CORRECTION | implementation (bse-s1) — removed `src/web-ui/routes/settings.js` from `npwe-s1`'s scope-freeze guard**
**Decision:** After implementing `bse-s1`'s change to `settings.js`, the post-implementation full-suite run showed a genuine new failure (34 failed vs. the branch-setup baseline's 33) — not a pre-existing/unrelated failure. Root-caused by direct inspection: `tests/check-npwe-s1-skills-nav-wiring.js`'s `IT2.1` asserts a list of 6 "excluded" route files (including `src/web-ui/routes/settings.js`) are byte-for-byte identical to `origin/master`, as a point-in-time scope-proof that `npwe-s1`'s own nav-wiring story didn't touch them. The test file's own existing comment already documents the exact precedent for this situation: `avpf-s1` legitimately modified `routes/artefact.js` for an unrelated fix and removed it from this same list rather than leaving a permanent false freeze. Applied the identical fix: removed `src/web-ui/routes/settings.js` from `EXCLUDED_FILES` in `tests/check-npwe-s1-skills-nav-wiring.js`, with a comment citing this decision and confirming `IT2.2`/`IT2.3` (the determinism and "no Products section" checks against the live `renderSettingsPage` output) still hold unmodified — only the byte-identical-to-master freeze no longer applies, for the same reason it stopped applying to `routes/artefact.js`.
**Alternatives considered:** (1) Revert `bse-s1`'s change to avoid touching the guarded file — rejected: this story's entire purpose is a small, legitimate, unrelated change to `settings.js`; the guard was never meant to be a permanent freeze (its own comment says so). (2) Leave the guard failing and document it as a new pre-existing-style RISK-ACCEPT — rejected: the guard's own file already establishes the correct resolution mechanism (remove the entry, don't just accept the failure), so following that precedent is more correct than inventing a new RISK-ACCEPT for a problem with an established fix.
**Rationale:** `npwe-s1`'s guard test explicitly designed for this exact scenario (an unrelated future story legitimately touching one of the 6 listed files) and left a working example of the correct resolution in its own code comments. Following that precedent exactly is the minimal, correct fix-forward — not scope creep.
**Made by:** Claude (agent), via direct root-cause investigation of the new post-implementation failure (comparing against baseline) before assuming it was unrelated, per CLAUDE.md's explicit instruction not to assume a CI/test failure is pre-existing without checking the exact violation against this story's own changes.
**Revisit trigger:** None — this is a closed, evidence-based fix mirroring an already-established precedent in the same file.
---

---
**[2026-08-16] | RISK-ACCEPT | post-implementation full-suite comparison (bse-s1)**
**Decision:** After implementing the fix (`src/web-ui/routes/settings.js` wiring, `tests/check-bse-s1-billing-settings-error-banner.js`, and the `npwe-s1` guard-list CORRECTION above), the full suite shows 527 files run (526 baseline + 1 new file), 33 failed — the exact same count as the branch-setup baseline, and the failed-file list is byte-for-byte identical to the baseline list. Zero new failures, zero resolved failures beyond the one CORRECTION already logged above. The new `tests/check-bse-s1-billing-settings-error-banner.js` passes cleanly (7/7) and is correctly absent from the failed-file list; `tests/check-npwe-s1-skills-nav-wiring.js` (21/21) and the other `settings.js`-touching suites (`check-c1`, `check-c2-billing-tab.js`, `check-c3-credits-tab-restyle.js`, `check-d2-banner-exit-permission-visibility.js`, `check-d3-impersonation-audit-log.js`, `check-d4-nfr-security-review-and-hardening.js`) were spot-checked individually and all pass in full.
**Alternatives considered:** None needed — this is a clean, zero-regression result requiring no further action beyond the one CORRECTION already made and logged.
**Rationale:** The only requirement for this story's regression gate is "no NEW failure beyond baseline, and any genuinely new failure is root-caused (not assumed pre-existing) before being resolved." Both conditions are met: the one new failure that did appear was investigated, correctly attributed to a scope-freeze guard with its own documented precedent for this exact situation, and fixed accordingly — not waved through as "probably unrelated."
**Made by:** Claude (agent), via direct diff of the baseline (526 files, 33 failed) and post-implementation (527 files, 33 failed) failed-file lists, byte-for-byte identical
**Revisit trigger:** None — informational only.
---

