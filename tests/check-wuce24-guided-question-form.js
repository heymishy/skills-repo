'use strict';
/**
 * tests/check-wuce24-guided-question-form.js
 * 18 tests — wuce.24 Guided question form
 *
 * Tests are written to FAIL before implementation (TDD discipline).
 * Run: node tests/check-wuce24-guided-question-form.js
 */

const assert = require('assert'); // eslint-disable-line no-unused-vars
const fs     = require('fs');
const path   = require('path');

// ─── Import handlers + injection points from skills.js ────────────────────
const skillsRoute = require('../src/web-ui/routes/skills');
const {
  handleGetQuestionHtml,
  handlePostAnswerHtml,
  setGetNextQuestion,
  setSubmitAnswer,
  setQuestionAuditLogger
} = skillsRoute;

// ─── Test data ─────────────────────────────────────────────────────────────
const SKILL    = 'discovery';
const SID      = 'sess-abc123';
const Q_TEXT   = 'What problem are you solving?';
const NEXT_URL = '/skills/discovery/sessions/sess-abc/next';
const PREV_URL = '/skills/discovery/sessions/sess-abc/commit-preview';

// ─── Helpers ───────────────────────────────────────────────────────────────
function mockReqGet({ skillName = SKILL, sessionId = SID, authed = true } = {}) {
  return {
    method:  'GET',
    params:  { name: skillName, id: sessionId },
    headers: {},
    session: authed ? { accessToken: 'tok', userId: 'u1', login: 'tester' } : {}
  };
}

function mockReqPost({ skillName = SKILL, sessionId = SID, authed = true, bodyStr = 'answer=My+answer' } = {}) {
  return {
    method:   'POST',
    params:   { name: skillName, id: sessionId },
    headers:  { 'content-type': 'application/x-www-form-urlencoded' },
    session:  authed ? { accessToken: 'tok', userId: 'u1', login: 'tester' } : {},
    _bodyStr: bodyStr,
    on(event, cb) {
      if (event === 'data') cb(Buffer.from(this._bodyStr));
      if (event === 'end')  cb();
      return this;
    }
  };
}

function mockRes() {
  return {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.keys(hdrs).forEach(k => { this.headers[k.toLowerCase()] = hdrs[k]; });
    },
    end(chunk) { if (chunk) this.body += String(chunk); }
  };
}

let passed = 0;
let failed = 0;

function ok(label, condition) {
  if (condition) {
    console.log('  \u2713 ' + label);
    passed++;
  } else {
    console.error('  \u2717 ' + label);
    failed++;
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────
async function runTests() {

  // T1 — GET /skills/:name/sessions/:id/next → 200 HTML with question form
  console.log('\n  T1 — GET /skills/:name/sessions/:id/next → 200 HTML with question form');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T1: status 200',              res.statusCode === 200);
    ok('T1: Content-Type text/html',  (res.headers['content-type'] || '').includes('text/html'));
    ok('T1: body includes <!doctype html', res.body.toLowerCase().includes('<!doctype html'));
  }

  // T2 — question text displayed
  console.log('\n  T2 — HTML — question text displayed');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T2: body includes question text', res.body.includes(Q_TEXT));
  }

  // T3 — form has correct action URL and method POST
  console.log('\n  T3 — HTML — form has correct action URL and method POST');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T3: form action correct', res.body.includes('action="/api/skills/discovery/sessions/sess-abc123/answer"'));
    ok('T3: form method POST',    res.body.includes('method="POST"'));
  }

  // T4 — textarea with name="answer" present
  console.log('\n  T4 — HTML — textarea with name="answer" present');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T4: <textarea present', res.body.includes('<textarea'));
    ok('T4: name="answer"',     res.body.includes('name="answer"'));
  }

  // T5 — submit button with correct text
  console.log('\n  T5 — HTML — submit button with correct text');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T5: submit button present', res.body.includes('<button type="submit">Submit answer</button>'));
  }

  // T6 — textarea has associated <label> (WCAG 2.1 AA)
  console.log('\n  T6 — HTML — textarea has associated <label>');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T6: <label present',   res.body.includes('<label'));
    ok('T6: for="answer"',     res.body.includes('for="answer"'));
  }

  // T7 — POST answer → 303 to next question URL
  console.log('\n  T7 — POST /api/skills/:name/sessions/:id/answer → 303 to next question');
  {
    setSubmitAnswer(async () => ({ nextUrl: NEXT_URL }));
    const req = mockReqPost();
    const res = mockRes();
    await handlePostAnswerHtml(req, res);
    ok('T7: status 303',              res.statusCode === 303);
    ok('T7: Location header correct', res.headers['location'] === NEXT_URL);
  }

  // T8 — POST terminal state → 303 to commit-preview
  console.log('\n  T8 — POST answer when terminal (no more questions) → 303 to commit-preview');
  {
    setSubmitAnswer(async () => ({ nextUrl: PREV_URL }));
    const req = mockReqPost({ bodyStr: 'answer=Final+answer' });
    const res = mockRes();
    await handlePostAnswerHtml(req, res);
    ok('T8: status 303',                    res.statusCode === 303);
    ok('T8: Location is commit-preview URL', res.headers['location'] === PREV_URL);
  }

  // T9 — GET unknown session → 404 HTML page
  console.log('\n  T9 — GET next with unknown session ID → 404 HTML page');
  {
    setGetNextQuestion(async (sn, sid) => {
      if (sid === 'unknown-sess-id') { const e = new Error('Session not found'); e.status = 404; throw e; }
      return { question: Q_TEXT, questionIndex: 1, totalQuestions: 5 };
    });
    setQuestionAuditLogger(() => {});
    const req = mockReqGet({ sessionId: 'unknown-sess-id' });
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T9: status 404',              res.statusCode === 404);
    ok('T9: Content-Type text/html',  (res.headers['content-type'] || '').includes('text/html'));
    ok('T9: nav present (renderShell used)', res.body.includes('<nav'));
    ok('T9: no raw JSON in body',     !res.body.includes('{"error":'));
  }

  // T10 — POST unknown session → 404 HTML page
  console.log('\n  T10 — POST answer with unknown session ID → 404 HTML page');
  {
    setSubmitAnswer(async (sn, sid) => {
      if (sid === 'unknown-sess-id') { const e = new Error('Session not found'); e.status = 404; throw e; }
      return { nextUrl: NEXT_URL };
    });
    const req = mockReqPost({ sessionId: 'unknown-sess-id' });
    const res = mockRes();
    await handlePostAnswerHtml(req, res);
    ok('T10: status 404',             res.statusCode === 404);
    ok('T10: Content-Type text/html', (res.headers['content-type'] || '').includes('text/html'));
    ok('T10: no raw JSON in body',    !res.body.includes('{"error":'));
  }

  // T11 — XSS in question text escaped
  console.log('\n  T11 — GET next — XSS in question text escaped');
  {
    const xss = '<script>alert(1)</script>';
    setGetNextQuestion(async () => ({ question: xss, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T11: raw XSS not in body',  !res.body.includes('<script>alert(1)</script>'));
    ok('T11: XSS is HTML-escaped',  res.body.includes('&lt;script&gt;'));
  }

  // T12 — POST unknown session → 404 or 403 (not 200, not 303)
  console.log('\n  T12 — POST answer — session ID validated server-side');
  {
    setSubmitAnswer(async (sn, sid) => {
      if (sid === 'not-a-real-session') { const e = new Error('Session not found'); e.status = 404; throw e; }
      return { nextUrl: NEXT_URL };
    });
    const req = mockReqPost({ sessionId: 'not-a-real-session', bodyStr: 'answer=hacked' });
    const res = mockRes();
    await handlePostAnswerHtml(req, res);
    ok('T12: not 200', res.statusCode !== 200);
    ok('T12: not 303', res.statusCode !== 303);
  }

  // T13 — GET unauthenticated → 302 /auth/github
  console.log('\n  T13 — GET /skills/:name/sessions/:id/next unauthenticated → 302');
  {
    const req = mockReqGet({ authed: false });
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T13: status 302',              res.statusCode === 302);
    ok('T13: Location /auth/github',   res.headers['location'] === '/auth/github');
  }

  // T14 — POST unauthenticated → 302
  console.log('\n  T14 — POST answer unauthenticated → 302');
  {
    const req = mockReqPost({ authed: false });
    const res = mockRes();
    await handlePostAnswerHtml(req, res);
    ok('T14: status 302', res.statusCode === 302);
  }

  // T15 — HTML form requires no JavaScript
  console.log('\n  T15 — HTML form requires no JavaScript');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T15: no onclick= attribute', !res.body.includes('onclick='));
    ok('T15: no addEventListener',   !res.body.includes('addEventListener'));
    ok('T15: form method present',   res.body.includes('method="POST"'));
    ok('T15: form action present',   res.body.includes('action='));
  }

  // T16 — progress indicator displayed (questionIndex: 1, totalQuestions: 5)
  console.log('\n  T16 — question progress indicator displayed');
  {
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T16: questionIndex 1 present in body',    res.body.includes('1'));
    ok('T16: totalQuestions 5 present in body',   res.body.includes('5'));
  }

  // T17 — handleGetQuestionHtml is a named export (static analysis)
  console.log('\n  T17 — handleGetQuestionHtml is a named export from routes/skills.js');
  {
    const skillsPath = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
    const source = fs.readFileSync(skillsPath, 'utf8');
    ok('T17: handleGetQuestionHtml in source', source.includes('handleGetQuestionHtml'));
    ok('T17: appears in module.exports block',
      source.includes('handleGetQuestionHtml') &&
      /module\.exports\s*=\s*\{[^}]*handleGetQuestionHtml/.test(source.replace(/\n/g, ' ')));
  }

  // T18 — audit log written on GET next
  console.log('\n  T18 — audit log written on GET next');
  {
    let capturedLog = null;
    setGetNextQuestion(async () => ({ question: Q_TEXT, questionIndex: 1, totalQuestions: 5 }));
    setQuestionAuditLogger(function(data) { capturedLog = data; });
    const req = mockReqGet();
    const res = mockRes();
    await handleGetQuestionHtml(req, res);
    ok('T18: audit log called',                capturedLog !== null);
    ok('T18: audit log has userId',            capturedLog !== null && capturedLog.userId !== undefined);
    ok('T18: audit log route is literal string', capturedLog !== null && capturedLog.route === '/skills/:name/sessions/:id/next');
    ok('T18: audit log has skillName',         capturedLog !== null && capturedLog.skillName === SKILL);
    ok('T18: audit log has sessionId',         capturedLog !== null && capturedLog.sessionId === SID);
    ok('T18: audit log has timestamp',         capturedLog !== null && typeof capturedLog.timestamp === 'string');
  }

}

runTests().then(() => {
  console.log('\n[wuce24-guided-question-form] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
