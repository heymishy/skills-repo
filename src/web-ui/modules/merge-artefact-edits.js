'use strict';

// merge-artefact-edits.js — ADR-028 canonical builder. The ONLY place
// three-way merge logic lives in this codebase — no re-derivation
// elsewhere. Pure function: no I/O, no side effects.
//
// Algorithm: line-based three-way diff. For each line index across the
// longest of the three versions: if userA's line differs from base but
// userB's line at that index equals base's, take userA's line (attribute
// to userA). Symmetric for userB. If BOTH differ from base at the same
// index AND differ from each other, that is a hard conflict (throw). If
// both differ from base but agree with each other, no conflict (either
// user's line, unattributed — same edit made twice). Lines present in one
// user's version beyond the base's length (additions) are attributed to
// whichever user added them; if both add non-identical trailing content,
// that's also a hard conflict.

class MergeConflictError extends Error {
  constructor(message, lineNum) {
    super(message);
    this.code = 'MERGE_CONFLICT_HARD';
    this.lineNum = lineNum;
  }
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
  var baseLines  = baseContent.split('\n');
  var aLines     = userAContent.split('\n');
  var bLines     = userBContent.split('\n');
  var maxLen     = Math.max(baseLines.length, aLines.length, bLines.length);
  var mergedLines = [];
  var lineAttributions = {};

  for (var i = 0; i < maxLen; i++) {
    var baseLine = i < baseLines.length ? baseLines[i] : undefined;
    var aLine    = i < aLines.length    ? aLines[i]    : undefined;
    var bLine    = i < bLines.length    ? bLines[i]    : undefined;

    var aChanged = aLine !== baseLine;
    var bChanged = bLine !== baseLine;

    if (aChanged && bChanged) {
      if (aLine === bLine) {
        // Both made the identical change (or identical addition) -- no conflict.
        if (aLine !== undefined) mergedLines.push(aLine);
        continue;
      }
      // Genuine overlapping conflicting edit (includes one-deletes/one-edits,
      // since a deletion manifests as aLine === undefined !== bLine here).
      throw new MergeConflictError(
        'Conflicting edits at line ' + (i + 1) + ': both users modified the same line differently',
        i + 1
      );
    }

    if (aChanged) {
      if (aLine !== undefined) {
        mergedLines.push(aLine);
        lineAttributions[i + 1] = userIds.userAId;
      }
      // aLine === undefined means user A deleted this line and B did not touch it -- honor the deletion.
      continue;
    }

    if (bChanged) {
      if (bLine !== undefined) {
        mergedLines.push(bLine);
        lineAttributions[i + 1] = userIds.userBId;
      }
      continue;
    }

    // Neither changed this line.
    if (baseLine !== undefined) mergedLines.push(baseLine);
  }

  return { merged: mergedLines.join('\n'), lineAttributions: lineAttributions };
}

module.exports = { mergeArtefactEdits, MergeConflictError };
