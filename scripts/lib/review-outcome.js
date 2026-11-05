'use strict';

function decideReviewOutcome(specResult, qualityResult) {
  const specOk = specResult && specResult.status === 'pass';
  const qualityOk = qualityResult && qualityResult.status === 'pass';

  if (specOk && qualityOk) {
    return { action: 'accept-both' };
  }
  // Spec takes priority when both need a fix: fix spec first, quality gets
  // re-dispatched against the post-spec-fix code regardless of its own
  // pre-fix outcome, since that code is about to change anyway.
  if (!specOk) {
    return { action: 'redispatch-quality', discard: 'quality' };
  }
  return { action: 'redispatch-spec', discard: 'spec' };
}

module.exports = { decideReviewOutcome };
