'use strict';
// pws-s1: pure helpers for the production-wiring smoke test (tests/check-pws-s1-production-wiring-smoke.js).
// Story: artefacts/2026-11-17-production-wiring-smoke-test/stories/pws-s1-production-wiring-smoke-test.md

// Names of the setters that the throwing stubs tell the caller to use, e.g.
//   throw new Error('Adapter not wired: getCommitResult. Call setGetCommitResult() with a real implementation before use.')
function scanStubSetters(sourceTexts) {
  const found = new Set();
  const re = /Adapter not wired:[^'"`\n]*?\bCall (set\w+)\(\)/g;
  (sourceTexts || []).forEach(function (text) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(String(text))) !== null) found.add(m[1]);
  });
  return Array.from(found).sort();
}

// stubs: setter names named by stubs. called: setter names the boot actually called. allow: { setterName: { reason, story } }.
// Returns findings: a stub setter nobody called and nobody allow-listed, or an allow-list entry that is stale.
function findUnwired(stubs, called, allow) {
  const stubSet = new Set(stubs || []);
  const calledSet = new Set(called || []);
  const allowed = allow || {};
  const findings = [];
  stubSet.forEach(function (name) {
    if (!calledSet.has(name) && !Object.prototype.hasOwnProperty.call(allowed, name)) {
      findings.push({ kind: 'unwired', setter: name });
    }
  });
  Object.keys(allowed).forEach(function (name) {
    if (!stubSet.has(name)) findings.push({ kind: 'stale-allow-entry', setter: name, why: 'no stub names this setter' });
    else if (calledSet.has(name)) findings.push({ kind: 'stale-allow-entry', setter: name, why: 'it is wired at boot now' });
  });
  return findings;
}

// Reads the regex literals passed to pathname.match( ... ) in the router and turns the plain ones into
// concrete path templates with {id} where a [^/]+ segment is. Patterns with alternation, optional or
// repeated groups are skipped (reported separately), never guessed at.
function extractRoutePatterns(serverSource) {
  const src = String(serverSource);
  const out = [];
  const skipped = [];
  const marker = 'pathname.match(/';
  let from = 0;
  for (;;) {
    const at = src.indexOf(marker, from);
    if (at === -1) break;
    let i = at + marker.length;
    let inClass = false;
    let body = '';
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '\\') { body += c + src[i + 1]; i++; continue; }
      if (c === '[') inClass = true;
      else if (c === ']') inClass = false;
      else if (c === '/' && !inClass) break;
      body += c;
    }
    from = i + 1;
    if (body.charAt(0) !== '^' || body.charAt(body.length - 1) !== '$') { skipped.push(body); continue; }
    let t = body.slice(1, -1).replace(/\(\[\^\/\]\+\)/g, '[^/]+');
    t = t.split('[^/]+').join('\u0000');
    if (/[()|?*+\[\]{}]/.test(t.replace(/\\./g, ''))) { skipped.push(body); continue; }
    t = t.replace(/\\(.)/g, '$1').split('\u0000').join('{id}');
    if (out.indexOf(t) === -1) out.push(t);
  }
  return { patterns: out, skipped: skipped };
}

module.exports = { scanStubSetters, findUnwired, extractRoutePatterns };
