'use strict';
// signal-context.js -- ep2-s2: pure functions turning a signal's hidden form
// fields (ep2-s1's own signalSource/signalType/signalText/signalTimestamp
// convention) into a single priorArtefacts-shaped entry (ADR-023). No I/O,
// no adapter calls -- independently unit-testable in isolation, matching
// ep2-s1's own views/signals-panel-view.js precedent.

const REQUIRED_FIELDS = ['signalSource', 'signalType', 'signalText'];

/**
 * @param {object} body — req.body after csrfGuard's own body-read side effect
 * @returns {{source:string,type:string,text:string,timestamp:?string}|null}
 *   null when no signal-context field is present at all (the existing ep1-s3
 *   non-seeded CTA shape -- AC5 byte-identical path).
 * @throws {Error} when some but not all required fields are present/non-empty
 */
function extractSignalContext(body) {
  body = body || {};
  const hasAny = !!(body.signalSource || body.signalType || body.signalText || body.signalTimestamp);
  if (!hasAny) return null;

  const missing = REQUIRED_FIELDS.filter(function(f) { return !body[f]; });
  if (missing.length > 0) {
    throw new Error('Missing required signal field(s): ' + missing.join(', '));
  }

  return {
    source:    body.signalSource,
    type:      body.signalType,
    text:      body.signalText,
    timestamp: body.signalTimestamp || null
  };
}

/**
 * @param {{source:string,type:string,text:string,timestamp:?string}} ctx
 * @returns {{path:string,content:string}} a single priorArtefacts entry (ADR-023)
 */
function formatSignalPriorArtefact(ctx) {
  const content = [
    'Signal source: ' + ctx.source,
    'Signal type: ' + ctx.type,
    'Signal timestamp: ' + (ctx.timestamp || 'unknown'),
    '',
    ctx.text
  ].join('\n');
  return { path: 'signal:' + ctx.source, content: content };
}

module.exports = { extractSignalContext, formatSignalPriorArtefact };
