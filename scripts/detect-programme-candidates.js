#!/usr/bin/env node
'use strict';

// detect-programme-candidates.js — pep-s3
//
// Bottom-up programme-candidate detection script. Scans every feature in
// .github/pipeline-state.json and flags any feature whose epic count is >=4
// as a manual-review candidate worth a human look for programme-track
// coordination. Governed by artefacts/2026-11-08-programme-entry-points/.
//
// Epic count is the primary signal (pinned 2026-11-09 at /review, see
// decisions.md): skills-platform-phase4 (5 epics per its own artefacts; the
// live pipeline-state.json entry for it has 4) was a true programme-scale
// effort, team-identity-roles (1 epic) was not. Cross-feature decisions.md
// "depend"/"dependency" mention count is a secondary signal. Calendar
// timeline span is deliberately never computed anywhere in this script's
// output — confirmed inverted in this repo's real data (the longer-running
// effort was the normal single-feature one, not the programme-scale one).
//
// This never automatically escalates anything — it only produces a
// plain-text manual-review report. A flagged feature is a suggestion for a
// human to look at, never a verdict.
//
// Usage:
//   node scripts/detect-programme-candidates.js
//
// Plain Node.js — no external dependencies. Read-only: never writes to
// pipeline-state.json, decisions.md, or any other file.

const fs = require('fs');
const path = require('path');

const EPIC_COUNT_THRESHOLD = 4; // Pinned 2026-11-09 at /review — see decisions.md.
                                 // Do not change without flagging it: pep-s2's AC1
                                 // reuses this exact value as a coordinated signal.

// ── countEpics ───────────────────────────────────────────────────────────────
// Works identically whether feature.epics[] holds lightweight metadata
// ({slug, name, status, stories: [string, ...]} — the current flat-shape
// convention per ADR-017) or legacy nested full story objects
// (epics[].stories[] = [{...story...}]) — both are just array length.
function countEpics(feature) {
  return Array.isArray(feature.epics) ? feature.epics.length : 0;
}

// ── countDependencyMentions ──────────────────────────────────────────────────
// Simple string match on "depend"/"dependency"/"dependencies"/"dependent" —
// a secondary signal, not meant to be a precise NLP measure.
function countDependencyMentions(decisionsMdContent) {
  const matches = (decisionsMdContent || '').match(/depend(?:s|ency|encies|ent)?/gi);
  return matches ? matches.length : 0;
}

// ── computeSignals ────────────────────────────────────────────────────────────
// Deliberately never includes a timeline/calendar-span field, even unused —
// see story Architecture Constraints: timeline span is confirmed inverted in
// this repo's real data and explicitly excluded as a signal. A future
// maintainer wiring one in by habit would be a real regression; the test
// suite guards against this by inspecting this object's own keys.
function computeSignals(feature, decisionsMdContent) {
  return {
    slug: feature.slug,
    name: feature.name,
    epicCount: countEpics(feature),
    dependencyMentionCount: countDependencyMentions(decisionsMdContent),
  };
}

// ── isCandidate ───────────────────────────────────────────────────────────────
function isCandidate(signals) {
  return signals.epicCount >= EPIC_COUNT_THRESHOLD;
}

// ── generateReport ────────────────────────────────────────────────────────────
// Flat markdown text — no web-UI-specific fields — so this can feed
// initiative 1's visibility surface later without a redesign (per the
// story's own Out-of-Scope note). Never claims a feature "is" a programme,
// only that it looks like a candidate worth a human look.
function generateReport(signalsList) {
  const candidates = signalsList.filter(isCandidate);
  const lines = [];
  lines.push('# Programme-Candidate Detection Report');
  lines.push('');
  if (candidates.length === 0) {
    lines.push('0 candidates found.');
    return lines.join('\n');
  }
  lines.push(`${candidates.length} candidate(s) found:`);
  lines.push('');
  candidates.forEach((s) => {
    lines.push(`- **${s.slug}** (${s.name}) — epic count: ${s.epicCount}, dependency-mention count: ${s.dependencyMentionCount}`);
    lines.push('  This is a directional signal requiring human judgment, not an automatic verdict — it looks like a candidate worth a human look.');
  });
  return lines.join('\n');
}

// ── scanPipelineState ─────────────────────────────────────────────────────────
// Read-only: reads pipeline-state.json once, and each feature's own
// decisions.md if it exists at the conventional artefacts/<slug>/decisions.md
// path. Missing decisions.md (e.g. an archived/renamed artefact folder)
// falls back to dependencyMentionCount: 0 rather than crashing — this is a
// secondary, best-effort signal, not a required one.
function scanPipelineState(pipelineStatePath, artefactsRoot) {
  const state = JSON.parse(fs.readFileSync(pipelineStatePath, 'utf8'));
  return state.features.map((feature) => {
    let decisionsContent = '';
    try {
      decisionsContent = fs.readFileSync(
        path.join(artefactsRoot, feature.slug, 'decisions.md'), 'utf8');
    } catch (_) {
      // No decisions.md at the conventional path for this feature — fine.
    }
    return computeSignals(feature, decisionsContent);
  });
}

module.exports = {
  countEpics,
  countDependencyMentions,
  computeSignals,
  isCandidate,
  generateReport,
  scanPipelineState,
  EPIC_COUNT_THRESHOLD,
};

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const pipelineStatePath = path.join(__dirname, '..', '.github/pipeline-state.json');
  const artefactsRoot = path.join(__dirname, '..', 'artefacts');
  const results = scanPipelineState(pipelineStatePath, artefactsRoot);
  console.log(generateReport(results));
}
