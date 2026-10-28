'use strict';
// src/utils/capture-target-derivation.js -- actr-s1. Shared, pure, I/O-free
// derivation of a capture target {acId, url, selector} from a single E2E
// spec file's own text. Extends scripts/playback-capture.js's existing
// deriveSelectorFromSpec (story rpca-s2) with URL derivation, relocated here
// so both scripts/playback-capture.js and src/web-ui/routes/playback-
// evidence.js (actr-s2/actr-s3) can reuse it without duplicating the
// regex-based parsing. See decisions.md's 2026-10-28 CORRECTION entry for
// why this scans FORWARD from the AC tag, not backward.

/**
 * Finds the nearest page.goto('<path>') call within `textAfterTag` -- same
 * scan direction as the existing selector logic (deriveSelectorFromSpec's
 * own "nearest FOLLOWING locator" rule). `textAfterTag` is sliced to start
 * at the AC's own tag match, but is NOT YET bounded to stop before the next
 * AC's own section in a multi-AC file -- that bounding lands in a later
 * task. Returns the raw matched string (not yet validated against the
 * relative-path guard, also a later task) or null if no goto appears.
 * @param {string} textAfterTag - spec text sliced to start at the AC's own tag match
 * @returns {string|null}
 */
function _firstGotoIn(textAfterTag) {
  const gotoMatch = textAfterTag.match(/page\.goto\(['"]([^'"]+)['"]\)/);
  return gotoMatch ? gotoMatch[1] : null;
}

/**
 * Derives a capture target {acId, url, selector} from a single E2E spec
 * file's own text. Pure, synchronous, no I/O.
 *
 * AC1/AC4: selector-half behaviour matches deriveSelectorFromSpec exactly --
 * same AC-tag anchor (`\b<acId>)`), same "nearest FOLLOWING
 * page.locator(...)" rule, same null-if-no-AC-tag-match behaviour.
 *
 * AC2: url is derived from the nearest page.goto('<path>') call AFTER the
 * AC tag, via the `_firstGotoIn` helper -- same forward scan direction as
 * the selector rule above. A goto call preceding the AC tag is never
 * picked up. See decisions.md's 2026-10-28 CORRECTION entry for why this
 * scans forward rather than backward.
 *
 * @param {string} specFileContent
 * @param {string} acId
 * @returns {{acId: string, url: string|null, selector: string|null}|null}
 */
function deriveCaptureTargetFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\)`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;

  const rest = specFileContent.slice(acMatch.index);
  const locatorMatch = rest.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  const selector = locatorMatch ? locatorMatch[1] : null;

  const rawUrl = _firstGotoIn(rest);

  return { acId, url: rawUrl, selector };
}

module.exports = { deriveCaptureTargetFromSpec };
