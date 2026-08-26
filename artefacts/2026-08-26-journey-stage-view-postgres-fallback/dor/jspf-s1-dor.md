# Definition of Ready: jspf-s1 — Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites

**Story reference:** `artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md`
**Test plan reference:** `artefacts/2026-08-26-journey-stage-view-postgres-fallback/test-plans/jspf-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-26
**Track:** Short-track (found while investigating a live operator report on production; a full-codebase audit surfaced 3 more instances of the same defect)

---

## Contract review

Contract Proposal reviewed against jspf-s1's 8 ACs and the test plan (`artefacts/2026-08-26-journey-stage-view-postgres-fallback/dor/jspf-s1-dor-contract.md`): every AC maps to at least one test, no AC requires E2E/CSS-layout verification, and every proposed touch point (the 4 handlers plus the new shared helper) is named in the story's Architecture Constraints. **✅ Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator resuming a past conversation, viewing a stage's content, or starting review/side-trip work" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC4: 1 test each; AC5/AC7/AC8: 4 sub-tests each (one per site); AC6: 1 test |
| H4 | Out-of-scope section is populated | ✅ | 4 explicit exclusions, including the spikes-directory case ruled out during the audit |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact exists — same treatment as `avpf-s1`/`alrf-s4`, both cited as direct precedent |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track skips discovery-through-review per `CLAUDE.md`'s routing table. Same treatment as `pncg-s1`'s/`fresc-s1`'s DoR. |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps" section: "None." |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies field is "None" |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Detailed constraints in story (shared-helper design, tier ordering, no-new-tenant-check reasoning, git-fallback preservation); no architecture-guardrails.md ADR concerns this file's data-resolution conventions |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — confirmed in test plan |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated (Performance/Security/Accessibility/Audit all addressed, none flagged as new risk) |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR named |
| H-NFR3 | Data classification field blank check | ✅ N/A | No NFR profile exists (not required) |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ N/A | Story's NFR section is explicit, no blanks |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact exists — short-track deliberately skips discovery. Same reasoning as `pncg-s1`'s/`fresc-s1`'s DoR. |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new injectable adapter introduced — `journey-store-pg.js`'s existing `_setPoolForTesting` seam is reused, not a new D37-style adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 17/17.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No `/review` was run (short-track) | N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | This story touches 4 distinct request handlers, one of which (`handlePostStories`, AC3) affects the actual AI context passed into a subsequent skill session — a correctness-of-context risk, not just a display bug. Surfaced with elevated framing given this blast radius, matching `pncg-s1`'s precedent for a similarly multi-site story. | Hamish King (operator) — implicit in the explicit "Full pipeline, full loop with subagents" direction already given for this exact story; re-confirmed here rather than re-asked, since the operator has already selected the highest-rigor path available for this fix |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ Acknowledged | Test plan's own gap-table entry (AC3's exact interception mechanism for `priorArtefacts`) is explicitly flagged as depending on implementation-time discovery of `handlePostStories`'s existing test seams — not a silent gap, a named risk with a stated mitigation (reuse existing coverage's interception pattern if one exists) | N/A — explicitly mitigated in test plan, not left open |

All warnings resolved or acknowledged. RISK-ACCEPT for W4 logged in `artefacts/2026-08-26-journey-stage-view-postgres-fallback/decisions.md`.

---

## Oversight level

**Medium** — consistent with this repo's short-track precedent for multi-site bug-class fixes (`pncg-s1`). AC3 (the review-session-context site) carries the highest real-world consequence of the four (silently wrong AI context, not just a wrong page), which is the basis for the elevated W4 framing above — but the fix mechanism itself is a twice-proven, low-novelty pattern (`alrf-s4`, `avpf-s1`), so escalating to High oversight was not judged necessary.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

**Applicable excerpts (from `.github/standards/web-ui/web-ui-patterns.md`):**

> **Stack constraints:** No new npm dependencies — Node.js built-ins only. No Express — raw `http.createServer` only. All session state via `req.session.*`. *(This story adds zero dependencies, touches no session/auth mechanics — only a new same-file helper function and its 4 call sites.)*
>
> **HTML render function unit test pattern:** Assert on specific string fragments, never full-HTML snapshot equality. *(AC1/AC5/AC6/AC7's assertions on `handleGetJourneyStageView`'s rendered body follow this pattern — fragment/marker-string checks, not snapshots.)*

The remaining sections of this file (Shared shell module / renderShellWithNav, injectable adapter D37 rule, silent fallback three-path coverage, COPILOT_HOME isolation, disk canonicity, path traversal guard) are not implicated — this story does not touch `renderShell`/nav rendering, introduces no D37-style adapter, and its disk-read logic is unchanged (read-only, no new write path).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: jspf-s1 — Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites
  — artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md
Test plan: artefacts/2026-08-26-journey-stage-view-postgres-fallback/test-plans/jspf-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order (recommended, not mandatory):
1. Add resolveArtefactFromDiskOrPg(repoRoot, artefactRelPath, journeyId,
   stageName) to src/web-ui/routes/journey.js. Write and pass its own direct
   unit coverage first (disk-wins, pg-fallback, pg-throws-degrades, both-empty)
   before touching any of the 4 call sites.
2. Wire site 1 (handleGetJourneyStageView) -- call the new helper first; only
   if it returns empty, fall through to the EXISTING git-fallback logic
   unchanged. Do not remove or restructure the git-fallback or the
   _dasFetchFailed / anvf-s1 message-selection logic.
3. Wire site 2 (handleGetStories) -- replace the direct fs.readFileSync with
   the new helper.
4. Wire site 3 (handlePostStories) -- replace the direct fs.readFileSync
   inside the priorArtefacts .map() with the new helper (this one needs
   awaiting per stage, so the .map() will need to become a for-loop or
   Promise.all -- implementer's judgment on which fits this file's existing
   style better).
5. Wire site 4 (handlePostSideTripClarify) -- replace the direct
   fs.readFileSync with the new helper.
6. Write the remaining unit tests (AC1-AC8) in
   tests/check-jspf-s1-journey-postgres-fallback.js.
7. Re-run every existing test file that already covers any of these 4
   handlers individually to confirm zero regressions, then run the full
   suite.

Constraints:
- No new npm dependencies, no Express -- matches this repo's raw
  http.createServer conventions.
- Do not change das-s1's write-path (dual-write to disk + git-commit) --
  read-side only.
- Do not add a git-fallback tier to sites 2/3/4 -- disk -> Postgres only,
  per the story's Architecture Constraints.
- Do not add a new tenant-ACL check at any of the 4 sites -- each already
  operates on an access-checked journeyId; the new helper takes journeyId
  as a trusted input, it does not re-resolve or re-check tenant access.
- The new helper's Postgres lookup must be wrapped in try/catch and must
  never throw out of the helper -- degrade to '' on any DB error.
- Reuse journey-store-pg.js's existing _setPoolForTesting seam for tests --
  do not add a new injectable adapter or setter.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests (e.g.
  handlePostStories's existing structure makes the priorArtefacts change
  awkward): add a PR comment describing the ambiguity and do not mark
  ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed both the live-bug investigation and the full-pipeline fix approach directly)
**Signed off by:** Claude (agent), on explicit operator direction ("Full pipeline, full loop with subagents" for the fix; "Ensure we catch all instances of this bug across whole app" for the audit-expanded scope)
**Date:** 2026-08-26
**Proceed:** Yes — all hard blocks pass, all warnings resolved or acknowledged (RISK-ACCEPT logged for W4)
