# Definition of Done: Dismiss / mark-reviewed for the signals panel

**PR:** https://github.com/heymishy/skills-repo/pull/942 | **Merged:** 2026-10-05
**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
**Test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s4-test-plan.md
**DoR artefact:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s4-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — dismissing a signal removes it from the default view, keyed by a derived stable key (never `signal.id`) | ✅ | `deriveDismissKey` hashes `source`+`type`+`text` (sha256, NUL-separated); unit + real route-dispatch test. **Live-confirmed at `/verify-completion` (2026-10-05)**: clicked "Dismiss" on a real signal in a running local dev server with the real D37-wired adapter — the signal genuinely vanished from the default view after a real POST + redirect | `integration-real-code` + live local browser confirmation | None |
| AC2 — dismissal survives a reload and a new session, read from `workspace/dismissed-signals.json`, not in-memory/per-session state | ✅ | Dedicated test constructs two independent `createFsDismissedSignalsStoreAdapter` instances against the same real temp file; the second instance (simulating a new session) correctly reports the key as dismissed | `integration-real-code` (real fs I/O, not mocked) | None |
| AC3 — reversible via a "show dismissed" toggle; dismissed signals reappear, visibly marked, with an Undismiss action | ✅ | Real route-dispatch test (dismiss → `GET ?showDismissed=true` → undismiss → default view). **Live-confirmed**: clicked "Show dismissed," saw the real signal with a "✓ Dismissed" text marker (not colour alone) and a working "Undismiss" button; clicking it genuinely restored the signal to the default view | `integration-real-code` + live local browser confirmation | None |
| AC4 — two distinct signals never collide on the derived key | ✅ | Dedicated test: two signals with different `source`+`type`+`text` produce two different, individually-correct dismiss outcomes — not just "a hash function was called." (This AC's own real-world collision risk was taken seriously mid-implementation: the key separator was redesigned from a plain space to `String.fromCharCode(0)` specifically because a printable separator can itself cause two different field combinations to join into the same string — see DoD Observations.) | `integration-real-code` (real hash function, real differentiated outcomes) | None |
| AC5 — the dismissed-signals adapter is wired to a real implementation in `server.js`, verified by a behavioural test (D37) | ✅ | Dedicated test wires the real `createFsDismissedSignalsStoreAdapter` (not a test override) through the real route handlers and asserts two distinct keys produce two distinct, correct outcomes — exactly D37 rule 4's own bar ("behavioural correctness," not "a setter was called"). **Live-confirmed**: the real production server startup log showed `[sptu-s4] dismissed-signals-store file-backed adapter wired`, and a real dismiss/undismiss cycle was performed against that live-wired adapter | `integration-real-code` + live production-wiring confirmation | None |
| AC6 — Dismiss/Undismiss controls are keyboard-accessible | ✅ | Unit test confirms plain `<button>`/`<form>` elements, no `tabindex` override. **This AC's live-evidence gap was explicitly closed at `/verify-completion`** (not deferred as DOM-structure-only evidence, per this feature's own `res-s4` anti-pattern precedent): a real 34-step keyboard Tab-walk from page top, using `read_page` to confirm the exact DOM tab-order position, reached a visible focus ring on a real "Dismiss" button; pressing Enter then performed a genuine keyboard-driven dismiss (the page reloaded with the signal removed) | `unit` + `integration-real-code` (live local keyboard-Tab-walk + Enter-activation check) | None |
| AC7 — a corrupt or missing `dismissed-signals.json` degrades gracefully (never a 500) | ✅ | Store-level unit test (missing file, invalid JSON, and — added after a code-quality review found the branch untested — valid-JSON-but-not-an-array, all three return `false`/empty rather than throwing) + route-level integration test (corrupt file → `GET /signals` still returns 200, signal renders normally) | `integration-real-code` | None |
| CSRF (closes review finding 1-M1) | ✅ | Both `POST /signals/dismiss` and `POST /signals/undismiss` call `_csrf.csrfGuard(req, res)` before touching the request body. Dedicated tests: missing/invalid token → 403, signal NOT dismissed; valid token → 200-class response, signal dismissed | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The story's own Out of Scope items (bulk dismiss/multi-select, multi-tenant isolation, auto-expiring dismissals, migration/backfill of prior dismiss-state) were not implemented — confirmed by reviewing the merged diff and by an explicit grep for those terms across the touched files during `/verify-completion`'s own final review, finding no matches.

---

## Test Plan Coverage

**Tests from plan implemented:** 14 / 14
**Tests passing in CI:** 14 / 14 (plus full suite 715/715, confirmed independently at least three times across implementation)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| dismiss/isDismissed isolation (AC1) | ✅ | ✅ | |
| undismiss isolation, only the target key (AC3) | ✅ | ✅ | |
| Two-signal collision/differentiation (AC4) | ✅ | ✅ | |
| Missing/corrupt/wrong-shape file → empty dismissed-set (AC7, unit) | ✅ | ✅ | Wrong-shape case added mid-review after a genuine coverage gap was found |
| NFR-Security: persisted file stores only hashes, never raw content | ✅ | ✅ | |
| Cross-instance real-file persistence (AC2) | ✅ | ✅ | |
| Dismiss/Undismiss controls render with no tabindex override (AC6, unit) | ✅ | ✅ | |
| Real route dispatch: dismiss removes signal from next GET (AC1) | ✅ | ✅ | |
| Real route dispatch: show-dismissed + undismiss round-trip (AC3) | ✅ | ✅ | |
| Real route dispatch: real wired adapter differentiates two keys (AC5, D37) | ✅ | ✅ | |
| Real route dispatch: missing/invalid CSRF rejected (1-M1) | ✅ | ✅ | |
| Real route dispatch: valid CSRF succeeds (1-M1) | ✅ | ✅ | |
| Real route dispatch: corrupt file degrades gracefully (AC7, integration) | ✅ | ✅ | |
| NFR-Performance: dismissed-set lookup within <100ms budget | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (Step 4):** No AC in this story was classified `CSS-layout-dependent` at `/test-plan` (confirmed in the test plan's own Step 3a note — Dismiss/Undismiss controls are plain form buttons, DOM-structure assertions suffice for the automated suite). No RISK-ACCEPT was required at that gate. The *separate* UI-evidence gate (for AC1/AC3/AC6's real-world browser-operability claims) was closed directly at `/verify-completion` via real live browser checks — not via RISK-ACCEPT.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — dismissed-set lookup within <100ms budget (5,340-item array, 500-key dismissed set) | ✅ | Dedicated NFR test, `process.hrtime.bigint()` timing with a warm-up pass, passing |
| Security — no new attack surface; `workspace/dismissed-signals.json` stores only derived hashes | ✅ | Dedicated test asserts the persisted file contains only hash strings, never raw signal content. **Additionally**, a mid-implementation security review found and closed two real gaps beyond the story's own stated NFR: the redirect target (`returnTo`) had no boundary check and could hang a connection on CRLF injection (`ERR_INVALID_CHAR` uncaught) — both hardened (boundary validation, CRLF rejection, try/catch fallback), independently re-verified | `integration-real-code` + dedicated security-hardening fix, re-reviewed |
| Accessibility — keyboard-operable Dismiss/Undismiss controls | ✅ | AC6 unit test + live keyboard-Tab-walk + Enter-activation check (above) |
| Resilience — graceful handling of missing/corrupt state file | ✅ | AC7 unit + integration tests |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time-to-triage | ❌ | Not yet | Requires the full filter→sort→dismiss×10 flow; `sptu-s3` (sort) is merged-code-complete but its PR (#941) is not yet merged as of this DoD |
| Metric 3 — Dismiss retention | ✅ | Now | `sptu-s4` is the sole contributing story |

**Metric 1 — Signal: not-yet-measured**
**Evidence note:** `sptu-s1` and `sptu-s2` are merged; `sptu-s3`'s code is complete and verified but its PR is still open (not yet merged) as of this DoD. The full timed flow cannot be measured until all four stories are merged.
**Date measured:** null

**Metric 3 — Signal: on-track**
**Evidence:** Baseline was 0% (no dismiss mechanism existed before this story). Real, live-verified behaviour confirmed at `/verify-completion`: a signal dismissed via a real POST request stayed dismissed across the page's own re-render (the functional equivalent of a reload, since the dismiss-state read is file-backed, not session-scoped — confirmed directly by the dedicated cross-instance-persistence test, which is the automated proxy for "a new session" that this feature's own solo-operator, single-browser-session context makes practical to verify). This meets the metric's own target (100% of dismissed signals stay dismissed) on every real check performed — no partial-retention result observed.
**Date measured:** 2026-10-05

---

## Outcome

**COMPLETE**

**Follow-up actions:** None for this story. (Standing, feature-level: Metric 1 remains `not-yet-measured` pending `sptu-s3`'s PR #941 merge — not a follow-up on `sptu-s4` itself, just a cross-story dependency to note for whoever next runs DoD on this feature.)

---

## DoD Observations

1. **A tooling/environment bug corrupted a ` ` escape sequence into a raw NUL byte inside the implementation plan itself**, caught only because a spec-compliance reviewer did a byte-level diff rather than trusting a visual read. The fix (redesigning the key separator as `String.fromCharCode(0)`, which contains no backslash-escape text to mangle) is more robust than the original design, not just a workaround — worth flagging as a real `/improve` candidate: any future plan/code containing a literal ` `-style escape sequence in a Write/Edit tool call should be treated as at-risk until independently byte-verified after writing.
2. **Extending an existing, already-shipped handler (`handleGetSignalsPanelHtml`) with a new hard dependency silently broke two previously-green, unrelated test suites** (`ep2-s1`, `sptu-s2`) that had no reason to know about the new dismiss-store adapter. This is a real, generalizable risk pattern for this codebase: any story that adds a new D37-throws-when-unwired dependency to a shared, widely-called handler must explicitly consider every existing caller of that handler, not just the new story's own test file. The fix (scoped try/catch, fail-open to "nothing dismissed") is a reasonable general pattern worth naming explicitly in `.github/architecture-guardrails.md` if this recurs a second time.
3. **A genuinely unrelated, pre-existing governance gap on `master`** (another concurrent session's in-progress feature, `2026-10-05-customer-journey-as-first-class`, missing required `pipeline-state.json` schema fields and a still-Draft `discovery.md`) caused `#942`'s own CI "Validate traceability chain" check to fail — not because of anything in this story's diff. Per the operator's explicit direction, the missing schema fields (`name`, `track`, `health`, `stage`) were patched with honest, conservative values without touching that feature's own content or discovery status. This was NOT a one-shot fix: `gh run rerun` on the original failed CI run reused the stale pre-fix checkout rather than recomputing against current master, requiring two separate "merge current master into the feature branch and push" cycles to get CI to actually re-evaluate against the fixed state. Worth a standing `/improve` note: `gh run rerun` is not a reliable way to re-validate a PR against a since-fixed base-branch problem; a fresh push (even a no-op merge) is required.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Dismiss / mark-reviewed for the signals panel" (sptu-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
