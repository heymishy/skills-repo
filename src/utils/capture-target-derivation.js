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
 * Derives a capture target {acId, url, selector} from a single E2E spec
 * file's own text. Pure, synchronous, no I/O.
 *
 * AC1/AC4: selector-half behaviour matches deriveSelectorFromSpec exactly --
 * same AC-tag anchor (`\b<acId>)`), same "nearest FOLLOWING
 * page.locator(...)" rule, same null-if-no-AC-tag-match behaviour.
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

  return { acId, url: null, selector };
}

module.exports = { deriveCaptureTargetFromSpec };
