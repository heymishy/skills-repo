I will inspect the existing discovery and definition artefacts for this feature first, then generate the definition output in the repository’s expected format.

Searched for regex `regulatory-reporting-pipeline-automation|regulatory reporting pipeline|RBNZ and FMA Return Automation` (`**/artefacts/**`), no results

Searched for regex `regulatory-reporting-pipeline-automation|RBNZ|FMA Return Automation` (`**/*.{md,json,yml}`), 200 results

Read skill [definition](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/definition/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 260

Read skill [definition](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/definition/SKILL.md?vscodeLinkType%3Dskill#260-260), lines 260 to 488

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/.github/templates/epic.md)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/.github/templates/story.md)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-20-cloud-platform)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-16-trace-writer-fix)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-16-trace-writer-fix/stories)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-16-trace-writer-fix/discovery.md)

Searched for files matching `**/artefacts/**/benefit-metric.md`, 27 matches

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md)

Searched for regex `regulatory-reporting-pipeline-automation|Story 1.2|normalisation layer|review and approval workflow` (`**/workspace/experiments/EXP-008-corpus-breadth-eval/**`), 150 results

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/workspace/experiments/EXP-008-corpus-breadth-eval/runs/config-C-S8/definition.md)

Searched for files matching `**/artefacts/**/definition.md`, no matches

I found the existing evaluation output for this feature, and I’m now writing the actual artefact set under the feature’s artefacts folder so the definition output is available in the repo.Compacted conversation

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/epics)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/stories)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/discovery.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/benefit-metric.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/epics/operational-automation-phase-1.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/stories/rrpl-1-extract-and-pre-populate-rbnz-return.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/stories/rrpl-2-immutable-audit-trail-infrastructure.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/stories/rrpl-3-analyst-review-and-approval-workflow.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/stories/rrpl-4-submission-confirmation-and-gateway-dispatch.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/stories/rrpl-5-scheduled-extraction-and-deadline-management.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/definition.md)

Created [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation/epics/normalisation-logic-governance-phase-2.md)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/artefacts/2026-05-17-regulatory-reporting-pipeline-automation)

The definition artefact set for the regulatory reporting feature is now in place under:

- definition.md
- discovery.md
- benefit-metric.md
- operational-automation-phase-1.md
- normalisation-logic-governance-phase-2.md
- stories

This captures the Phase 1 operational automation scope while keeping the normalisation-governance gate explicit for the future phase.

Made changes.