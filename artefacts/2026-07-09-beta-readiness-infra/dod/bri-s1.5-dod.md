# Definition of Done: Create and wire the 3 initial flags across both projects

**PR:** https://github.com/heymishy/skills-repo/pull/458 | **Merged:** 2026-07-12
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.5-initial-flags-wired-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.5-initial-flags-wired-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `wizard-ui` flag correctly gates the canvas element off/on (2 integration tests) | automated test; real staging+prod project existence is **External-dependency gap, acknowledged** per DoR contract | See NFR/Coverage gap note below |
| AC2 | ✅ | `product-kanban-view` off → `handleGetProductKanban` returns not-found/disabled; on → renders normally, no redeploy | automated test | None |
| AC3 | ✅ | `org-kanban-view` on for a targeted tenant renders; other tenants (flag off) get not-found/disabled with no cross-tenant leak (IT6) | automated test | None — genuinely proves tenant-level targeting works via `isEnabled()`'s automatic `groups.tenant` derivation (see bri-s1.4-dod.md's practical-impact note) |
| AC4 (Acceptance Criterion 4) | ⚠️ | 1 static test confirms the app-side expectation that all 3 flags are referenced consistently | automated test (1 test); real comparison of both live PostHog projects' flag lists is **manual only, 🔴 highest risk, no automatable substitute**, per DoR contract | See NFR/Coverage gap note below |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md` (2026-07-09, post-review, correction):** the original brief's illustrative placeholder flag names (`model-routing-glm52`, `billing-v2`) were replaced with 2 real, already-shipped UI surfaces (`product-kanban-view`, `org-kanban-view`) so every AC is concretely testable — disclosed directly in the story file itself as a correction, not hidden.

**Disclosed and reasoned in `decisions.md` (2026-07-11, SCOPE, inner loop):** registered a live `GET /journey/wizard` route in `server.js`, wired to bri-s1.3's `handleGetWizardBootstrapped`, even though the DoR contract's touch-point list did not name `server.js`. This closes the exact revisit trigger bri-s1.3's own DESIGN decisions.md entry named ("if a future story wires a live GET route to `handleGetWizardBootstrapped`, confirm the wiring"). Also updated two pre-existing test files (`check-psh-s6-product-kanban.js`, `check-psh-s7-org-kanban.js`) to wire a default-enabled PostHog flags adapter so they continue to pass now that the handlers call `isEnabled()` before any DB query — both confirmed still passing after the change.

Does not touch this epic's declared out-of-scope items (a 4th flag, automated flag-parity checking between projects).

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (`wizard-ui` gate, 2 tests) | ✅ | ✅ | |
| AC2 (`product-kanban-view` gate) | ✅ | ✅ | |
| AC3 / IT6 (`org-kanban-view` tenant-targeted, no cross-tenant leak) | ✅ | ✅ | |
| AC4 (static flag-name reference check) | ✅ | ✅ | |
| Manual Scenario — real staging+prod project existence (AC1) | ✅ (declared) | N/A — not executed | External-dependency gap, acknowledged |
| Manual Scenario — real staging+prod flag-list mirroring (AC4) | ✅ (declared) | N/A — not executed | **External-dependency gap, 🔴 highest risk — no automatable substitute**, per the DoR contract's own explicit flag |

**Gaps (tests not implemented):** None at the automated level.

**Coverage gap audit (per DoD Step 4):**
- DoR contract quote (AC4): "Confirming all 3 flags exist by the same name in both the real staging and real prod PostHog projects... Comparing two live project's flag lists requires real PostHog dashboard/API access; explicitly named in the story's Out of Scope as 'manual verification is sufficient for MVP.'"
- Was this RISK-ACCEPTed before coding started? The story's own Out of Scope section states this explicitly, functioning as the acknowledgement — no separate formal `decisions.md` RISK-ACCEPT entry names it though.
- Was the manual verification actually executed? **No** — same as bri-s2.1/s2.2/s2.3's Fly/Neon/Upstash gaps, no evidence anywhere in the repo that Hamish has performed this comparison.
- **This is recorded as an open gap.** See Follow-up actions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| `org-kanban-view` gating must not expose org Kanban data for a non-targeted tenant, even transiently | ✅ | IT6 directly and specifically tests this — `handleGetOrgKanban` never leaks tenant-x data into tenant-y's flag-off response |
| `wizard-ui` gated element meets the same WCAG 2.1 AA bar | ✅ (structural) | No new exemption introduced by flag-gating; not independently re-audited in this DoD pass, consistent with this being a gating change, not a new UI element |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Feature flags toggle without a redeploy | ✅ (0 of 3) | Yes, at the code/mechanism level — all 3 flags are wired to real, already-shipped behaviour and pass automated tests confirming toggle-without-redeploy semantics | **Not yet independently confirmed against real, live PostHog projects** — the AC4 flag-list mirroring gap above means the metric's "100% of 3 named flags respond to a PostHog toggle" target has never been observed end-to-end against real infrastructure, only against mocked adapters |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Action required, no owner yet assigned:** perform the manual, DoR-acknowledged comparison of the staging and prod PostHog projects' flag lists to confirm all 3 flags (`wizard-ui`, `product-kanban-view`, `org-kanban-view`) exist by the same name in both — same open-action class as bri-s2.1/s2.2/s2.3's External-dependency gaps, and the highest-risk item specific to this story per its own DoR contract.
2. **Cross-reference to bri-s1.4's own DoD finding:** `org-kanban-view`'s tenant-level targeting (AC3) is genuinely proven correct by IT6, because `isEnabled()` auto-derives the `groups.tenant` context on every evaluation call regardless of whether `identifyTenantGroup()` is separately invoked (see bri-s1.4-dod.md). However, the explicit PostHog group-identify event that would populate a group record for each tenant in the PostHog dashboard is still never fired anywhere in the live app — this story depended on bri-s1.4 for tenant targeting and inherits that same open wiring gap. Not a defect in this story's own scope, but worth fixing at the same time as bri-s1.4's follow-up action, since both point at the same missing call site (`flag-bootstrap.js`).

---

## DoD Observations

1. **This story correctly closed the exact revisit trigger bri-s1.3's DESIGN decisions.md entry named** (wiring `handleGetWizardBootstrapped` to a live `GET /journey/wizard` route) — confirmed via direct code read, not just trusted from the decisions.md note. A good contrast with bri-s1.4's still-open trigger (see bri-s1.4-dod.md) — one trigger was closed by a downstream story exactly as anticipated, the other was not, illustrating that "a revisit trigger is documented" and "a revisit trigger is actually revisited" are two different things worth checking independently for each one.
2. This is the terminal story of Epic 1 — with this story's DoD marked complete, Metric 2 (feature flags toggle without a redeploy) is mechanically proven at the code level for all 3 named flags, but has never been observed against real, live PostHog infrastructure (same class of gap as Metric 3/bri-s1.2 and Metric 1/Epic 2). See the feature-level `SUMMARY.md` for the consolidated list of every External-dependency gap across all 16 stories in this sweep.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Create and wire the 3 initial flags across both projects" (bri-s1.5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the bri-s1.4 cross-reference (identifyTenantGroup never called) correctly attributed as an inherited, not newly-introduced, gap?
Report findings as HIGH / MEDIUM / LOW.
```
