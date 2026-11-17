'use strict';
// lpw-s3 T1 (AC1) -- the board's script sends the page's CSRF token with every advance request (issue #1140).
// Plain Node script. Run: node tests/check-lpw-s3-board-advance-token.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const view = require(path.join(root, 'src', 'web-ui', 'views', 'kanban-view'));

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

function board(extra) {
  return view.renderKanban(Object.assign({
    columns: [
      { stage: 'discovery', cards: [{ id: 'j-ready', title: 'Ready card', health: 'green', healthLabel: 'On track', ready: true }] },
      { stage: 'benefit-metric', cards: [] }
    ]
  }, extra || {}));
}

test('T1a the board script carries the page token and sends it as _csrf with the advance request', function () {
  const html = board({ csrfToken: 'tok-abc123' });
  assert.ok(/KB_CSRF\s*=\s*"tok-abc123"/.test(html), 'the script must hold the page token in KB_CSRF');
  // the board script is emitted without newlines, so read a fixed window after the function's opening brace
  const fn = (html.match(/function _kbTriggerAdvance\(journeyId\)\s*\{[\s\S]{0,400}/) || [''])[0];
  assert.ok(fn.indexOf('_csrf') !== -1 && fn.indexOf('KB_CSRF') !== -1, 'the shared advance call must send _csrf: KB_CSRF; got: ' + fn.slice(0, 300));
});

test('T1b the drag path and the button path share that one request (so both carry the token)', function () {
  const html = board({ csrfToken: 'tok-abc123' });
  const direct = html.match(/fetch\("\/api\/board\/journey\//g) || [];
  assert.strictEqual(direct.length, 1, 'exactly one place may call the advance endpoint, found ' + direct.length);
  assert.ok(/kbAdvanceCard[\s\S]*_kbTriggerAdvance\(/.test(html) && /kbColumnDrop[\s\S]*_kbTriggerAdvance\(/.test(html), 'button and drop must both go through _kbTriggerAdvance');
});

test('T1c a token that contains markup cannot break out of the script element', function () {
  const html = board({ csrfToken: 'a</script><img src=x onerror=alert(1)>' });
  assert.ok(html.indexOf('</script><img') === -1, 'the token must be escaped inside the script');
});

test('T1d with no token supplied the script holds an empty string, never "undefined"', function () {
  const html = board({});
  assert.ok(/KB_CSRF\s*=\s*""/.test(html), 'KB_CSRF must default to an empty string');
  assert.ok(html.indexOf('undefined') === -1 || !/KB_CSRF\s*=\s*"?undefined/.test(html));
});

test('T1e the product, org and tenant board handlers each pass the session token to renderKanban', function () {
  const src = fs.readFileSync(path.join(root, 'src', 'web-ui', 'routes', 'products.js'), 'utf8');
  const calls = [];
  const re = /_kanbanView\.renderKanban\(/g;
  let m;
  while ((m = re.exec(src)) !== null) calls.push(src.slice(m.index, m.index + 700));
  assert.strictEqual(calls.length, 3, 'expected 3 board render sites, found ' + calls.length);
  calls.forEach(function (c, i) { assert.ok(/csrfToken/.test(c), 'render site ' + (i + 1) + ' does not pass csrfToken: ' + c.slice(0, 160)); });
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s3] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s3] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s3] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
