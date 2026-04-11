#!/usr/bin/env node
/**
 * check-skill-contracts.js
 *
 * Structural contract linting for SKILL.md files.
 *
 * Each skill declares a set of required strings that MUST appear in its file.
 * If any string is missing the check fails and the commit is blocked.
 *
 * This catches:
 *   - Required sections accidentally deleted during edits
 *   - Output format strings changed (e.g. FINDINGS → SCORE → VERDICT)
 *   - Mandatory steps or behaviour markers removed
 *
 * Run:  node .github/scripts/check-skill-contracts.js
 * Used: .git/hooks/pre-commit
 *
 * Zero external dependencies — plain Node.js fs only.
 * Adding a new skill: append an entry to CONTRACTS below.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

// ── contracts ─────────────────────────────────────────────────────────────────
//
// Each entry defines the required structural markers for one file.
// Add an entry here whenever a new skill adds a structural invariant.
//
const CONTRACTS = [
  // ── Core pipeline skills ──────────────────────────────────────────────────
  {
    skill: 'discovery',
    file:  '.github/skills/discovery/SKILL.md',
    required: [
      'one at a time',
      'artefacts/[feature-slug]/reference/',
      'mission.md',
      'reference-index.md',
    ],
  },
  {
    skill: 'clarify',
    file:  '.github/skills/clarify/SKILL.md',
    required: [
      '### SCOPE',
      '### INTEGRATION',
      '### CONSTRAINTS',
      '### USER JOURNEY',
      'BLOCKED \u2014',
      'Clarification log',
      'questions resolved',
    ],
  },
  {
    skill: 'benefit-metric',
    file:  '.github/skills/benefit-metric/SKILL.md',
    required: [
      'Meta-benefit check',
      'meta-benefit situation',
      'artefacts/[feature]/benefit-metric.md',
      'Step 2 - Confirm the directional indicators',
    ],
  },
  {
    skill: 'definition',
    file:  '.github/skills/definition/SKILL.md',
    required: [
      'scope accumulator',
      'Step 1.5 - Architecture constraints scan',
      'slicing strategy',
      'Walking skeleton',
      'Dependency chain validation (D1',
      'Testability filter (D2',
      'workspace/learnings.md',
    ],
  },
  {
    skill: 'review',
    file:  '.github/skills/review/SKILL.md',
    required: [
      'sceptical',
      '1\u20135',
      'FINDINGS \u2192 SCORE \u2192 VERDICT',
      'Traceability score',
      'Scope integrity score',
      'AC quality score',
      'Completeness score',
      'Overall score',
    ],
  },
  {
    skill: 'test-plan',
    file:  '.github/skills/test-plan/SKILL.md',
    required: [
      'artefacts/[feature]/test-plans/[story-slug]-test-plan.md',
      'AC verification script',
      'Test data strategy',
      'PCI scope',
    ],
  },
  {
    skill: 'definition-of-ready',
    file:  '.github/skills/definition-of-ready/SKILL.md',
    required: [
      'Step 2 \u2014 Contract proposal',
      'Step 3 \u2014 Contract review',
      'CONTRACT PROPOSAL \u2192 CONTRACT REVIEW \u2192 CHECKLIST \u2192 READY/BLOCKED',
      'dor-contract.md',
      'Hard blocks',
    ],
  },
  // ── Inner coding loop ─────────────────────────────────────────────────────
  {
    skill: 'branch-setup',
    file:  '.github/skills/branch-setup/SKILL.md',
    required: [
      'git worktree add',
      'artefacts/[feature]/dor/[story-slug]-dor.md',
      'Step 3 - Create worktree',
      'Verify clean baseline',
    ],
  },
  {
    skill: 'implementation-plan',
    file:  '.github/skills/implementation-plan/SKILL.md',
    required: [
      'artefacts/[feature]/plans/[story-slug]-plan.md',
      '## File map',
      'zero codebase context',
      'templates/implementation-plan.md',
    ],
  },
  {
    skill: 'tdd',
    file:  '.github/skills/tdd/SKILL.md',
    required: [
      'NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST',
      'RED \u2014 Write the failing test',
      'GREEN \u2014 Write minimal code',
      'Verify RED \u2014 Watch it fail',
    ],
  },
  {
    skill: 'subagent-execution',
    file:  '.github/skills/subagent-execution/SKILL.md',
    required: [
      'Fresh subagent per task',
      'DONE_WITH_CONCERNS',
      'NEEDS_CONTEXT',
      'spec compliance \u2192 code quality',
    ],
  },
  {
    skill: 'verify-completion',
    file:  '.github/skills/verify-completion/SKILL.md',
    required: [
      'NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE',
      'artefacts/[feature]/verification-scripts/[story-slug]-verification.md',
      'templates/verify-completion.md',
      'Scope found outside DoR',
    ],
  },
  {
    skill: 'branch-complete',
    file:  '.github/skills/branch-complete/SKILL.md',
    required: [
      'always draft - merge is a human action',
      '/verify-completion must have passed',
      'Step 3 - Present options',
      'Option 2 - Push and open a draft PR',
    ],
  },
  // ── Post-merge skills ─────────────────────────────────────────────────────
  {
    skill: 'definition-of-done',
    file:  '.github/skills/definition-of-done/SKILL.md',
    required: [
      'Out-of-scope check',
      'CSS-layout-dependent',
      'COMPLETE WITH DEVIATIONS',
      'AC coverage table',
    ],
  },
  {
    skill: 'trace',
    file:  '.github/skills/trace/SKILL.md',
    required: [
      'Chain structure',
      'Metric orphan check',
      'Chain walk \u2014 per story',
      'broken links, orphaned artefacts, scope deviations',
    ],
  },
  {
    skill: 'release',
    file:  '.github/skills/release/SKILL.md',
    required: [
      'rollback trigger definition',
      'Compliance bundle',
      'change_management.tool',
      'release notes (technical and plain language)',
    ],
  },
  {
    skill: 'levelup',
    file:  '.github/skills/levelup/SKILL.md',
    required: [
      'artefacts/[feature]/dod/[story-slug]-dod.md',
      'Category A \u2014 Technical patterns worth standardising',
      'Category D \u2014 Anti-patterns to avoid',
      'copilot-instructions.md',
    ],
  },
  // ── Support skills ────────────────────────────────────────────────────────
  {
    skill: 'systematic-debugging',
    file:  '.github/skills/systematic-debugging/SKILL.md',
    required: [
      'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
      'Phase 1 \u2014 Root cause investigation',
      'Phase 2 \u2014 Pattern analysis',
      'Gather evidence in multi-component systems',
    ],
  },
  {
    skill: 'implementation-review',
    file:  '.github/skills/implementation-review/SKILL.md',
    required: [
      'Stage 1 \u2014 Spec compliance',
      'Stage 2 \u2014 Code quality',
      'templates/implementation-review.md',
      'Critical',
    ],
  },
  {
    skill: 'spike',
    file:  '.github/skills/spike/SKILL.md',
    required: [
      'PROCEED, REDESIGN, or DEFER',
      'Step 0 \u2014 Read the parent discovery artefact',
      'Type 2 \u2014 Regulatory interpretation',
      'answerable with PROCEED, REDESIGN, or DEFER',
    ],
  },
  {
    skill: 'decisions',
    file:  '.github/skills/decisions/SKILL.md',
    required: [
      'Two tracks',
      'artefacts/[feature]/decisions.md',
      'ADR (Architecture Decision Record)',
      'RISK-ACCEPT',
    ],
  },
  {
    skill: 'coverage-map',
    file:  '.github/skills/coverage-map/SKILL.md',
    required: [
      'Output 1 \u2014 Terminal (ANSI coloured ASCII table)',
      'artefacts/[feature-slug]/test-plans',
      'coverage-map.js',
      'ROLLUP',
    ],
  },
  {
    skill: 'record-signal',
    file:  '.github/skills/record-signal/SKILL.md',
    required: [
      'metrics[]',
      'on-track / at-risk / off-track / not-yet-measured',
      'signal',
      'lastMeasured',
    ],
  },
  {
    skill: 'metric-review',
    file:  '.github/skills/metric-review/SKILL.md',
    required: [
      'Re-baselines benefit metrics',
      'Target needs revision',
      'artefacts/[feature]/benefit-metric.md',
      'At risk',
    ],
  },
  // ── Programme track ───────────────────────────────────────────────────────
  {
    skill: 'programme',
    file:  '.github/skills/programme/SKILL.md',
    required: [
      'Step 0 \u2014 Qualification',
      'artefacts/[programme-slug]/programme.md',
      'Consumer migration',
      'Programme health view',
    ],
  },
  // ── Architecture / research skills ───────────────────────────────────────
  {
    skill: 'ea-registry',
    file:  '.github/skills/ea-registry/SKILL.md',
    required: [
      'QUERY',
      'CONTRIBUTE',
      'AUDIT',
      'FEED',
      'registry/applications/',
      'registry/interfaces/',
    ],
  },
  {
    skill: 'reverse-engineer',
    file:  '.github/skills/reverse-engineer/SKILL.md',
    required: [
      'six-layer analysis',
      'Layer 1',
      'vendor Q&A tracker',
      'templates/reverse-engineering-report.md',
    ],
  },
  {
    skill: 'ideate',
    file:  '.github/skills/ideate/SKILL.md',
    required: [
      'five lenses',
      'opportunity mapping (Torres)',
      'jobs-to-be-done (Christensen / Moesta)',
      'Decision table',
    ],
  },
  // ── Pipeline evolution skills ─────────────────────────────────────────────
  {
    skill: 'bootstrap',
    file:  '.github/skills/bootstrap/SKILL.md',
    required: [
      'What bootstrap creates',
      'pull_request_template.md',
      'architecture-guardrails.md',
      'pipeline-state.json',
    ],
  },
  {
    skill: 'loop-design',
    file:  '.github/skills/loop-design/SKILL.md',
    required: [
      'swappable inner loop',
      'Setup slot',
      '.github/templates/loop-design.md',
      'inner loop contract',
    ],
  },
  {
    skill: 'token-optimization',
    file:  '.github/skills/token-optimization/SKILL.md',
    required: [
      'Stage-by-stage model routing',
      'Token budget policy',
      'artefacts/[feature-slug]/token-optimization.md',
      '.github/templates/token-optimization.md',
    ],
  },
  {
    skill: 'org-mapping',
    file:  '.github/skills/org-mapping/SKILL.md',
    required: [
      'translation matrix',
      'artefacts/[programme-slug]/org-mapping.md',
      '.github/templates/org-mapping.md',
      'Governance hooks',
    ],
  },
  {
    skill: 'scale-pipeline',
    file:  '.github/skills/scale-pipeline/SKILL.md',
    required: [
      'artefacts/[programme-slug]/scale-pipeline.md',
      '1-2 teams to 20-30 teams',
      '.github/templates/scale-pipeline.md',
      'Control plane design',
    ],
  },
  // ── Dispatch skills ───────────────────────────────────────────────────────
  {
    skill: 'issue-dispatch',
    file:  '.github/skills/issue-dispatch/SKILL.md',
    required: [
      '--target vscode',
      '--target github-agent',
      'issueUrl',
      'dispatchTarget',
      'Unpushed commits detected',
    ],
  },
  // ── Workflow navigator ────────────────────────────────────────────────────
  {
    skill: 'workflow',
    file:  '.github/skills/workflow/SKILL.md',
    required: [
      'Pipeline health note',
      'Confirm this is genuinely short-track',
    ],
  },
  // ── Cross-cutting config ──────────────────────────────────────────────────
  {
    skill: 'copilot-instructions',
    file:  '.github/copilot-instructions.md',
    required: [
      '## Context handoff protocol',
      'Coding agent resuming a feature',
      'dor-contract.md',
    ],
  },
];

// ── invariants applied to every SKILL.md ──────────────────────────────────────
const SKILL_INVARIANTS = [
  { marker: '## State update', label: '## State update — mandatory final step' },
];

// ── runner ────────────────────────────────────────────────────────────────────
let failed = false;
const results = [];

for (const contract of CONTRACTS) {
  const filePath = path.join(root, contract.file);

  if (!fs.existsSync(filePath)) {
    process.stderr.write(`[skill-contracts] MISSING FILE: ${contract.file}\n`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const missing  = contract.required.filter(r => !content.includes(r));

  // Universal invariant: every SKILL.md must have a State update section
  const invariantMissing = contract.file.endsWith('SKILL.md')
    ? SKILL_INVARIANTS.filter(inv => !content.includes(inv.marker))
    : [];

  const allMissing = missing.concat(invariantMissing.map(i => i.label));

  if (allMissing.length > 0) {
    process.stderr.write(`\n[skill-contracts] FAIL \u2014 ${contract.skill}\n`);
    for (const m of allMissing) {
      process.stderr.write(`  \u2717 Required text not found: "${m}"\n`);
    }
    failed = true;
  } else {
    results.push(`  \u2713 ${contract.skill} (${contract.required.length} contract(s))`);
  }
}

if (failed) {
  process.stderr.write(
    '\n[skill-contracts] One or more skill contracts failed.\n' +
    'A required structural marker is missing from a skill file.\n' +
    'Fix the issues above, or update the contract in .github/scripts/check-skill-contracts.js\n' +
    'if the change was intentional.\n\n'
  );
  process.exit(1);
}

const totalContracts = CONTRACTS.reduce((n, c) => n + c.required.length, 0);
process.stdout.write(
  `[skill-contracts] ${CONTRACTS.length} skill(s), ${totalContracts} contract(s) OK \u2713\n`
);
process.exit(0);
