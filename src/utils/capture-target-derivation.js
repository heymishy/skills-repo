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
 * own "nearest FOLLOWING locator" rule). `textAfterTag` is expected to
 * already be bounded to the AC's own section by the caller (see
 * deriveCaptureTargetFromSpec's `section` computation) -- this helper
 * itself does no bounding, it only finds the first goto in whatever text
 * it's given. Returns the raw matched string (not yet validated against
 * the relative-path guard -- that's a later task) or null if no goto
 * appears.
 * @param {string} textAfterTag - spec text already bounded to one AC's own section
 * @returns {string|null}
 */
function _firstGotoIn(textAfterTag) {
  const gotoMatch = textAfterTag.match(/page\.goto\(['"]([^'"]+)['"]\)/);
  return gotoMatch ? gotoMatch[1] : null;
}

/**
 * actr-s1 (AC3): a spec-derived URL is only ever trusted if it is a
 * same-origin relative path -- never absolute (https://...) or
 * protocol-relative (//...), both of which would change the host a later,
 * session-authenticated Playwright page.goto() call actually navigates to.
 * See decisions.md's 2026-10-28 SECURITY entry.
 *
 * Normalizes the string into the same shape a real WHATWG-URL-spec
 * navigator (including Playwright's Chromium) will actually parse it as,
 * BEFORE checking -- two confirmed bypasses were found and fixed this way:
 * (1) ASCII tab/newline/carriage-return, which a real navigator strips
 * before parsing (so "/\t/evil.com" is really "//evil.com"); (2) backslash,
 * which for "special" schemes (http/https/etc.) a real navigator treats
 * identically to forward slash (so "/\evil.com" is really "//evil.com").
 * Without BOTH normalizations, a naive startsWith('//') check judges
 * different bytes than what the actual downstream page.goto() call will
 * interpret -- a validator that doesn't match the real parser it's
 * protecting against isn't actually validating anything. See decisions.md's
 * 2026-10-28 SECURITY FINDING entries (both bypasses logged there).
 * @param {string|null} rawUrl
 * @returns {string|null}
 */
function _validateRelativeUrl(rawUrl) {
  if (!rawUrl) return null;
  const sanitized = rawUrl.replace(/[\t\n\r]/g, '').replace(/\\/g, '/');
  if (sanitized.startsWith('//')) return null;
  if (!sanitized.startsWith('/')) return null;
  return rawUrl;
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
 * AC2b: the scan above is bounded to this AC's own section -- it stops at
 * the next AC's own tag (if any) found anywhere later in the file, so a
 * different AC's goto/locator can never be picked up for this one. Applies
 * uniformly to both the selector and url scans.
 *
 * AC3: the derived url is validated as a same-origin relative path before
 * being returned -- an absolute (https://...) or protocol-relative (//...)
 * value is rejected (url: null) rather than passed through, via
 * _validateRelativeUrl.
 *
 * @param {string} specFileContent
 * @param {string} acId
 * @returns {{acId: string, url: string|null, selector: string|null}|null}
 */
function deriveCaptureTargetFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\)`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;

  // AC2b: bound the section to the next AC tag found anywhere in the file
  // (if any) -- generic \bAC\d+\) pattern, not this acId specifically, so a
  // later, DIFFERENT AC's own goto/locator can never be picked up for this
  // one. Mirrors rpca-s2-hotfix1's own per-AC-section isolation for the
  // selector scan, now applied uniformly to both fields.
  const afterTag = specFileContent.slice(acMatch.index + acMatch[0].length);
  const nextAcMatch = afterTag.match(/\bAC\d+\)/);
  const sectionEnd = nextAcMatch
    ? acMatch.index + acMatch[0].length + nextAcMatch.index
    : specFileContent.length;
  const section = specFileContent.slice(acMatch.index, sectionEnd);

  const locatorMatch = section.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  const selector = locatorMatch ? locatorMatch[1] : null;

  const rawUrl = _firstGotoIn(section);

  return { acId, url: _validateRelativeUrl(rawUrl), selector };
}

module.exports = { deriveCaptureTargetFromSpec };
