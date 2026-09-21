'use strict';

// merge-artefact-edits.js — ADR-028 canonical builder. The ONLY place
// three-way merge logic lives in this codebase — no re-derivation
// elsewhere. Pure function: no I/O, no side effects.
//
// Algorithm: LCS (Longest Common Subsequence)-based three-way HUNK merge
// (the same family of algorithm as classic `diff3`/git's own merge
// machinery). A naive positional/index-based comparison (baseLines[i] vs
// aLines[i] vs bLines[i] at the same array index) breaks the instant
// either side inserts or deletes a line, because every subsequent index
// comparison is then against the wrong base line — producing both false
// conflicts (unrelated edits made to "collide" purely by index-shift)
// and silent mis-attribution. An earlier version of this module fixed
// that specific bug via LCS-based alignment, but computed conflicts at
// whole-SEGMENT granularity (the gap between "dual anchors" — base lines
// left unchanged by BOTH sides) — which reintroduced a related false-
// conflict bug: two adjacent lines edited by DIFFERENT sides, with no
// unchanged line between them to anchor on, were treated as one
// indivisible span and falsely flagged as conflicting even though the
// two sides never touched the same line. Fixed here by working at HUNK
// granularity (each side's own maximal contiguous run of changed/deleted/
// inserted base-line-range, computed independently) and only raising a
// conflict when two hunks' base-line RANGES actually overlap:
//
//   1. Compute an LCS-based alignment between baseLines and aLines, and
//      separately between baseLines and bLines (per-side, independent).
//      Each alignment maps a base line index to the (single,
//      monotonically increasing) index of the identical line in that
//      user's version, or leaves it unmapped if that user changed or
//      deleted it.
//   2. For each side independently, derive a list of "hunks" from its
//      own alignment: each hunk names the base-line range it replaces
//      (a maximal contiguous run of unmatched base indices, or a
//      zero-width point for a pure insertion between two matched
//      indices) and that side's own replacement content for that range.
//   3. Merge the two sides' hunk lists by walking base-line position:
//      unchanged base lines (covered by neither side's hunk list) pass
//      through unattributed; a base range covered by only one side's
//      hunk(s) is replaced by that side's content, attributed to that
//      side; a base range where BOTH sides have overlapping hunks is
//      only a genuine MERGE_CONFLICT_HARD if their combined replacement
//      content actually differs — if both sides made the identical
//      change (or identical insertion) independently, it passes through
//      unattributed instead. Overlapping hunks of different sizes from
//      each side are transitively unioned into one cluster before this
//      comparison, so a wider one-sided hunk correctly absorbs a
//      narrower hunk from the other side that falls partly within it.
//
// An O(n*m) dynamic-programming LCS (the standard diff algorithm
// approach) is used per side -- more than sufficient for artefact-sized
// files; a 1000-line file (NFR-Perf-1) completes in low tens of
// milliseconds, comfortably under the 1s budget. The hunk-merge walk
// itself is linear in the number of hunks plus base lines.

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

// Derives one side's own list of hunks from its base alignment: each hunk
// names the base-line range [baseStart, baseEnd) it replaces (a maximal
// contiguous run of base indices this side changed/deleted, or a
// zero-width point between two matched indices for a pure insertion)
// and this side's own replacement content for that range. Hunks are
// produced in base-position order.
function computeHunks(baseLen, matchX, xLines) {
  var hunks = [];
  var prevMatchedBase = -1;
  var prevMatchedX = -1;

  function flush(baseEndExclusive) {
    var baseGapStart = prevMatchedBase + 1;
    var xGapStart = prevMatchedX + 1;
    var xGapEnd = baseEndExclusive === baseLen ? xLines.length : matchX[baseEndExclusive];
    if (baseEndExclusive > baseGapStart || xGapEnd > xGapStart) {
      hunks.push({ baseStart: baseGapStart, baseEnd: baseEndExclusive, content: xLines.slice(xGapStart, xGapEnd) });
    }
  }

  for (var i = 0; i < baseLen; i++) {
    if (matchX[i] === -1) continue;
    flush(i);
    prevMatchedBase = i;
    prevMatchedX = matchX[i];
  }
  flush(baseLen);

  return hunks;
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

  var hunksA = computeHunks(baseLines.length, matchA, aLines);
  var hunksB = computeHunks(baseLines.length, matchB, bLines);

  var mergedLines = [];
  var lineAttributions = {};
  var mergedLineNum = 0;

  function pushLine(line, attributedTo) {
    mergedLineNum++;
    mergedLines.push(line);
    if (attributedTo) lineAttributions[mergedLineNum] = attributedTo;
  }

  var ai = 0, bi = 0;
  var pos = 0;

  while (ai < hunksA.length || bi < hunksB.length) {
    var nextA = ai < hunksA.length ? hunksA[ai] : null;
    var nextB = bi < hunksB.length ? hunksB[bi] : null;

    var candidateStart = Infinity;
    if (nextA) candidateStart = Math.min(candidateStart, nextA.baseStart);
    if (nextB) candidateStart = Math.min(candidateStart, nextB.baseStart);

    if (candidateStart > pos) {
      for (var k = pos; k < candidateStart; k++) pushLine(baseLines[k], null);
      pos = candidateStart;
      continue;
    }

    // Seed the cluster with every hunk (from either side) whose baseStart
    // is EXACTLY pos -- these necessarily belong to the same cluster
    // regardless of size, since they start at the same base position.
    var clusterEnd = pos;
    var clusterA = [];
    var clusterB = [];
    while (nextA && nextA.baseStart === pos) {
      clusterA.push(nextA);
      clusterEnd = Math.max(clusterEnd, nextA.baseEnd);
      ai++;
      nextA = ai < hunksA.length ? hunksA[ai] : null;
    }
    while (nextB && nextB.baseStart === pos) {
      clusterB.push(nextB);
      clusterEnd = Math.max(clusterEnd, nextB.baseEnd);
      bi++;
      nextB = bi < hunksB.length ? hunksB[bi] : null;
    }

    // Grow: absorb any FURTHER hunk whose baseStart falls STRICTLY inside
    // the accumulated cluster range -- genuine overlap, not mere
    // adjacency. A hunk whose baseStart merely equals the cluster's
    // current end touches a completely disjoint set of base lines and
    // must NOT be absorbed here (this is the exact bug an earlier version
    // of this fix had: using <= instead of < treated two hunks that are
    // adjacent-but-non-overlapping -- e.g. [19,20) and [20,21), from two
    // different users editing two different, non-overlapping lines with
    // no unchanged line between them -- as one indivisible conflicting
    // span, producing a false MERGE_CONFLICT_HARD on a genuinely safe
    // concurrent edit).
    var grew = true;
    while (grew) {
      grew = false;
      if (nextA && nextA.baseStart < clusterEnd) {
        clusterA.push(nextA);
        clusterEnd = Math.max(clusterEnd, nextA.baseEnd);
        ai++;
        nextA = ai < hunksA.length ? hunksA[ai] : null;
        grew = true;
      }
      if (nextB && nextB.baseStart < clusterEnd) {
        clusterB.push(nextB);
        clusterEnd = Math.max(clusterEnd, nextB.baseEnd);
        bi++;
        nextB = bi < hunksB.length ? hunksB[bi] : null;
        grew = true;
      }
    }

    if (clusterA.length > 0 && clusterB.length === 0) {
      clusterA.forEach(function (h) { h.content.forEach(function (l) { pushLine(l, userIds.userAId); }); });
    } else if (clusterB.length > 0 && clusterA.length === 0) {
      clusterB.forEach(function (h) { h.content.forEach(function (l) { pushLine(l, userIds.userBId); }); });
    } else {
      var aContent = [];
      clusterA.forEach(function (h) { aContent = aContent.concat(h.content); });
      var bContent = [];
      clusterB.forEach(function (h) { bContent = bContent.concat(h.content); });

      if (arraysEqual(aContent, bContent)) {
        aContent.forEach(function (l) { pushLine(l, null); });
      } else {
        throw new MergeConflictError(
          'Conflicting edits near base line ' + (pos + 1) +
          ': both users modified overlapping content differently',
          pos + 1
        );
      }
    }

    pos = clusterEnd;
  }

  for (var k2 = pos; k2 < baseLines.length; k2++) pushLine(baseLines[k2], null);

  return { merged: mergedLines.join('\n'), lineAttributions: lineAttributions };
}

module.exports = { mergeArtefactEdits, MergeConflictError };
