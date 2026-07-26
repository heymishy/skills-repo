'use strict';

/**
 * canvas-marker-extractor.js — csd-s6: reads `---CANVAS-JSON: {...}---`
 * markers back out of committed artefact markdown (`design.md`, an epic
 * file) so the as-designed side of the drift comparison
 * (src/modules/drift-comparator.js) can be extracted from disk, the same
 * marker convention `/ideate`'s canvas mechanism already parses server-side
 * (src/web-ui/routes/skills.js's `parseCanvasBlock()`) — reused here rather
 * than inventing a second marker grammar (ADR-026).
 *
 * skills/design/SKILL.md and skills/definition/SKILL.md both document that a
 * diagram marker is refreshed IN PLACE (the existing marker's `content`
 * value is replaced) rather than appended as a duplicate — so where more
 * than one marker of the same type is found (e.g. an older, stale copy left
 * behind), the LAST one in document order is treated as canonical.
 */

const MARKER_RE = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/g;

/**
 * Extract every parseable CANVAS-JSON marker of the given type (or all types
 * if `type` is falsy) from a markdown string, in document order.
 * @param {string} markdownText
 * @param {string} [type]
 * @returns {Array<object>}
 */
function extractCanvasMarkersByType(markdownText, type) {
  const results = [];
  const re = new RegExp(MARKER_RE.source, 'g');
  let m;
  while ((m = re.exec(String(markdownText || ''))) !== null) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      continue; // an unparseable marker is skipped, never treated as a fatal error here
    }
    if (!type || parsed.type === type) results.push(parsed);
  }
  return results;
}

/**
 * The canonical (last, per the "refresh in place" convention) marker of the
 * given type, or null if none is present.
 * @param {string} markdownText
 * @param {string} type
 * @returns {object|null}
 */
function extractLatestCanvasMarkerByType(markdownText, type) {
  const all = extractCanvasMarkersByType(markdownText, type);
  return all.length ? all[all.length - 1] : null;
}

module.exports = {
  extractCanvasMarkersByType,
  extractLatestCanvasMarkerByType
};
