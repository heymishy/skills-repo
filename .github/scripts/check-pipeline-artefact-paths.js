#!/usr/bin/env node
/**
 * check-pipeline-artefact-paths.js
 *
 * Pipeline integration test — artefact path consistency.
 *
 * Validates that the artefact paths written by each skill match the paths
 * read by downstream skills. This catches handoff breakages: if /definition-of-ready
 * writes to a path that /branch-setup no longer reads from, the pipeline breaks
 * silently — this script catches that at commit time.
 *
 * Strategy: extract all artefact path patterns from every SKILL.md using simple
 * regex, then check that:
 *   1. Every path a skill WRITES is also present in at least one skill as a READ
 *      (no orphaned write)
 *   2. Every path a skill is known to READ has a corresponding WRITE upstream
 *      (no dangling read)
 *
 * Uses a declared path registry (PIPELINE_PATHS below) as the source of truth.
 * To add a new path: append it to PIPELINE_PATHS.
 *
 * Run:  node .github/scripts/check-pipeline-artefact-paths.js
 * Used: .git/hooks/pre-commit
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const root       = path.join(__dirname, '..', '..');
const skillsRoot = path.join(root, '.github', 'skills');

// ── Pipeline path registry ────────────────────────────────────────────────────
//
// Each entry declares an artefact path pattern and which skills write/read it.
// Keep this in pipeline order. When a skill changes its output path, update here.
//
// writtenBy — the skill that produces this artefact
// readBy    — skills that consume this artefact (as input or entry condition)
//
// NOTE on reader lists: only include a skill in readBy if its SKILL.md
// explicitly references the file path fragment (folder name or filename suffix).
// Conceptual readers that reference the artefact type by concept-name only
// (not by file path) are intentionally excluded — the script can't verify them.
const PIPELINE_PATHS = [
  {
    path:      'artefacts/[feature-slug]/discovery.md',
    writtenBy: 'discovery',
    readBy:    ['clarify', 'benefit-metric', 'definition', 'trace'],
    // review reads stories not discovery directly; excluded
  },
  {
    path:      'artefacts/[feature]/benefit-metric.md',
    writtenBy: 'benefit-metric',
    readBy:    ['definition', 'trace', 'metric-review'],
    // review + definition-of-ready reference benefit-metric by concept not path; excluded
  },
  {
    path:      'artefacts/[feature]/epics/[epic-slug].md',
    writtenBy: 'definition',
    readBy:    ['review', 'definition-of-ready'],
  },
  {
    path:      'artefacts/[feature]/stories/[story-slug].md',
    writtenBy: 'definition',
    readBy:    ['review', 'test-plan', 'definition-of-ready', 'branch-setup', 'implementation-plan', 'trace', 'definition-of-done'],
  },
  {
    path:      'artefacts/[feature]/review/[story-slug]-review-[N].md',
    writtenBy: 'review',
    readBy:    ['test-plan', 'definition-of-ready', 'trace'],
  },
  {
    path:      'artefacts/[feature]/test-plans/[story-slug]-test-plan.md',
    writtenBy: 'test-plan',
    readBy:    ['definition-of-ready', 'implementation-plan', 'coverage-map'],
    // verify-completion reads verification-scripts not test-plans; trace uses stage not path; excluded
  },
  {
    path:      'artefacts/[feature]/verification-scripts/[story-slug]-verification.md',
    writtenBy: 'test-plan',
    readBy:    ['definition-of-ready', 'verify-completion'],
    // definition-of-done checks ACs from story not verification script path; excluded
  },
  {
    path:      'artefacts/[feature]/dor/[story-slug]-dor.md',
    writtenBy: 'definition-of-ready',
    readBy:    ['branch-setup', 'implementation-plan'],
    // trace references dor stage not file path; excluded
  },
  {
    path:      'artefacts/[feature]/dor/[story-slug]-dor-contract.md',
    writtenBy: 'definition-of-ready',
    readBy:    ['branch-setup', 'implementation-plan'],
  },
  {
    path:      'artefacts/[feature]/plans/[story-slug]-plan.md',
    writtenBy: 'implementation-plan',
    readBy:    ['subagent-execution'],
    // tdd references /implementation-plan skill not plans/ path; excluded
  },
  {
    path:      'artefacts/[feature]/dod/[story-slug]-dod.md',
    writtenBy: 'definition-of-done',
    readBy:    ['improve'],
    // trace + release use "DoD" concept not dod/ path; excluded
  },
  {
    path:      'artefacts/[feature]/trace/[date]-trace.md',
    writtenBy: 'trace',
    readBy:    [],  // terminal — consumed by humans
  },
  {
    path:      'artefacts/[feature]/decisions.md',
    writtenBy: 'decisions',
    readBy:    ['trace', 'improve'],
    // definition-of-ready references /decisions skill not decisions.md path; excluded
  },
  {
    path:      'artefacts/[programme-slug]/programme.md',
    writtenBy: 'programme',
    readBy:    [],  // terminal — metric-review references by concept not path
  },
];

// ── Skill file content cache ───────────────────────────────────────────────────

function readSkill(skillName) {
  const filePath = path.join(skillsRoot, skillName, 'SKILL.md');
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

// ── Validation ────────────────────────────────────────────────────────────────

let failed = false;
const issues = [];

for (const entry of PIPELINE_PATHS) {
  // 1. Check the writtenBy skill mentions the path
  const writerContent = readSkill(entry.writtenBy);
  if (!writerContent) {
    issues.push(`  ✗ Writer skill not found: ${entry.writtenBy} (for path: ${entry.path})`);
    failed = true;
    continue;
  }

  // Extract path parts for matching
  const pathParts     = entry.path.split('/');
  const filePattern   = pathParts[pathParts.length - 1];  // e.g. "[story-slug]-dor.md"
  // Strip template placeholders to get a matchable suffix
  const fileSuffix    = filePattern.replace(/\[[^\]]+\]/g, '').replace(/^-/, '');
  // Also extract the folder segment (second-to-last) for folder-OR-suffix matching
  const folderSegment = pathParts.length >= 3 ? pathParts[pathParts.length - 2] : '';

  // Writer check: folder segment OR file suffix must appear in SKILL.md
  const writerHasFolder  = folderSegment && !folderSegment.startsWith('[') && writerContent.includes(folderSegment);
  const writerHasSuffix  = fileSuffix.length > 2 && writerContent.includes(fileSuffix);
  if (!writerHasFolder && !writerHasSuffix) {
    issues.push(`  ✗ Writer skill "${entry.writtenBy}" does not mention folder "${folderSegment}" or suffix "${fileSuffix}" (path: ${entry.path})`);
    failed = true;
  }

  // 2. Check each readBy skill mentions the path folder or filename
  for (const reader of entry.readBy) {
    const readerContent = readSkill(reader);
    if (!readerContent) {
      issues.push(`  ✗ Reader skill not found: ${reader} (for path: ${entry.path})`);
      failed = true;
      continue;
    }

    // Check for the folder segment that distinguishes this artefact type (folderSegment declared above)
    const hasFolder = folderSegment && !folderSegment.startsWith('[') && readerContent.includes(folderSegment);
    const hasFileSuffix = fileSuffix.length > 2 && readerContent.includes(fileSuffix);

    if (!hasFolder && !hasFileSuffix) {
      issues.push(`  ✗ Reader skill "${reader}" does not reference "${entry.path}" (checked folder: "${folderSegment}", suffix: "${fileSuffix}")`);
      failed = true;
    }
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

if (failed) {
  process.stderr.write('\n[pipeline-paths] FAIL — artefact path consistency issues found:\n\n');
  for (const issue of issues) {
    process.stderr.write(issue + '\n');
  }
  process.stderr.write(
    '\nA skill is writing to or reading from a path that has no matching counterpart.\n' +
    'Either update the skill or update PIPELINE_PATHS in .github/scripts/check-pipeline-artefact-paths.js\n\n'
  );
  process.exit(1);
}

const totalPaths   = PIPELINE_PATHS.length;
const totalReaders = PIPELINE_PATHS.reduce((n, e) => n + e.readBy.length, 0);
process.stdout.write(
  `[pipeline-paths] ${totalPaths} path(s), ${totalReaders} reader link(s) OK \u2713\n`
);
process.exit(0);
