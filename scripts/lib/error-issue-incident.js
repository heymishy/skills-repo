'use strict';
// coha-s7: recognise a bridge-opened production error issue and plan its incident record.
// Pure functions over data: no git, no network, no file access. Issue text is untrusted data.

const LABEL = 'production-error';
const MARKER_PREFIX = 'PostHog issue id: ';
const BRANCH_PREFIX = 'incident/posthog-';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ISSUE_URL_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/issues\/[0-9]+$/;
const MAX_CODE = 120;
const CODE_BAD_RE = /[\u0000-\u001f\u007f\u2028\u2029]/;

// The code is the issue title. It is stored as data and shown only inside inline code.
function codeProblem(code) {
  if (typeof code !== 'string' || code.length === 0) return 'empty';
  if (code.length > MAX_CODE) return 'long';
  if (CODE_BAD_RE.test(code)) return 'control';
  return null;
}

// Accepts the event payload ({ issue }) or a bare REST issue object and returns { issue }.
function normaliseEvent(data) {
  if (data && typeof data === 'object' && data.issue && typeof data.issue === 'object') return data;
  return { issue: data };
}

function lineValue(lines, prefix) {
  const l = lines.find((x) => x.indexOf(prefix) === 0);
  return l === undefined ? '' : l.slice(prefix.length);
}

// Returns { recognised: true, ... } or { recognised: false, reason, issueNumber }.
function recogniseIssue(event, config) {
  const issue = normaliseEvent(event).issue;
  const isObj = issue !== null && typeof issue === 'object';
  const number = isObj && Number.isSafeInteger(issue.number) && issue.number > 0 ? issue.number : null;
  const decline = (reason) => ({ recognised: false, reason: reason, issueNumber: number });
  if (!isObj) return decline('shape');
  if (Object.prototype.hasOwnProperty.call(issue, 'pull_request')) return decline('pull-request');

  const expected = config && config.bridgeAuthor;
  if (typeof expected !== 'string' || expected.trim() === '') return decline('author');
  const login = issue.user && issue.user.login;
  if (typeof login !== 'string' || login !== expected) return decline('author');

  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  if (!labels.some((l) => l && l.name === LABEL)) return decline('label');

  const body = typeof issue.body === 'string' ? issue.body : '';
  const lines = body.split(/\r?\n/);
  const candidates = lines.filter((l) => l.indexOf(MARKER_PREFIX) === 0).map((l) => l.slice(MARKER_PREFIX.length));
  if (candidates.length === 0) return decline('marker');
  if (new Set(candidates).size > 1) return decline('marker-ambiguous');
  const id = candidates[0];
  if (!UUID_RE.test(id)) return decline('id');

  if (number === null) return decline('shape');
  if (typeof issue.html_url !== 'string' || !ISSUE_URL_RE.test(issue.html_url) || !issue.html_url.endsWith('/issues/' + number)) return decline('shape');
  if (codeProblem(issue.title) !== null) return decline('code');

  return {
    recognised: true,
    issueNumber: number,
    issueUrl: issue.html_url,
    code: issue.title,
    id: id,
    firstSeen: lineValue(lines, 'First seen: '),
    environment: lineValue(lines, 'Environment: '),
    postHogLink: lineValue(lines, 'PostHog: ')
  };
}

function branchNameFor(id) {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new Error('invalid id');
  return BRANCH_PREFIX + id;
}

// Validates a recogniseIssue or validatePlanForBuild result and returns a plain copy of the four fields; callers use only the copy.
function assertFields(r) {
  if (!r || typeof r !== 'object') throw new Error('not recognised');
  const c = { id: r.id, code: r.code, issueNumber: r.issueNumber, issueUrl: r.issueUrl };
  if (typeof c.id !== 'string' || !UUID_RE.test(c.id) ||
      codeProblem(c.code) !== null ||
      !Number.isSafeInteger(c.issueNumber) || c.issueNumber <= 0 ||
      typeof c.issueUrl !== 'string' || !ISSUE_URL_RE.test(c.issueUrl) || !c.issueUrl.endsWith('/issues/' + c.issueNumber)) {
    throw new Error('not recognised');
  }
  return c;
}

// The record fields handed to the existing incident recorder. Nothing but the fixed fields.
function planRecord(r) {
  const c = assertFields(r);
  return {
    trigger: 'GitHub issue ' + c.issueUrl + ' (PostHog issue id ' + c.id + ')',
    summary: c.code,
    tags: [LABEL, 'posthog:' + c.id]
  };
}

// Title and body use only the fixed code (inline code, one line, backticks replaced) and the issue number.
function buildPullRequest(r) {
  const c = assertFields(r);
  const safe = c.code.replace(/`/g, "'");
  return {
    title: 'Incident record for `' + safe + '` (issue #' + c.issueNumber + ')',
    body: 'Adds one incident record for `' + safe + '` from issue #' + c.issueNumber + '. It exists only on this pull request until it is merged.'
  };
}

// facts: { id, records, branches, openPullRequests }; options: { rebuild }.
// A record already on master always skips; the rebuild switch lifts only the branch and pull request skips.
function decideIdempotency(facts, options) {
  const f = facts || {};
  const o = options || {};
  const branch = branchNameFor(f.id);
  const tag = 'posthog:' + f.id;
  const list = (v) => {
    if (v === undefined) return [];
    if (!Array.isArray(v)) throw new Error('bad facts');
    return v;
  };
  const records = list(f.records);
  const branches = list(f.branches);
  const prs = list(f.openPullRequests);
  if (records.some((r) => r && Array.isArray(r.tags) && r.tags.some((t) => String(t).trim().toLowerCase() === tag))) return { action: 'skip', reason: 'already-recorded' };
  // A fork pull request never counts: the id is public, so anyone could publish a fork branch with this name.
  const prOpen = prs.some((p) => p && p.headRefName === branch && p.isCrossRepository !== true);
  const branchExists = branches.indexOf(branch) !== -1;
  if (prOpen || branchExists) {
    if (o.rebuild === true) return { action: 'rebuild', reason: 'rebuild' };
    return { action: 'skip', reason: prOpen ? 'pr-open' : 'branch-exists' };
  }
  return { action: 'open', reason: 'new' };
}

// input: { event, config: { bridgeAuthor }, facts: { records, branches, openPullRequests }, options: { rebuild, dryRun } }
// Returns a plan: { action: decline | skip | open | rebuild | dry-run, reason, issueNumber, id, branch, code, issueUrl, record, pullRequest }.
function planRun(input) {
  const options = input.options || {};
  const r = recogniseIssue(input.event, input.config);
  if (!r.recognised) {
    return { action: 'decline', reason: r.reason, issueNumber: r.issueNumber, id: null, branch: null, code: null, issueUrl: null, record: null, pullRequest: null };
  }
  const facts = input.facts || {};
  const branch = branchNameFor(r.id);
  const common = { issueNumber: r.issueNumber, id: r.id, branch: branch, code: r.code, issueUrl: r.issueUrl };
  const idem = decideIdempotency({ id: r.id, records: facts.records, branches: facts.branches, openPullRequests: facts.openPullRequests }, options);
  if (idem.action === 'skip') return Object.assign({ action: 'skip', reason: idem.reason, record: null, pullRequest: null }, common);
  const record = planRecord(r);
  const pullRequest = buildPullRequest(r);
  if (options.dryRun) return Object.assign({ action: 'dry-run', reason: idem.action === 'rebuild' ? 'would-rebuild' : 'would-open', record: record, pullRequest: pullRequest }, common);
  return Object.assign({ action: idem.action, reason: idem.reason, record: record, pullRequest: pullRequest }, common);
}

// The record job never trusts the plan it receives: it re-checks every field it uses.
function validatePlanForBuild(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('bad plan');
  if (plan.action !== 'open' && plan.action !== 'rebuild') throw new Error('nothing to build');
  if (typeof plan.id !== 'string' || !UUID_RE.test(plan.id)) throw new Error('bad id');
  if (!Number.isSafeInteger(plan.issueNumber) || plan.issueNumber <= 0) throw new Error('bad issue number');
  if (typeof plan.issueUrl !== 'string' || !ISSUE_URL_RE.test(plan.issueUrl) || !plan.issueUrl.endsWith('/issues/' + plan.issueNumber)) throw new Error('bad issue url');
  if (codeProblem(plan.code) !== null) throw new Error('bad code');
  return { action: plan.action, id: plan.id, code: plan.code, issueNumber: plan.issueNumber, issueUrl: plan.issueUrl };
}

module.exports = {
  LABEL, MARKER_PREFIX, BRANCH_PREFIX, UUID_RE, ISSUE_URL_RE, MAX_CODE,
  codeProblem, normaliseEvent, recogniseIssue, branchNameFor, planRecord,
  buildPullRequest, decideIdempotency, planRun, validatePlanForBuild
};