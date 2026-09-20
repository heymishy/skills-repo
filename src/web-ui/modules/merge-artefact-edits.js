'use strict';

// merge-artefact-edits.js — ADR-028 canonical builder. The ONLY place
// three-way merge logic lives in this codebase — no re-derivation
// elsewhere. Pure function: no I/O, no side effects.
//
// Algorithm: LCS (Longest Common Subsequence)-based three-way line diff
// and merge (the same family of algorithm as classic `diff3`). A naive
// positional/index-based comparison (baseLines[i] vs aLines[i] vs
// bLines[i] at the same array index) breaks the instant either side
// inserts or deletes a line, because every subsequent index comparison
// is then against the wrong base line — producing both false conflicts
// (unrelated edits made to "collide" purely by index-shift) and silent
// mis-attribution (unrelated unchanged lines credited to whichever user
// happened to shift the array). This implementation re-aligns lines
// properly before comparing them:
//
//   1. Compute an LCS-based alignment between baseLines and aLines, and
//      separately between baseLines and bLines. Each alignment maps a
//      base line index to the (single, monotonically increasing) index
//      of the identical line in that user's version, or leaves it
//      unmapped if that user changed or deleted it.
//   2. A base line index mapped by BOTH alignments is a "sync anchor" --
//      neither user touched that line's content, so it is a safe
//      re-synchronisation point for both diffs simultaneously.
//   3. Walking anchor-to-anchor (plus the spans before the first anchor
//      and after the last), each span is a "segment": the base content
//      between two anchors, and each side's replacement content for
//      that same span (whatever falls between the two sides' matched
//      anchor indices in their own line arrays -- this correctly
//      captures pure insertions, pure deletions, and edits alike,
//      without needing a separate "replace" case).
//   4. Per segment: if neither side's content differs from base, emit
//      base content unattributed. If only one side differs, emit that
//      side's content, attributed to that side (this also correctly
//      handles a pure deletion -- an empty replacement -- by emitting
//      nothing and creating no attribution entries). If both sides
//      differ: if their replacement content is identical (same edit,
//      or same insertion, made independently by both), emit it
//      unattributed with no conflict. Otherwise this is a genuine
//      MERGE_CONFLICT_HARD -- both sides changed the same span of the
//      artefact differently (covers edit-vs-edit on the same line,
//      delete-vs-edit, and insert-vs-insert of non-identical content at
//      the same point).
//
// An O(n*m) dynamic-programming LCS (the standard diff algorithm
// approach) is used per side -- more than sufficient for artefact-sized
// files; a 1000-line file (NFR-Perf-1) completes in low tens of
// milliseconds, comfortably under the 1s budget.

class MergeConflictError extends Error {
  constructor(message, lineNum) {
    super(message);
    this.name = 'MergeConflictError';
    this.code = 'MERGE_CONFLICT_HARD';
    this.lineNum = lineNum;
  }
}

// Splits artefact text into lines, normalizing CRLF to LF first so a
// Windows-authored edit and a Unix-authored edit of the same logical
// line still compare equal.
function splitLines(content) {
  return content.replace(/\r\n/g, '\n').split('\n');
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Computes an LCS-based alignment from baseLines to otherLines.
// Returns an array of length baseLines.length where entry i is the
// (monotonically increasing) index into otherLines that baseLines[i]
// is matched to (i.e. an unchanged line), or -1 if baseLines[i] has no
// match in otherLines (changed or deleted by "other").
function lcsMatch(baseLines, otherLines) {
  var n = baseLines.length;
  var m = otherLines.length;

  // dp[i][j] = length of the LCS of baseLines[i:] and otherLines[j:].
  // Built as a suffix table so the subsequent forward walk (from (0,0))
  // reconstructs the alignment directly, without a second backtrack pass.
  var dp = new Array(n + 1);
  for (var i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);

  for (i = n - 1; i >= 0; i--) {
    for (var j = m - 1; j >= 0; j--) {
      if (baseLines[i] === otherLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  var matchBaseToOther = new Array(n).fill(-1);
  var bi = 0, oi = 0;
  while (bi < n && oi < m) {
    if (baseLines[bi] === otherLines[oi]) {
      matchBaseToOther[bi] = oi;
      bi++; oi++;
    } else if (dp[bi + 1][oi] >= dp[bi][oi + 1]) {
      bi++;
    } else {
      oi++;
    }
  }

  return matchBaseToOther;
}

/**
 * @param {string} baseContent
 * @param {string} userAContent
 * @param {string} userBContent
 * @param {{userAId: string, userBId: string}} userIds
 * @returns {{merged: string, lineAttributions: Object<number,string>}}
 * @throws {MergeConflictError} on an unresolvable overlapping edit
 */
function mergeArtefactEdits(baseContent, userAContent, userBContent, userIds) {
  var baseLines = splitLines(baseContent);
  var aLines = splitLines(userAContent);
  var bLines = splitLines(userBContent);

  var matchA = lcsMatch(baseLines, aLines);
  var matchB = lcsMatch(baseLines, bLines);

  // Sync anchors: base line indices left untouched by BOTH sides.
  var anchors = [];
  for (var i = 0; i < baseLines.length; i++) {
    if (matchA[i] !== -1 && matchB[i] !== -1) anchors.push(i);
  }

  var mergedLines = [];
  var lineAttributions = {};
  var mergedLineNum = 0;

  function pushLine(line, attributedTo) {
    mergedLineNum++;
    mergedLines.push(line);
    if (attributedTo) lineAttributions[mergedLineNum] = attributedTo;
  }

  // Emits the merge result for the base span strictly between
  // prevAnchorBaseIdx and nextAnchorBaseIdx (using -1 / baseLines.length
  // as the "before first" / "after last" sentinels).
  function processSegment(prevAnchorBaseIdx, nextAnchorBaseIdx) {
    var baseSeg = baseLines.slice(prevAnchorBaseIdx + 1, nextAnchorBaseIdx);

    var aStart = prevAnchorBaseIdx === -1 ? 0 : matchA[prevAnchorBaseIdx] + 1;
    var aEnd = nextAnchorBaseIdx === baseLines.length ? aLines.length : matchA[nextAnchorBaseIdx];
    var aSeg = aLines.slice(aStart, aEnd);

    var bStart = prevAnchorBaseIdx === -1 ? 0 : matchB[prevAnchorBaseIdx] + 1;
    var bEnd = nextAnchorBaseIdx === baseLines.length ? bLines.length : matchB[nextAnchorBaseIdx];
    var bSeg = bLines.slice(bStart, bEnd);

    var aChanged = !arraysEqual(aSeg, baseSeg);
    var bChanged = !arraysEqual(bSeg, baseSeg);

    if (!aChanged && !bChanged) {
      for (var k = 0; k < baseSeg.length; k++) pushLine(baseSeg[k], null);
      return;
    }
    if (aChanged && !bChanged) {
      for (k = 0; k < aSeg.length; k++) pushLine(aSeg[k], userIds.userAId);
      return;
    }
    if (!aChanged && bChanged) {
      for (k = 0; k < bSeg.length; k++) pushLine(bSeg[k], userIds.userBId);
      return;
    }
    // Both sides changed this span.
    if (arraysEqual(aSeg, bSeg)) {
      // Independently made the identical change (or identical
      // insertion) -- no conflict, unattributed (either user's copy).
      for (k = 0; k < aSeg.length; k++) pushLine(aSeg[k], null);
      return;
    }
    throw new MergeConflictError(
      'Conflicting edits near base line ' + (prevAnchorBaseIdx + 2) +
      ': both users modified the same content differently',
      prevAnchorBaseIdx + 2
    );
  }

  var prevAnchor = -1;
  for (var a = 0; a < anchors.length; a++) {
    processSegment(prevAnchor, anchors[a]);
    pushLine(baseLines[anchors[a]], null);
    prevAnchor = anchors[a];
  }
  processSegment(prevAnchor, baseLines.length);

  return { merged: mergedLines.join('\n'), lineAttributions: lineAttributions };
}

module.exports = { mergeArtefactEdits, MergeConflictError };
