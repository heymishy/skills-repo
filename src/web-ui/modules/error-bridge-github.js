'use strict';
// coha-s6: the only file that knows GitHub's HTTP shape (ADR-012). The handler and store never see a URL.
//
// Error contract with the handler:
//   - name 'GithubTimeout' for the adapter's idle (socket inactivity) timeout, default 7000 ms (never definite).
//   - redirects are never followed: any 3xx is a status error.
//   - definite === true ONLY when the failure proves no issue was created: an HTTP error status other than 408,
//     or a connection that failed before any request byte was sent (ECONNREFUSED, ENOTFOUND, EAI_AGAIN).
//   - everything else (408, reset or broken connection, unparseable 2xx, bad issue number) is ambiguous: definite is not set.
//   - messages never carry a URL, a header, a token or response text.
const http = require('http');
const https = require('https');

const LABEL = 'production-error';
const PRE_SEND_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];

function githubError(message, definite) {
  const e = new Error(message);
  e.name = 'GithubError';
  if (definite) e.definite = true;
  return e;
}

// Wiring-time validation: a bad configuration throws at construction so server.js keeps the D37 stub (route answers 503).
// Messages name the problem only, never a value (the token, or a token pasted into the wrong variable, must not be logged).
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
function configError(problem) {
  const e = new Error('invalid configuration: ' + problem);
  e.name = 'GithubConfigError';
  return e;
}
function validateConfig(token, repo, apiBase) {
  if (typeof token !== 'string' || token === '') throw configError('token is empty');
  if (typeof repo !== 'string' || !REPO_RE.test(repo) || repo.split('/').some((s) => s === '.' || s === '..')) {
    throw configError('repo must be "owner/name" (letters, digits, ".", "-", "_"; no "." or ".." segment)');
  }
  let u;
  try { u = new URL(apiBase); } catch (e) { throw configError('apiBase is not a valid URL'); }
  // A path prefix is allowed (GitHub Enterprise uses /api/v3); a query string, a fragment or userinfo is not.
  // The raw-string checks also catch an empty "?", "#" or "@" that URL parsing normalises away.
  if (u.search || u.hash || u.username || u.password || /[?#@]/.test(apiBase)) {
    throw configError('apiBase must not contain a query string, a fragment or userinfo');
  }
  if (u.protocol === 'https:') return;
  // Plain http would send the token in cleartext; allowed only for a local test server.
  if (u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost')) return;
  throw configError('apiBase must be https (plain http only for 127.0.0.1 or localhost)');
}

function createGithubAdapter(opts) {
  const token = opts.token;
  const repo = opts.repo; // "owner/name"
  const apiBase = (opts.apiBase || 'https://api.github.com').replace(/\/+$/, '');
  validateConfig(token, repo, apiBase);
  // Idle (socket inactivity) timeout, not a total-duration bound. The 7000 ms default fires before the handler's own 8000 ms bound.
  const timeoutMs = opts.timeoutMs || 7000;

  function call(method, pathname, payload) {
    return new Promise((resolve, reject) => {
      const u = new URL(apiBase + pathname);
      const data = payload === undefined ? null : Buffer.from(JSON.stringify(payload));
      const headers = {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'skills-framework-error-bridge',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = data.length; }
      const lib = u.protocol === 'http:' ? http : https;
      const req = lib.request({ method, hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, headers }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const status = res.statusCode;
          if (status < 200 || status >= 300) {
            // The message carries the status only: never the response text, never a header.
            // Every HTTP error status proves no issue was created, except 408 (a request timeout may follow a processed request).
            return reject(githubError('github status ' + status, status !== 408));
          }
          const text = Buffer.concat(chunks).toString('utf8');
          try { resolve(text ? JSON.parse(text) : {}); } catch (e) { reject(githubError('github bad response', false)); }
        });
        res.on('error', () => reject(githubError('github request failed', false)));
      });
      req.setTimeout(timeoutMs, () => { req.destroy(Object.assign(new Error('github timeout'), { name: 'GithubTimeout' })); });
      req.on('error', (e) => {
        if (e && e.name === 'GithubTimeout') return reject(e);
        if (e && PRE_SEND_CODES.indexOf(e.code) !== -1) {
          // Failed before any request byte was sent: nothing can have been created. Keep the code, drop the original message (it holds host and port).
          const err = new Error('github connection failed');
          err.name = 'GithubError'; err.code = e.code; err.definite = true;
          return reject(err);
        }
        const err = new Error('github request failed');
        err.name = 'GithubError'; if (e && e.code) err.code = e.code;
        reject(err);
      });
      if (data) req.write(data);
      req.end();
    });
  }

  return {
    async createIssue(issue) {
      const out = await call('POST', '/repos/' + repo + '/issues', { title: issue.title, body: issue.body, labels: issue.labels });
      if (!out || !Number.isInteger(out.number)) throw githubError('github bad response', false);
      return { number: out.number };
    },
    // Lists the 100 most recent issues carrying the label (any state) via the list endpoint (read-your-writes, not the search API).
    // Returns the integer number whose body holds the marker line, or null ONLY when confirmed absent. Throws on any failure to look.
    async findIssueByMarker(markerLine) {
      const list = await call('GET', '/repos/' + repo + '/issues?labels=' + LABEL + '&state=all&per_page=100');
      if (!Array.isArray(list)) throw githubError('github bad response', false);
      // The issues list endpoint also returns pull requests (they carry a pull_request key); never match those.
      const hit = list.find((i) => i && !Object.prototype.hasOwnProperty.call(i, 'pull_request') && typeof i.body === 'string' &&i.body.split(/\r?\n/).indexOf(markerLine) !== -1);
      if (!hit) return null;
      if (!Number.isInteger(hit.number)) throw githubError('github bad response', false);
      return hit.number;
    }
  };
}

module.exports = { createGithubAdapter };
