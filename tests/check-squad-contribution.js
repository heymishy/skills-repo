#!/usr/bin/env node
/**
 * tests/check-squad-contribution.js
 *
 * Automated tests for p3.12 squad contribution flow:
 *   docs/squad-contribution-guide.md  — contribution guide content (AC1, AC2, AC3)
 *   CONTRIBUTING.md                   — platform section + link (AC4)
 *   (no new scripts or CI config)     — documentation-only check (AC5)
 *
 * AC coverage:
 *   AC1 (x5) — contribution-guide-exists
 *              contribution-guide-has-proposal-flow-section
 *              contribution-guide-has-required-pr-contents-section
 *              contribution-guide-has-approval-gate-section
 *              contribution-guide-has-merge-path-section
 *   AC2      — contribution-guide-eval-md-references-trace-id-and-failure-pattern
 *   AC3      — contribution-guide-contains-pr-description-template
 *   AC4      — contributing-md-section-and-link-to-guide
 *   AC5      — pr-diff-contains-only-documentation-files
 *
 * Run: node tests/check-squad-contribution.js
 * Used: npm test
 *
 * Zero external npm dependencies — plain Node.js (fs, path) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var root          = path.join(__dirname, '..');
var guideFile     = path.join(root, 'docs', 'squad-contribution-guide.md');
var contributing  = path.join(root, 'CONTRIBUTING.md');

// ── Test harness ──────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function containsAll(content, terms) {
  return terms.every(function (t) {
    return content.toLowerCase().indexOf(t.toLowerCase()) !== -1;
  });
}

// ── AC1: Guide exists and has all 5 required flow sections ───────────────────

process.stdout.write('\n[p3.12-squad-contribution] AC1 \u2014 guide existence and required sections\n');

// contribution-guide-exists
(function () {
  var name = 'contribution-guide-exists';
  try {
    if (fs.existsSync(guideFile)) {
      pass(name);
    } else {
      fail(name, 'docs/squad-contribution-guide.md does not exist');
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// contribution-guide-has-proposal-flow-section
(function () {
  var name = 'contribution-guide-has-proposal-flow-section';
  try {
    if (!fs.existsSync(guideFile)) {
      fail(name, 'Guide file does not exist — skipping content check');
      return;
    }
    var content = readFile(guideFile);
    var hasFeatureBranch = containsAll(content, ['feature branch']);
    var hasPropose       = containsAll(content, ['propose']);
    if (hasFeatureBranch && hasPropose) {
      pass(name);
    } else {
      fail(name, 'Guide missing "feature branch" or "propose" language in flow section. Found feature-branch: ' + hasFeatureBranch + ', found propose: ' + hasPropose);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// contribution-guide-has-required-pr-contents-section
(function () {
  var name = 'contribution-guide-has-required-pr-contents-section';
  try {
    if (!fs.existsSync(guideFile)) {
      fail(name, 'Guide file does not exist — skipping content check');
      return;
    }
    var content = readFile(guideFile);
    var hasSkillMd      = containsAll(content, ['skill.md']);
    var hasEvalMd       = containsAll(content, ['eval.md']);
    var hasPerfEvidence = containsAll(content, ['performance evidence']);
    if (hasSkillMd && hasEvalMd && hasPerfEvidence) {
      pass(name);
    } else {
      fail(name, 'Guide missing one or more required PR artefact types. SKILL.md: ' + hasSkillMd + ', EVAL.md: ' + hasEvalMd + ', performance evidence: ' + hasPerfEvidence);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// contribution-guide-has-approval-gate-section
(function () {
  var name = 'contribution-guide-has-approval-gate-section';
  try {
    if (!fs.existsSync(guideFile)) {
      fail(name, 'Guide file does not exist — skipping content check');
      return;
    }
    var content = readFile(guideFile);
    var hasPlatformReviewer = containsAll(content, ['platform reviewer']);
    var hasApproval         = containsAll(content, ['approval', 'sign-off']);
    if (hasPlatformReviewer && hasApproval) {
      pass(name);
    } else {
      fail(name, 'Approval gate section missing "platform reviewer" or sign-off requirement. platform-reviewer: ' + hasPlatformReviewer + ', approval/sign-off: ' + hasApproval);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// contribution-guide-has-merge-path-section
(function () {
  var name = 'contribution-guide-has-merge-path-section';
  try {
    if (!fs.existsSync(guideFile)) {
      fail(name, 'Guide file does not exist — skipping content check');
      return;
    }
    var content = readFile(guideFile);
    var hasPlatformTeamMerge = containsAll(content, ['platform team']);
    var hasNotSelfMerge      = containsAll(content, ['does not merge']);
    if (hasPlatformTeamMerge && hasNotSelfMerge) {
      pass(name);
    } else {
      fail(name, 'Merge path section missing platform-team merge authority or contributing-squad exclusion. platform-team: ' + hasPlatformTeamMerge + ', does-not-merge: ' + hasNotSelfMerge);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// ── AC2: EVAL.md requirements name traceId + failurePattern ──────────────────

process.stdout.write('\n[p3.12-squad-contribution] AC2 \u2014 EVAL.md requirements reference traceId + failurePattern\n');

(function () {
  var name = 'contribution-guide-eval-md-references-trace-id-and-failure-pattern';
  try {
    if (!fs.existsSync(guideFile)) {
      fail(name, 'Guide file does not exist — skipping content check');
      return;
    }
    var content = readFile(guideFile);
    var hasTraceId        = content.indexOf('traceId') !== -1;
    var hasFailurePattern = content.indexOf('failurePattern') !== -1;
    // Reference to p3.4 requirements — either explicit story name or mention of suite.json validation
    var hasP34Reference   = content.indexOf('p3.4') !== -1 || content.indexOf('validate-suite-entry') !== -1 || content.indexOf('suite.json') !== -1;
    if (hasTraceId && hasFailurePattern && hasP34Reference) {
      pass(name);
    } else {
      fail(name, 'EVAL.md requirements section missing mandatory fields or p3.4 reference. traceId: ' + hasTraceId + ', failurePattern: ' + hasFailurePattern + ', p3.4-reference: ' + hasP34Reference);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// ── AC3: Guide contains PR description template ───────────────────────────────

process.stdout.write('\n[p3.12-squad-contribution] AC3 \u2014 PR description template present\n');

(function () {
  var name = 'contribution-guide-contains-pr-description-template';
  try {
    if (!fs.existsSync(guideFile)) {
      fail(name, 'Guide file does not exist — skipping content check');
      return;
    }
    var content = readFile(guideFile);
    // Template must contain all 5 required fields: skill name, use case, delivery story ref, 3+ EVAL.md cases, reviewer name
    var hasSkillName     = containsAll(content, ['skill name']);
    var hasUseCase       = containsAll(content, ['use case']);
    var hasDeliveryStory = containsAll(content, ['delivery story']);
    var hasEvalCases     = containsAll(content, ['eval.md test case']);
    var hasReviewer      = containsAll(content, ['platform reviewer']);
    if (hasSkillName && hasUseCase && hasDeliveryStory && hasEvalCases && hasReviewer) {
      pass(name);
    } else {
      fail(name, 'PR description template missing one or more required fields. skill-name: ' + hasSkillName + ', use-case: ' + hasUseCase + ', delivery-story: ' + hasDeliveryStory + ', eval-cases: ' + hasEvalCases + ', reviewer: ' + hasReviewer);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// ── AC4: CONTRIBUTING.md has platform section + link ─────────────────────────

process.stdout.write('\n[p3.12-squad-contribution] AC4 \u2014 CONTRIBUTING.md section and link\n');

(function () {
  var name = 'contributing-md-section-and-link-to-guide';
  try {
    if (!fs.existsSync(contributing)) {
      fail(name, 'CONTRIBUTING.md does not exist at repo root');
      return;
    }
    var content = readFile(contributing);
    var hasSection   = containsAll(content, ['contributing to the skills platform']);
    var hasLink      = content.indexOf('docs/squad-contribution-guide.md') !== -1;
    var hasExclusion = containsAll(content, ['delivery-repo', 'artefacts', 'workspace']);
    if (hasSection && hasLink && hasExclusion) {
      pass(name);
    } else {
      fail(name, 'CONTRIBUTING.md missing required elements. section-heading: ' + hasSection + ', link-to-guide: ' + hasLink + ', delivery-repo-exclusion: ' + hasExclusion);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// ── AC5: No new automation files in this story ───────────────────────────────

process.stdout.write('\n[p3.12-squad-contribution] AC5 \u2014 no new CI automation or scripts\n');

(function () {
  var name = 'pr-diff-contains-only-documentation-files';
  try {
    // Verify that the story's scope is documentation only — check that the
    // files it introduces (guide + CONTRIBUTING.md) exist and that no
    // p3.12-specific CI configuration files were added.
    // We check that no file matching p3.12 exists in .github/workflows or scripts/
    var workflowsDir = path.join(root, '.github', 'workflows');
    var scriptsDir   = path.join(root, 'scripts');

    function hasP312Automation(dir) {
      if (!fs.existsSync(dir)) return false;
      var files = fs.readdirSync(dir);
      return files.some(function (f) {
        return f.toLowerCase().indexOf('p3.12') !== -1 || f.toLowerCase().indexOf('squad-contribution') !== -1;
      });
    }

    var workflowAutomation = hasP312Automation(workflowsDir);
    var scriptAutomation   = hasP312Automation(scriptsDir);

    if (!workflowAutomation && !scriptAutomation) {
      pass(name);
    } else {
      fail(name, 'Found p3.12-related automation files. workflows: ' + workflowAutomation + ', scripts: ' + scriptAutomation);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[p3.12-squad-contribution] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failures.length) {
  process.stdout.write('\nFailed tests:\n');
  failures.forEach(function (f) {
    process.stdout.write('  - ' + f.name + ': ' + f.reason + '\n');
  });
  process.exit(1);
}

process.exit(0);
