#!/usr/bin/env node
// tests/check-ep3-s2-decisions-entry.js -- AC1/AC2/AC3 field-level
// verification for ep3-s2 (Auto-Generate decisions.md Entry on
// Regression). Distinct from tests/check-ep3-s1-integration.js's own
// decisions.md coverage (title-substring + prefix-preservation only):
// this file parses every field (date, context, decision, rationale,
// actor, stageReverted) out of the real entry handlePostJourneyRegress
// writes and asserts each against the actual request values, catching
// field-level corruption (e.g. a swapped or truncated rationale) that a
// substring check would miss. No new production code -- ep3-s1's
// handler already satisfies this story's ACs; see decisions.md's
// ep3-s2 entries for the full architecture investigation.

'use strict';
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const REPO_ROOT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(REPO_ROOT_ADAPTER_PATH)]; } catch (_) {}
  return { jStore: require(JOURNEY_STORE_PATH), j: require(JOURNEY_PATH) };
}

function makeRes() {
  const res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

const CSRF_TOKEN = 'csrf-tok-ep3s2';

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
    params: {},
    body: { _csrf: CSRF_TOKEN },
    headers: {}
  }, overrides);
}

var passed = 0, failed = 0;
function check(label, ok) { if (ok) { console.log('  [PASS] ' + label); passed++; } else { console.error('  [FAIL] ' + label); failed++; } }

// Parses this codebase's real decisions.md entry format
// (## Title / **Date:** / **Context:** / **Decision:** / **Rationale:**)
// into a plain object -- the AC2 substance-mapping this test exists to verify.
function parseLastEntry(content) {
  const entries = content.split(/\n## /).slice(1); // drop the file header before the first "## "
  const last = entries[entries.length - 1];
  const title = last.split('\n')[0].trim();
  const date = (last.match(/\*\*Date:\*\*\s*(.+)/) || [])[1];
  const context = (last.match(/\*\*Context:\*\*\s*(.+)/) || [])[1];
  const decision = (last.match(/\*\*Decision:\*\*\s*(.+)/) || [])[1];
  // Assumes `reason` never contains a literal "\n## " -- matching production's
  // current lack of that restriction (handlePostJourneyRegress only trims and
  // length-caps `reason`). A reason containing that exact substring would
  // corrupt the entries.split() boundary above, before this regex even runs --
  // a production content-injection question, not a defect in this parser.
  const rationale = (last.match(/\*\*Rationale:\*\*\s*([\s\S]+?)\n*$/) || [])[1];
  const actorMatch = title.match(/by (\S+)$/);
  const stageMatch = title.match(/^Regressed to (\S+) by/);
  return {
    title, date, context, decision, rationale: rationale && rationale.trim(),
    actor: actorMatch && actorMatch[1],
    stageReverted: stageMatch && stageMatch[1],
    isRegressionEntry: /^Regressed to /.test(title)
  };
}

async function main() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s2-test-'));
  r.j.setRepoRoot(tmpDir);
  const featureSlug = 'ep3s2-decisions-entry';

  const j = r.jStore.createJourney(featureSlug, 'default');
  r.jStore.completeStage(j.journeyId, 'discovery', 'artefacts/' + featureSlug + '/discovery.md');
  r.jStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/' + featureSlug + '/benefit-metric.md');
  r.jStore.completeStage(j.journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
  r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'review', tenantId: 'tenant-a', ownerId: 'susan' });

  const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
  const priorContent = '# Decisions — ' + featureSlug + '\n\n## Prior approval\n\n**Date:** 2026-01-01\n**Context:** seeded before this test.\n**Decision:** approved.\n**Rationale:** prior entry fixture.\n';
  fs.mkdirSync(path.dirname(decisionsPath), { recursive: true });
  fs.writeFileSync(decisionsPath, priorContent, 'utf8');
  const priorEntryCount = priorContent.split(/\n## /).length - 1;

  const reasonText = 'Definition is missing architecture details for multi-tenancy.';
  const startTime = Date.now();
  const res = makeRes();
  await r.j.handlePostJourneyRegress(makeReq({
    params: { journeyId: j.journeyId },
    body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: reasonText }
  }), res, null);
  const elapsedMs = Date.now() - startTime;

  check('Handler returns 200', res._code === 200);

  // AC1: entry appended, prior entry preserved
  const afterContent = fs.readFileSync(decisionsPath, 'utf8');
  const afterEntryCount = afterContent.split(/\n## /).length - 1;
  check('AC1: entry count increased by exactly 1', afterEntryCount === priorEntryCount + 1);
  check('AC1: prior entry content is an exact untouched prefix of the new content', afterContent.indexOf(priorContent) === 0);

  // AC2: all 6 field categories present and populated with REAL, non-placeholder values
  const entry = parseLastEntry(afterContent);
  const placeholderPattern = /\[TBD\]|\[FILL IN\]|^TBD$|^null$|^undefined$|^$/i;
  check('AC2: date is present and non-placeholder', !!entry.date && !placeholderPattern.test(entry.date));
  check('AC2: date is a valid YYYY-MM-DD date', /^\d{4}-\d{2}-\d{2}$/.test(entry.date || ''));
  check('AC2: entry is identifiable as a regression-type entry (title pattern, substance of "session-phase: regression")', entry.isRegressionEntry === true);
  check('AC2: decision is present, non-placeholder, and names the target stage', !!entry.decision && !placeholderPattern.test(entry.decision) && entry.decision.indexOf('definition') !== -1);
  check('AC2: reason (rationale) is present, non-placeholder, and matches the request exactly', entry.rationale === reasonText);
  // Not one of ep3-s2.md's own 2 NFRs (2s write latency, no-refresh visibility)
  // -- this >5-char floor comes from the DoR's own AC2b test description, not
  // the story artefact itself. Kept as a real, cheap sanity check that the
  // reason is substantive and not a placeholder, not attributed to an NFR.
  check('AC2: reason is a substantive, non-trivial value (>5 characters)', (entry.rationale || '').length > 5);
  check('AC2: actor is present, non-placeholder, and matches the requesting user', entry.actor === 'susan');
  check('AC2: stageReverted is present, non-placeholder, and matches the target stage exactly', entry.stageReverted === 'definition');

  // AC3: written to disk within 2 seconds, no delayed/batched write
  check('AC3: handler completed (and decisions.md was written) within 2000ms', elapsedMs <= 2000);
  check('AC3: entry is present on disk immediately after the handler returns (no polling/retry needed)', fs.readFileSync(decisionsPath, 'utf8').indexOf(entry.title) !== -1);

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n[ep3-s2-decisions-entry] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function(err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
