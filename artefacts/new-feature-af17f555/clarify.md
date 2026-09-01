# Discovery: Cross-Channel Feature Continuity (Clarified)

**Status:** Clarified

**Date:** 2025-07-15

**Feature slug:** 2025-07-15-cross-channel-feature-continuity

## Problem Statement

Platform owners and contributors naturally start outer loop sessions in Claude Code, because that is the path of least resistance in the current setup. The web UI (SaaS surface) is the intended primary dogfooding channel, but features started in Claude Code are invisible to the web UI — there is no way to continue or review them there. As the beta grows, this channel fragmentation actively undermines adoption of the web UI as the default delivery surface.

## Who It Affects

**Platform owner / platform maintainer**

- Starting outer loop work in Claude Code because it's natural and fast
- Cannot then review, continue, or demo that work in the web UI
- Every Claude Code session that stays in Claude Code is a missed dogfood signal for the web UI

## Why Now

The beta is growing. The web UI needs to be validated as a primary delivery surface before that growth locks in Claude Code as the de facto default. If contributors form Claude Code habits now, switching cost grows. The platform's own dogfooding should be the clearest proof point for the web UI's viability — and it currently isn't.

## MVP Scope

A connected repo is the sync source of truth. Features that have been started in Claude Code (i.e. have a discovery artefact committed to `artefacts/[feature-slug]/`) appear in the web UI — visible, navigable, and continuable as a skill session.

The first usable version: a platform owner opens the web UI, sees features in progress from their connected repo, and can open a skill session against one of them.

Minimum required:

- Web UI reads `artefacts/` from the connected repo
- In-progress features surface in the skill picker or a dedicated "in progress" view
- Selecting a feature loads existing artefacts as handoff context for the next skill session

## Out of Scope

- Two-way editing — changes made in the web UI do not write back to Claude Code session state
- Conflict resolution — no merge logic for concurrent edits across surfaces
- Real-time sync — no live push or polling; repo read is on session start or explicit refresh

## Assumptions and Risks

**CONFIRMED:**

- ✅ The GitHub OAuth token scope is sufficient for the web UI to read the connected repo at session start
- ✅ Features started in Claude Code consistently produce artefacts committed to `artefacts/[feature-slug]/`
- ✅ The handoff context mechanism will be evaluated during definition; no scope blocker

Risk: If Claude Code outer loops remain faster or more capable than the web UI for certain skill types, session distribution may not shift even after this feature is delivered — the blocker may be capability parity, not continuity.

## Success Indicators

**Session start distribution shift**

- Baseline: Proportion of outer loop sessions started in Claude Code (inferred from repo commit patterns; exact ratio TBD at definition start)
- Target: Web UI accounts for >50% of outer loop session starts within 4 weeks of delivery
- Measured via: Web UI session logs (POST /api/skills/:name/sessions count) vs Claude Code activity (commit pattern analysis)

**Feature discoverability**

- All in-progress features from `artefacts/` visible and selectable in web UI skill picker
- Zero features fail to load or display in the web UI due to artefact parsing errors

## Constraints

- Web UI is an Express-less Node.js HTTP server — repo reads must use built-in https/fs modules or GitHub API via existing token; no new npm dependencies
- GitHub OAuth token (`req.session.accessToken`) is the canonical credential — must not introduce a second auth mechanism
- No persistent agent runtime — sync is read-on-demand, not a background service

## Clarification Log

**[2025-07-15] Clarified via /clarify:**

- Q: Authentication gap between Claude Code and web UI tokens? A: Same token, sufficient scope
- Q: Are discovery artefacts reliably committed in Claude Code? A: Yes, consistently committed
- Q: Does handoff context mechanism work as-is for repo-discovered artefacts? A: Requires code review in definition
- Q: How is handoff context currently injected? A: Will be reviewed during definition
- Q: Baseline measurement method? A: Infer Claude Code activity from repo commit patterns; measure web UI sessions directly

## Attribution

**Contributors:** Platform Owner — 2025-07-15

**Reviewers:** Pending

**Approved By:** Pending (post-benefit-metric)

---

*Backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). Reconstructed from the journey's rendered content; not a byte-identical copy of the original saved markdown source.*
