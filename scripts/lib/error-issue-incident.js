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
  const number = isObj && Number.isInteger(issue.number) && issue.number > 0 ? issue.number : null;
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
  if (typeof issue.html_url !== 'string' || !ISSUE_URL_RE.test(issue.html_url)) return decline('shape');
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

// The record fields handed to the existing incident recorder. Nothing but the fixed fields.
function planRecord(r) {
  return {
    trigger: 'GitHub issue ' + r.issueUrl + ' (PostHog issue id ' + r.id + ')',
    summary: r.code,
    tags: [LABEL, 'posthog:' + r.id]
  };
}

module.exports = {
  LABEL, MARKER_PREFIX, BRANCH_PREFIX, UUID_RE, ISSUE_URL_RE, MAX_CODE,
  codeProblem, normaliseEvent, recogniseIssue, branchNameFor, planRecord
};