# Decisions: the local Playwright suite becomes a trustworthy signal (lpw-s1)

**2026-11-17 | FINDING | The failures are mostly test-environment drift, not product defects**
**Evidence:** `artefacts/2026-11-17-testing-cicd-audit/spikes/playwright-local-suite-triage.md`. All 90 failures from the one-off run are grouped; the three suspected product defects (feature creation answering 409, first sign-in landing on the dashboard, a diagram focus trap) were checked and are test-side: an intentional "connect a repo" gate (das-s2), a fake database with no first-login table, and a focus-walk heuristic that compares tag, id and class.

**2026-11-17 | DECISION | Fix the shared causes first, then measure twice, and only then choose the required core**
**Context:** the operator wants a required core cherry-picked across specs by capability, with every capability and the product code coverage preserved.
**Decision:** this story fixes the shared test-environment causes, switches the job on non-blocking, and records two runs and a coverage baseline; the capability matrix, the required set and the quarantine list are the second story (`lpw-s2`).
**Rationale:** selecting tests from a suite where a third of the failures are drift would bake the drift into the selection. A baseline also makes "no loss of coverage" checkable.

**2026-11-17 | DECISION | Non-blocking, same job name**
Making the job required is the operator's ruleset change and belongs to `lpw-s2`, after the suite is stable. The job keeps its name so nothing in the ruleset changes.

**2026-11-17 | DECISION | Coverage with `c8` through `npx`, pinned, job-only**
No dependency is added to `package.json`; if the server cannot flush V8 coverage on exit under Playwright's signal-based shutdown, fall back to route coverage only and record that.
