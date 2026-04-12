#!/usr/bin/env node
/**
 * viz-functions.js
 *
 * Pure functions extracted from pipeline-viz.html for unit testing.
 * Logic is identical to the browser version — no changes to behaviour.
 * Exported as CommonJS for consumption by check-viz-behaviour.js.
 *
 * Extraction rationale: these functions have no DOM dependencies and can be
 * fully exercised in Node.js. The browser script block still defines them
 * inline (unchanged) so the viz works without a build step (ADR-001).
 *
 * Functions exported:
 *   normalizeData         — normalises raw pipeline-state.json
 *   gateStatus (evaluateGate alias)  — gate pass/warn/fail for a feature
 *   storyNextSkill        — next skill for a story's current state
 *   featureActionMeta     — action state, channel hint, next action text
 *   channelLabel          — human display text for a channel hint
 *   computeFleetSummary   — aggregates fleet registry into summary stats
 *   csvEscape             — escapes a value for CSV output
 *   buildExportCSV        — builds a CSV string from a pipeline-state object
 *   buildExportJSON       — builds a JSON string from state + fleet objects
 *
 * Helper functions also exported (used by the above):
 *   allStories, hasHighFindings, isReleaseReady, featureAgeMinutes, formatAge,
 *   stageRank, hasReachedStage, loopType, stageLabel, firstStorySlug, firstEpicSlug
 */
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS  (mirrored from pipeline-viz.html CONFIG block)
// ─────────────────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'ideation',              label: 'Ideation' },
  { id: 'discovery',             label: 'Discovery' },
  { id: 'benefit-metric',        label: 'Benefit Metric' },
  { id: 'definition',            label: 'Definition' },
  { id: 'spike',                 label: 'Spike' },
  { id: 'review',                label: 'Review' },
  { id: 'test-plan',             label: 'Test Plan' },
  { id: 'definition-of-ready',   label: 'Def of Ready' },
  { id: 'branch-setup',          label: 'Branch Setup' },
  { id: 'implementation-plan',   label: 'Impl Plan' },
  { id: 'subagent-execution',    label: 'Execution' },
  { id: 'implementation-review', label: 'Impl Review' },
  { id: 'verify-completion',     label: 'Verify' },
  { id: 'branch-complete',       label: 'Branch Done' },
  { id: 'definition-of-done',    label: 'Def of Done' },
  { id: 'trace',                 label: 'Trace' },
  { id: 'release-pending',       label: 'Release Pending' },
  { id: 'released',              label: 'Released' },
  { id: 'stalled',               label: 'Stalled' },
];

const META_STAGES = ['loop-design', 'token-optimization', 'org-mapping', 'scale-pipeline'];

const INNER_LOOP_STAGE_ORDER = [
  'branch-setup', 'implementation-plan', 'subagent-execution',
  'implementation-review', 'verify-completion', 'branch-complete',
];
const INNER_LOOP_STAGES = new Set(INNER_LOOP_STAGE_ORDER);

const OUTER_LOOP_STAGE_ORDER = [
  'ideation', 'discovery', 'benefit-metric', 'definition', 'spike', 'review',
  'test-plan', 'definition-of-ready', 'definition-of-done', 'trace',
  'release-pending', 'released',
];

const PIPELINE_STAGE_ORDER = [
  'ideation', 'discovery', 'benefit-metric', 'definition', 'spike', 'review',
  'test-plan', 'definition-of-ready', 'branch-setup', 'implementation-plan',
  'subagent-execution', 'implementation-review', 'verify-completion',
  'branch-complete', 'definition-of-done', 'trace', 'release-pending', 'released',
];

const PROCESSING_STALE_MINUTES = 120;

const DEFAULT_GOVERNANCE_GATES = [
  { id: 'discovery',           label: 'Discovery',      skill: '/discovery',           skillPath: 'skills/discovery/SKILL.md',           criteria: 'Discovery artefact approved before progression',             artefact: function(f) { return '../artefacts/' + f.slug + '/discovery.md'; } },
  { id: 'benefit-metric',      label: 'Benefit Metric', skill: '/benefit-metric',      skillPath: 'skills/benefit-metric/SKILL.md',      criteria: 'Measurable outcomes defined with targets and baselines',     artefact: function(f) { return '../artefacts/' + f.slug + '/benefit-metric.md'; } },
  { id: 'definition',          label: 'Definition',     skill: '/definition',          skillPath: 'skills/definition/SKILL.md',          criteria: 'Epics and stories decomposed from discovery',                artefact: function(f) { const e = firstEpicSlug(f); return e ? '../artefacts/' + f.slug + '/epics/' + e + '.md' : '../artefacts/' + f.slug + '/epics/'; } },
  { id: 'review',              label: 'Review',         skill: '/review',              skillPath: 'skills/review/SKILL.md',              criteria: 'No HIGH findings before progression',                        artefact: function(f) { return '../artefacts/' + f.slug + '/review/all-stories-review-1.md'; } },
  { id: 'architecture',        label: 'Architecture',   skill: '/review',              skillPath: 'skills/review/SKILL.md',              criteria: 'Architecture guardrails compliance verified (Category E)',   artefact: function(f) { return '../artefacts/' + f.slug + '/review/all-stories-review-1.md'; } },
  { id: 'test-plan',           label: 'Test Plan',      skill: '/test-plan',           skillPath: 'skills/test-plan/SKILL.md',           criteria: 'Failing tests and verification script prepared',             artefact: function(f) { const s = firstStorySlug(f); return s ? '../artefacts/' + f.slug + '/test-plans/' + s + '-test-plan.md' : '../artefacts/' + f.slug + '/test-plans/'; } },
  { id: 'definition-of-ready', label: 'DoR',            skill: '/definition-of-ready', skillPath: 'skills/definition-of-ready/SKILL.md', criteria: 'All hard blocks pass and sign-off complete',                 artefact: function(f) { const s = firstStorySlug(f); return s ? '../artefacts/' + f.slug + '/dor/' + s + '-dor.md' : '../artefacts/' + f.slug + '/dor/'; } },
  { id: 'decisions',           label: 'Decisions',      skill: '/decisions',           skillPath: 'skills/decisions/SKILL.md',           criteria: 'Risk acceptances and scope decisions logged',                artefact: function(f) { return '../artefacts/' + f.slug + '/decisions.md'; } },
  { id: 'verify-completion',   label: 'Verify',         skill: '/verify-completion',   skillPath: 'skills/verify-completion/SKILL.md',   criteria: 'Fresh evidence run before completion claims',                artefact: function(f) { const s = firstStorySlug(f); return s ? '../artefacts/' + f.slug + '/verification-scripts/' + s + '-verification.md' : '../artefacts/' + f.slug + '/verification-scripts/'; } },
  { id: 'definition-of-done',  label: 'DoD',            skill: '/definition-of-done',  skillPath: 'skills/definition-of-done/SKILL.md',  criteria: 'Post-merge AC/test coverage validated',                      artefact: function(f) { const s = firstStorySlug(f); return s ? '../artefacts/' + f.slug + '/dod/' + s + '-dod.md' : '../artefacts/' + f.slug + '/dod/'; } },
  { id: 'ADR-005',             label: 'ADR-005',        skill: '/decisions',           skillPath: 'skills/decisions/SKILL.md',           criteria: 'Agent instructions format driven by vcs.type (surface adapter concern)', section: 'Active ADRs', artefact: function(f) { return '../artefacts/' + f.slug + '/decisions.md'; } },
  { id: 'trace',               label: 'Trace',          skill: '/trace',               skillPath: 'skills/trace/SKILL.md',               criteria: 'Traceability chain intact across artefacts',                 artefact: function(f) { return '../artefacts/' + f.slug + '/trace/trace.md'; } },
  { id: 'release',             label: 'Release',        skill: '/release',             skillPath: 'skills/release/SKILL.md',             criteria: 'Release bundle/checklist produced for deployment',           artefact: function(f) { return '../artefacts/' + f.slug + '/release/release-notes-technical.md'; } },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function allStories(feature) {
  return (feature.epics || []).flatMap(function(e) { return e.stories || []; });
}

function firstStorySlug(feature) {
  const stories = allStories(feature);
  return stories.length > 0 ? stories[0].slug : null;
}

function firstEpicSlug(feature) {
  const epics = feature.epics || [];
  return epics.length > 0 ? epics[0].slug : null;
}

function hasHighFindings(feature) {
  const stories = allStories(feature);
  return stories.some(function(s) { return (s.highFindings || 0) > 0; });
}

function isReleaseReady(feature) {
  const stories = allStories(feature);
  return stories.length > 0 && stories.every(function(s) {
    return s.releaseReady || s.dodStatus === 'complete' || s.prStatus === 'merged';
  });
}

function featureTimestamp(feature) {
  return feature.updatedAt || feature.updated || null;
}

function featureAgeMinutes(feature) {
  const ts = featureTimestamp(feature);
  if (!ts) return 0;
  const then = new Date(ts).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 60000));
}

function formatAge(minutes) {
  if (minutes < 60) return minutes + 'm';
  if (minutes < 1440) return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
  return Math.floor(minutes / 1440) + 'd ' + Math.floor((minutes % 1440) / 60) + 'h';
}

function stageRank(stageId) {
  const i = PIPELINE_STAGE_ORDER.indexOf(stageId);
  return i >= 0 ? i : -1;
}

function hasReachedStage(feature, stageId) {
  return stageRank(feature.stage) >= stageRank(stageId) && stageRank(stageId) >= 0;
}

function loopType(stageId) {
  if (META_STAGES.includes(stageId)) return 'library';
  if (INNER_LOOP_STAGES.has(stageId)) return 'inner';
  return 'outer';
}

function stageLabel(id) {
  if (!id) return '—';
  const s = STAGES.find(function(x) { return x.id === id; });
  if (s) return s.label;
  if (id === 'loop-design')        return 'Meta: Loop Design';
  if (id === 'token-optimization') return 'Meta: Token Opt';
  if (id === 'org-mapping')        return 'Meta: Org Mapping';
  if (id === 'scale-pipeline')     return 'Meta: Scale Pipeline';
  return id;
}

function csvEscape(value) {
  const s = String(value == null ? '' : value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeData
// ─────────────────────────────────────────────────────────────────────────────

function normalizeData(data) {
  if (!data) return data;
  (data.features || []).forEach(function(f) {
    f.slug = f.slug || f.id;
    (f.epics || []).forEach(function(e) {
      e.slug = e.slug || e.id;
      (e.stories || []).forEach(function(s) {
        s.slug  = s.slug  || s.id;
        s.tasks = s.tasks || [];
      });
    });
  });
  (data.programmes || []).forEach(function(p) { p.slug = p.slug || p.id; });

  // Build programme lookup
  const programmes = data.programmes || [];
  (data.features || []).forEach(function(f) {
    if (f.programme) return;
    const parent = programmes.find(function(p) { return (p.workstreams || []).indexOf(f.slug) !== -1; });
    if (parent) f.programme = parent.slug;
  });

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// channelLabel
// ─────────────────────────────────────────────────────────────────────────────

function channelLabel(ch) {
  if (ch === 'ide')      return 'IDE / Copilot';
  if (ch === 'approval') return 'Sign-off needed';
  if (ch === 'agent')    return 'Agent running';
  if (ch === 'blocker')  return 'Blocked';
  return ch;
}

// ─────────────────────────────────────────────────────────────────────────────
// featureActionMeta
// ─────────────────────────────────────────────────────────────────────────────

function featureActionMeta(feature) {
  if (feature.health === 'red' || feature.stage === 'stalled') {
    return {
      state: 'blocked',
      label: 'Blocked',
      nextAction: feature.blocker ? 'Unblock: ' + feature.blocker : 'Resolve blocker and update stage',
      channel: 'blocker',
    };
  }

  const stage = feature.stage;
  if (stage === 'released') {
    return { state: 'done', label: 'Done', nextAction: 'No action needed', channel: null };
  }

  if (stage === 'review' && hasHighFindings(feature)) {
    return { state: 'human', label: 'Needs human', nextAction: 'Address HIGH findings and rerun /review', channel: 'ide' };
  }

  if (stage === 'release-pending' && isReleaseReady(feature)) {
    return { state: 'human', label: 'Needs human', nextAction: 'Run /release and complete deployment checklist', channel: 'ide' };
  }

  const processingStageActions = {
    'branch-setup':           'Branch/worktree setup in progress',
    'implementation-plan':    'Implementation planning in progress',
    'subagent-execution':     'Subagent task execution in progress',
    'verify-completion':      'Verification checks running',
  };
  if (processingStageActions[stage]) {
    const stale = featureAgeMinutes(feature) >= PROCESSING_STALE_MINUTES;
    return {
      state: 'processing',
      label: stale ? 'Stale proc' : 'Processing',
      nextAction: stale
        ? 'No update for ' + formatAge(featureAgeMinutes(feature)) + '. Check run status / blockers.'
        : processingStageActions[stage],
      channel: 'agent',
    };
  }

  const humanStageActions = {
    'ideation':              'Capture idea and decide whether to run /discovery',
    'discovery':             'Complete discovery artefact and get approval · /estimate E1 fires at exit',
    'benefit-metric':        'Define measurable outcomes via /benefit-metric',
    'definition':            'Break into epics/stories via /definition · /estimate E2 fires at exit',
    'spike':                 'Run/close spike with PROCEED, REDESIGN, or DEFER',
    'test-plan':             'Write failing tests via /test-plan',
    'definition-of-ready':   'Complete DoR checks and sign off',
    'implementation-review': 'Review implementation findings and decide fixes',
    'branch-complete':       'Choose branch completion option (draft PR/merge/keep/discard)',
    'definition-of-done':    'Validate post-merge completion evidence · /estimate E3 fires in /levelup',
    'trace':                 'Run traceability check and resolve chain gaps',
    'release-pending':       'Prepare and run /release',
    'loop-design':           'Refine outer/inner operating model',
    'token-optimization':    'Update routing/token policy and rollout plan',
    'org-mapping':           'Update organization stage mappings and approvals',
    'scale-pipeline':        'Advance scaling decisions and operating model',
  };

  const channel = (stage === 'benefit-metric' || stage === 'definition-of-ready') ? 'approval' : 'ide';
  return {
    state: 'human',
    label: 'Needs human',
    nextAction: humanStageActions[stage] || "Review stage '" + stage + "' and decide next skill",
    channel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// storyNextSkill
// ─────────────────────────────────────────────────────────────────────────────

function storyNextSkill(s) {
  if (s.dodStatus === 'complete')                      return null;
  if (s.prStatus === 'merged')                         return '/definition-of-done · then /levelup (runs /estimate E3)';
  if (s.prStatus === 'open' || s.prStatus === 'draft') return '/verify-completion';
  const st = s.stage || '';
  if (st === 'verify-completion')     return '/verify-completion';
  if (st === 'implementation-review') return '/implementation-review';
  if (st === 'subagent-execution')    return 'Continue execution — /tdd per task';
  if (st === 'implementation-plan')   return '/implementation-plan';
  if (st === 'branch-setup')          return '/branch-setup';
  if (st === 'branch-complete')       return '/branch-complete';
  if (s.dorStatus === 'signed-off')   return '/branch-setup → /implementation-plan';
  if (s.dorStatus === 'blocked')      return 'Fix DoR blockers → re-run /definition-of-ready';
  if (s.reviewStatus === 'passed' && s.testPlan) return '/definition-of-ready';
  if (s.reviewStatus === 'passed')                return '/test-plan';
  if (s.reviewStatus === 'has-findings')          return s.highFindings > 0 ? 'Fix HIGH findings → re-run /review' : 'Acknowledge MEDs → run /test-plan';
  return '/review';
}

// ─────────────────────────────────────────────────────────────────────────────
// gateStatus  (= evaluateGate in the test suite API)
// ─────────────────────────────────────────────────────────────────────────────

function isRegulatedFeature(feature) {
  return feature.complianceProfile === 'regulated' || feature.regulated === true;
}

function applyGovernancePolicy(feature, status, strictPolicy) {
  if (!strictPolicy) return status;
  if (!isRegulatedFeature(feature)) return status;
  if (status.state !== 'warn') return status;
  return Object.assign({}, status, {
    state: 'fail',
    label: status.label + ' (policy)',
    policyEscalated: true,
  });
}

function gateStatus(feature, gateId, opts) {
  opts = opts || {};
  const strictPolicy = opts.strictPolicy !== undefined ? opts.strictPolicy : false;
  const gates = opts.gates || DEFAULT_GOVERNANCE_GATES;

  const stories = allStories(feature);
  const artefactFor = function(id) {
    const g = gates.find(function(x) { return x.id === id; });
    return g ? g.artefact(feature) : '';
  };

  let status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };

  if (gateId === 'review') {
    if (stories.length === 0) status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    else if (stories.some(function(s) { return (s.highFindings || 0) > 0; })) status = { state: 'fail', label: 'HIGH findings', artefact: artefactFor(gateId) };
    else if (stories.every(function(s) { return s.reviewStatus === 'passed'; })) status = { state: 'pass', label: 'Passed', artefact: artefactFor(gateId) };
    else status = { state: 'warn', label: 'In progress', artefact: artefactFor(gateId) };
  }

  if (gateId === 'test-plan') {
    if (stories.length === 0) status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    const written = stories.filter(function(s) { return s.testPlan && s.testPlan.status === 'written' && (s.testPlan.totalTests || 0) > 0; }).length;
    if (written === stories.length) status = { state: 'pass', label: 'Written', artefact: artefactFor(gateId) };
    else if (written > 0) status = { state: 'warn', label: 'Partial', artefact: artefactFor(gateId) };
    else status = { state: 'fail', label: 'Missing', artefact: artefactFor(gateId) };
  }

  if (gateId === 'definition-of-ready') {
    if (stories.length === 0) status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    else if (stories.some(function(s) { return s.dorStatus === 'blocked'; })) status = { state: 'fail', label: 'Blocked', artefact: artefactFor(gateId) };
    else if (stories.every(function(s) { return s.dorStatus === 'signed-off'; })) status = { state: 'pass', label: 'Signed off', artefact: artefactFor(gateId) };
    else status = { state: 'warn', label: 'Pending', artefact: artefactFor(gateId) };
  }

  if (gateId === 'verify-completion') {
    if (stories.length === 0) status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    else if (stories.every(function(s) { return s.verifyStatus === 'passed'; })) status = { state: 'pass', label: 'Verified', artefact: artefactFor(gateId) };
    else if (stories.some(function(s) { return s.verifyStatus === 'running'; })) status = { state: 'warn', label: 'Running', artefact: artefactFor(gateId) };
    else if (stories.some(function(s) { return s.verifyStatus; })) status = { state: 'warn', label: 'In progress', artefact: artefactFor(gateId) };
    // TODO: replace this fallback with verifyStatus evidence — set story.verifyStatus in /verify-completion skill
    else if (hasReachedStage(feature, 'branch-complete')) status = { state: 'warn', label: 'Verified (no evidence)', artefact: artefactFor(gateId) };
    else status = { state: 'warn', label: 'Not started', artefact: artefactFor(gateId) };
  }

  if (gateId === 'definition-of-done') {
    if (stories.length === 0) status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    else if (stories.every(function(s) { return s.dodStatus === 'complete'; })) status = { state: 'pass', label: 'Complete', artefact: artefactFor(gateId) };
    else if (stories.some(function(s) { return s.dodStatus === 'complete'; })) status = { state: 'warn', label: 'In progress', artefact: artefactFor(gateId) };
    else status = { state: 'warn', label: 'Not started', artefact: artefactFor(gateId) };
  }

  if (gateId === 'trace') {
    if (feature.traceStatus === 'passed') status = { state: 'pass', label: 'Traced', artefact: artefactFor(gateId) };
    else if (feature.traceStatus === 'has-findings') status = { state: 'fail', label: 'Has findings', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'definition-of-done')) status = { state: 'warn', label: 'Pending', artefact: artefactFor(gateId) };
    else status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
  }

  if (gateId === 'release') {
    if (feature.stage === 'released' && stories.every(function(s) { return s.releaseReady === true; }))
      status = { state: 'pass', label: 'Released', artefact: artefactFor(gateId) };
    else if (feature.stage === 'released')
      status = { state: 'warn', label: 'Released (no evidence)', artefact: artefactFor(gateId) };
    else if (feature.stage === 'release-pending') status = { state: 'warn', label: 'Pending', artefact: artefactFor(gateId) };
    else status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
  }

  if (gateId === 'discovery') {
    if (feature.discoveryStatus === 'approved' || hasReachedStage(feature, 'benefit-metric'))
      status = { state: 'pass', label: 'Approved', artefact: artefactFor(gateId) };
    else if (feature.stage === 'discovery')
      status = { state: 'warn', label: 'In progress', artefact: artefactFor(gateId) };
    else if (feature.stage === 'ideation')
      status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    else
      status = { state: 'pass', label: 'Approved', artefact: artefactFor(gateId) };
  }

  if (gateId === 'benefit-metric') {
    const hasMetrics = Array.isArray(feature.metrics) && feature.metrics.length > 0;
    if (hasMetrics && hasReachedStage(feature, 'definition'))
      status = { state: 'pass', label: feature.metrics.length + ' metric' + (feature.metrics.length !== 1 ? 's' : '') + ' defined', artefact: artefactFor(gateId) };
    else if (hasMetrics)
      status = { state: 'warn', label: 'Defined', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'definition'))
      status = { state: 'warn', label: 'No metrics (stage assumed)', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'benefit-metric'))
      status = { state: 'warn', label: 'In progress', artefact: artefactFor(gateId) };
    else
      status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
  }

  if (gateId === 'definition') {
    const epics = feature.epics || [];
    const storyCount = allStories(feature).length;
    if (storyCount > 0 && hasReachedStage(feature, 'review'))
      status = { state: 'pass', label: epics.length + ' epic' + (epics.length !== 1 ? 's' : '') + ', ' + storyCount + ' stor' + (storyCount !== 1 ? 'ies' : 'y'), artefact: artefactFor(gateId) };
    else if (storyCount > 0)
      status = { state: 'warn', label: 'In progress', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'definition'))
      status = { state: 'warn', label: 'No stories yet', artefact: artefactFor(gateId) };
    else
      status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
  }

  if (gateId === 'architecture') {
    if (feature.architectureStatus === 'compliant')
      status = { state: 'pass', label: 'Compliant', artefact: artefactFor(gateId) };
    else if (feature.architectureStatus === 'has-findings')
      status = { state: 'fail', label: 'Has findings', artefact: artefactFor(gateId) };
    else if (stories.length > 0 && stories.every(function(s) { return s.reviewStatus === 'passed'; }))
      status = { state: 'pass', label: 'Reviewed (Category E)', artefact: artefactFor(gateId) };
    else if (stories.some(function(s) { return s.reviewStatus; }))
      status = { state: 'warn', label: 'Review in progress', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'review'))
      status = { state: 'warn', label: 'Pending', artefact: artefactFor(gateId) };
    else
      status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
  }

  if (gateId === 'decisions') {
    if (feature.decisionsLogged === true || (typeof feature.decisionsLogged === 'number' && feature.decisionsLogged > 0))
      status = { state: 'pass', label: 'Logged', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'branch-setup'))
      status = { state: 'warn', label: 'Not confirmed', artefact: artefactFor(gateId) };
    else if (hasReachedStage(feature, 'definition-of-ready'))
      status = { state: 'warn', label: 'Pending', artefact: artefactFor(gateId) };
    else
      status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
  }

  // ADR-005 and any unknown gates that exist in the gates array — evaluate via
  // stage proxy: pass if feature has reached a meaningful delivery stage.
  const known = ['review', 'test-plan', 'definition-of-ready', 'verify-completion',
    'definition-of-done', 'trace', 'release', 'discovery', 'benefit-metric',
    'definition', 'architecture', 'decisions'];
  if (!known.includes(gateId)) {
    const gateEntry = gates.find(function(x) { return x.id === gateId; });
    if (!gateEntry) {
      status = { state: 'na', label: 'Unknown gate', artefact: '' };
    } else {
      // Stage-proxy: if feature has reached review, assume upstream gates are complete.
      if (hasReachedStage(feature, 'review'))
        status = { state: 'pass', label: 'Stage proxy', artefact: artefactFor(gateId) };
      else
        status = { state: 'na', label: 'N/A', artefact: artefactFor(gateId) };
    }
  }

  return applyGovernancePolicy(feature, status, strictPolicy);
}

// Alias used in tests (matches the public API name in the user request)
const evaluateGate = gateStatus;

// ─────────────────────────────────────────────────────────────────────────────
// computeFleetSummary
// ─────────────────────────────────────────────────────────────────────────────

function computeFleetSummary(fleetState) {
  if (!fleetState) return { total: 0, drifted: 0, platformVersion: null };
  const repos = Array.isArray(fleetState.repos) ? fleetState.repos : [];
  const total = repos.length;
  const drifted = repos.filter(function(r) {
    // A repo is considered drifted if it has an explicit drift flag
    // or its platformVersion differs from the fleet's platformVersion.
    if (r.drifted === true) return true;
    if (fleetState.platformVersion && r.platformVersion && r.platformVersion !== fleetState.platformVersion) return true;
    return false;
  }).length;
  return {
    total,
    drifted,
    platformVersion: fleetState.platformVersion || null,
    lastSyncedAt: fleetState.lastSyncedAt || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export functions (pure build — no DOM, no Blob, no URL.createObjectURL)
// ─────────────────────────────────────────────────────────────────────────────

function buildExportJSON(state, fleet) {
  const payload = fleet ? Object.assign({}, state, { _fleet: fleet }) : Object.assign({}, state);
  return JSON.stringify(payload, null, 2);
}

function buildExportCSV(state) {
  const header = ['story_slug', 'story_name', 'feature_slug', 'feature_name', 'stage', 'health', 'dor_status', 'pr_status', 'dod_status', 'last_updated'];
  const lines = [header.join(',')];
  (state.features || []).forEach(function(f) {
    (f.epics || []).forEach(function(e) {
      (e.stories || []).forEach(function(s) {
        lines.push([
          s.slug || '',
          s.name || '',
          f.slug || '',
          f.name || '',
          s.stage || f.stage || '',
          s.health || f.health || '',
          s.dorStatus || '',
          s.prStatus || '',
          s.dodStatus || '',
          s.lastUpdated || f.lastUpdated || '',
        ].map(csvEscape).join(','));
      });
    });
  });
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// renderFleetPanel
// Fleet panel rendering — pure HTML string from fleet-state.json squads array.
// Used by pipeline-viz.html fleet panel and tested by check-viz-behaviour.js.
//
// A11Y MC-A11Y-02: health shown as colour class PLUS text label (not colour alone).
// A11Y MC-A11Y-01: squad cards rendered as <a> elements — natively keyboard-focusable.
// ─────────────────────────────────────────────────────────────────────────────

function fleetHealthLabel(health) {
  switch (health) {
    case 'green':   return '✓ Healthy';
    case 'amber':   return '⚠ Warning';
    case 'red':     return '✕ Blocked';
    case 'unknown': return '? Unknown';
    default:        return String(health || 'unknown');
  }
}

function fleetEsc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders a fleet panel HTML string from a fleet-state.json squads array.
 * Produces one squad card per entry. Cards are keyboard-accessible (<a> elements).
 * Health is indicated by a CSS class AND a text label (MC-A11Y-02).
 *
 * @param {Array<{ squadId, stage, health, updatedAt, sourceUrl, error? }>} squads
 * @returns {string} HTML string
 */
function renderFleetPanel(squads) {
  if (!Array.isArray(squads) || squads.length === 0) {
    return '<div class="fleet-panel"><p class="fleet-empty">No registered squads found.</p></div>';
  }

  const cards = squads.map(function(squad) {
    const health = squad.health || 'unknown';
    const label  = fleetHealthLabel(health);
    const error  = squad.error ? '<div class="fleet-card-error">' + fleetEsc(squad.error) + '</div>' : '';
    return (
      '<a class="fleet-card fleet-card--' + fleetEsc(health) + '" ' +
        'href="' + fleetEsc(squad.sourceUrl || '#') + '" ' +
        'aria-label="Squad ' + fleetEsc(squad.squadId) + ' — ' + fleetEsc(label) + '">' +
        '<div class="fleet-card-id">' + fleetEsc(squad.squadId) + '</div>' +
        '<div class="fleet-card-stage">' + fleetEsc(squad.stage || 'unknown') + '</div>' +
        '<div class="fleet-card-health fleet-health--' + fleetEsc(health) + '">' +
          '<span class="fleet-health-dot" aria-hidden="true"></span>' +
          '<span class="fleet-health-label">' + fleetEsc(label) + '</span>' +
        '</div>' +
        '<div class="fleet-card-updated">' + fleetEsc(squad.updatedAt || '') + '</div>' +
        error +
      '</a>'
    );
  });

  return (
    '<div class="fleet-panel">' +
      '<div class="fleet-grid">' +
        cards.join('') +
      '</div>' +
    '</div>'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Primary functions
  normalizeData,
  gateStatus,
  evaluateGate,
  storyNextSkill,
  featureActionMeta,
  channelLabel,
  computeFleetSummary,
  // Fleet panel
  renderFleetPanel,
  fleetHealthLabel,
  // Export builders
  buildExportJSON,
  buildExportCSV,
  csvEscape,
  // Helpers (exported for fine-grained test coverage)
  allStories,
  hasHighFindings,
  isReleaseReady,
  featureAgeMinutes,
  formatAge,
  stageRank,
  hasReachedStage,
  loopType,
  stageLabel,
  firstStorySlug,
  firstEpicSlug,
  // Constants (exposed for gate-list tests)
  DEFAULT_GOVERNANCE_GATES,
  PIPELINE_STAGE_ORDER,
  PROCESSING_STALE_MINUTES,
};
