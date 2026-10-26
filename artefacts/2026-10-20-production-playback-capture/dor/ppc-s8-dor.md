# Definition of Ready: Production bug fix — `playwright` module missing from the deployed image

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s8-playwright-production-dependency.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s8-test-plan.md
**Track:** Short-track (bug fix, bounded) — discovery through review skipped per `CLAUDE.md`'s own short-track definition.
**Assessed by:** Claude (session)
**Date:** 2026-10-26

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1-AC5 all covered, `ppc-s8-test-plan.md` |
| H4 | Out-of-scope populated | ✅ | 3 named exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m1, m3 |
| H6 | Complexity rated | ✅ | 3 — real Alpine/Chromium compatibility risk, not pre-confirmed |
| H7 | No unresolved HIGH findings | ✅ (N/A) | Short-track — `/review` skipped per `CLAUDE.md`'s own short-track definition |
| H8 | No uncovered ACs in test plan | ✅ | No gap-table entries against the 5 ACs |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-018 explicitly named and refined (not reversed); base-image-swap rejected and recorded |
| H-E2E | Layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC — this story is infra/dependency, not rendering |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-20-production-playback-capture/nfr-profile.md` — this story's own NFRs recorded directly in the story (Performance/Security/Reliability/Design-system), consistent with other `ppc` stories' own convention |
| H-NFR3 | Data classification not blank | ✅ (inherited) | Same "Confidential" classification already recorded for this feature — unchanged by this story, which touches no new data surface |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank, non-engineering-only entry | ✅ (inherited) | Same feature-level discovery approval already on file; short-track does not require a fresh discovery pass |
| H-ADAPTER | New injectable adapter requires a wiring AC | ✅ (N/A) | No new D37 adapter — `realGetAuthenticatedPage`'s existing `getAuthenticatedPage`/`setSessionPageAdapter` wiring is untouched; this story only changes `realGetAuthenticatedPage`'s own internal browser-launch call |
| H-INF | Infra-plan gate | ⚠️ → ✅ | This story IS an infra/deployment change (Dockerfile, package.json). `hasInfraTrack: true` set on this story's `pipeline-state.json` entry so the flag is honest, even though a full separate infra-plan skill run is not being invoked for a bounded, single-story dependency fix — see Oversight note below. |
| H-MIG | Migration-review gate | ✅ (N/A) | No schema/data migration |
| H-DESIGN | Design-token compliance | ✅ (N/A) | No rendering/UI change — `hasDesignSystemTrack` not applicable |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | Stable (fix approach), though exact package versions carry empirical risk — named in Complexity rating | |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A) | Short-track, no `/review` run | |
| W4 | Verification script reviewed by a domain expert | ✅ (N/A) | This story has no separate human-walkthrough verification script — AC1-AC3 are themselves real-command/real-environment checks, not a plain-language manual script | |
| W5 | Alpine/Chromium package-version compatibility not pre-confirmed | ⚠️ | If Alpine's packaged `chromium` proves incompatible with the installed `playwright` npm version's expected browser protocol, the Docker-build tests (AC1/AC2) will fail during implementation and the fix approach may need iteration (try an alternate Alpine package, pin a specific `playwright` version, or fall back to the Debian-base-image alternative named in `decisions.md`'s own Revisit trigger) | RISK-ACCEPT — Hamish King (Platform Owner), 2026-10-26, via direct instruction to write up and implement; verified empirically during implementation via the Docker-build tests rather than blocked on a pre-confirmation that isn't practically obtainable without just trying it |

**Outstanding decision logged:** W5's RISK-ACCEPT and the base-image-swap rejection are both recorded in `decisions.md`'s 2026-10-26 ARCHITECTURE entry (logged alongside this DoR pass, not deferred).

---

## Oversight level

**Medium** (inherited from parent epic `ppc-self-service-capture`) — this is a production-bug fix to already-shipped infrastructure, not a new high-risk capability, but it does touch the production Dockerfile/deploy image directly, so Medium (not Low) is appropriate. No named tech lead configured in this solo-operator repo — operator awareness stands in, same standing convention as every other `ppc` story.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Production bug fix -- playwright module missing from the deployed image -- artefacts/2026-10-20-production-playback-capture/stories/ppc-s8-playwright-production-dependency.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s8-test-plan.md

Goal:
Make the 5 ACs true, verified by the Docker-build tests and the existing E2E/unit suites.
Do not add scope beyond what the ACs specify -- no new capture features, no UI changes.

Touch-points: package.json (add `playwright` to dependencies), Dockerfile (production stage:
install Alpine's native chromium package + required native libs; set an env var pointing at
its executable path), src/web-ui/adapters/session-page-adapter.js (realGetAuthenticatedPage:
accept/resolve an optional executablePath, default to Playwright's own bundled-browser
resolution when unset)

Do not modify: the Dockerfile's builder stage's own `npm ci --include=dev` (dev/CI behaviour
must stay unchanged); the base image (node:20-alpine) for either stage; getAuthenticatedPage/
setSessionPageAdapter's own D37 wiring boundary; any file under src/web-ui/routes/ (this is a
dependency/build fix, not a route-logic change)

Constraints:
- Verify AC1/AC2 with a REAL local `docker build --target production` + `docker run` -- do not
  infer success from reading the Dockerfile/package.json alone
- The executablePath change must be a true no-op outside the production Alpine environment --
  confirm local dev and CI's own `npm run test:e2e` still pass unmodified (AC4) and the
  unit/integration chain still never invokes real Playwright (AC5, ADR-018's own guarantee)
- If the exact Alpine chromium package name/required libs are not already known, research them
  (Alpine's own package index, Playwright's own Docker/Alpine community documentation) rather
  than guessing blindly -- this is exactly the kind of empirical risk named in W5 above
- After a successful local Docker-build verification (AC1/AC2), this fix still needs a REAL
  deploy + REAL production capture attempt (AC3) to be genuinely confirmed -- that step requires
  a human-approved deploy (merge triggers the existing CI/CD pipeline) and cannot be completed
  inside this coding-agent dispatch alone; name it explicitly as the final verification step in
  your own completion report rather than silently treating Docker-build success as AC3's own
  evidence
- Open a draft PR when the Docker-build tests and full suite pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing
  it and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Operator awareness stands in for tech-lead sign-off (no named tech lead configured, solo-operator repo).
**Signed off by:** Hamish King (Platform Owner), via direct chat confirmation ("write up however appropriate and let's implement before we do next item"), 2026-10-26.

**Definition of ready: PROCEED**
