## Story: Concurrent Write Merge for Artefact Edits
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui, software-engineering
## User Story
As a **Team collaborator (any role editing an artefact)**,
I want **my edits to merge automatically with a teammate's simultaneous edits to the same artefact**,
So that **we can both work on the same stage at once without overwriting each other**.
## Benefit Linkage
Synchronous team access — completing this story enables safe, concurrent collaboration without conflicts.
## Architecture Constraints
Three-way merge algorithm (base, user-A version, user-B version) on the server; new feature_edits table tracking edit hash, merge events, and lineAttributions (JSON: line number → userId); ADR-028 (canonical builder: mergeArtefactEdits() is the single builder for merge logic — no independent re-derivation in other files).
## Dependencies
ep2-s1 (presence/collaborators); ep2-s3 (approval/attribution flow)
## Acceptance Criteria
**AC1:** Given Susan saves a revised AC for story S1 at the same moment Darren saves a revised architecture constraint for the same story, When both save requests hit the server within 100ms of each other, Then the server detects this as a concurrent edit rather than processing them as two independent sequential saves.

**AC2:** Given a concurrent edit has been detected, When the three-way merge runs (base + Susan's version + Darren's version), Then the merged result contains both Susan's AC revision and Darren's architecture constraint change, and both Susan and Darren see the merged version immediately.

**AC3:** Given the merge has completed, When feature_edits is inspected, Then a record exists with operation: "merge" and lineAttributions correctly showing which lines came from Susan and which from Darren.
## Out of Scope
- Optimistic conflict resolution (showing the conflict to the user; accepting one version wholesale without merge)
- Real-time co-editing cursors or presence within the artefact editor
- Handling merge conflicts that require human intervention (assume three-way merge succeeds; hard conflicts deferred)
## NFRs
- Merge completes within 1s
- Line-level attribution is accurate to within 1 character of intended scope
- Merge success rate ≥99%
- Merge algorithm may need iteration based on real usage (risk note — see Complexity Rating, not a scope-stability qualifier)
## Complexity Rating
**Rating:** 3
**Scope stability:** Unstable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
