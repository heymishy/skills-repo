## Story: Concurrent Write Merge for Artefact Edits
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui, software-engineering
## User Story
As a **Team collaborator (any role editing an artefact)**,
So that Synchronous team access — completing this story enables safe, concurrent collaboration without conflicts..
## Benefit Linkage
Synchronous team access — completing this story enables safe, concurrent collaboration without conflicts.
## Architecture Constraints
Three-way merge algorithm (base, user-A version, user-B version) on the server; new feature_edits table tracking edit hash, merge events, and lineAttributions (JSON: line number → userId); ADR-028 (canonical builder: mergeArtefactEdits() is the single builder for merge logic — no independent re-derivation in other files).

Given Susan saves a revised AC for story S1 at the same moment Darren saves a revised architecture constraint for the same story,
When both save requests hit the server within 100ms of each other,
Then the server detects the concurrent edit, performs a three-way merge (base + Susan's version + Darren's version), and the merged result includes both Susan's AC revision and Darren's architecture constraint. Both Susan and Darren see the merged version immediately. A feature_edits record is created with operation: "merge", lineAttributions showing which lines came from which user.
## Dependencies
ep2-s1 (presence/collaborators); ep2-s3 (approval/attribution flow)
## Acceptance Criteria
Given Susan saves a revised AC for story S1 at the same moment Darren saves a revised architecture constraint for the same story,
When both save requests hit the server within 100ms of each other,
Then the server detects the concurrent edit, performs a three-way merge (base + Susan's version + Darren's version), and the merged result includes both Susan's AC revision and Darren's architecture constraint. Both Susan and Darren see the merged version immediately. A feature_edits record is created with operation: "merge", lineAttributions showing which lines came from which user.
## Out of Scope
- Optimistic conflict resolution (showing the conflict to the user; accepting one version wholesale without merge)
- Real-time co-editing cursors or presence within the artefact editor
- Handling merge conflicts that require human intervention (assume three-way merge succeeds; hard conflicts deferred)
## NFRs
- Merge completes within 1s
- Line-level attribution is accurate to within 1 character of intended scope
- Merge success rate ≥99%
## Complexity Rating
**Rating:** 3
**Scope stability:** Unstable (merge algorithm may need iteration based on real usage)
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
