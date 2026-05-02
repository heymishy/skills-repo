'use strict';

// annotation-writer.js — SCM adapter for committing artefact annotations (ADR-012, wuce.8)
// commitAnnotation(artefactPath, sectionHeading, annotationText, token)
// Committer identity is always the authenticated user's token from session.
// Security: token from req.session.accessToken — never a server-level service token.

const { appendAnnotation } = require('../utils/annotation-utils');

/**
 * Custom error thrown on 409 conflict from GitHub Contents API.
 */
class AnnotationConflictError extends Error {
  constructor(message) {
    super(message || 'Conflict: artefact file was updated since loaded');
    this.name = 'AnnotationConflictError';
  }
}

/**
 * Fetch the current artefact file from GitHub and return { content, sha }.
 * @param {string} artefactPath - repository-relative path
 * @param {string} token - user OAuth token
 * @returns {Promise<{ content: string, sha: string }>}
 */
async function _fetchArtefact(artefactPath, token) {
  const owner   = process.env.GITHUB_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO_NAME;
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  const url     = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;

  const res = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept:        'application/vnd.github+json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch artefact: ' + res.status);

  const data    = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { content, sha: data.sha };
}

/**
 * Commit an annotation to an artefact file using the authenticated user's token.
 * On 409 conflict: fetches current SHA, retries once. If retry also fails, throws AnnotationConflictError.
 *
 * @param {string} artefactPath - repository-relative path to target artefact
 * @param {string} sectionHeading - the section heading being annotated
 * @param {string} annotationText - sanitised annotation text (caller must sanitise before calling)
 * @param {string} token - user's OAuth access token from session
 * @returns {Promise<object>} GitHub Contents API PUT response
 * @throws {AnnotationConflictError} if 409 persists after one retry
 */
async function commitAnnotation(artefactPath, sectionHeading, annotationText, token) {
  const owner   = process.env.GITHUB_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO_NAME;
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  const authHeaders = {
    Authorization: 'Bearer ' + token,
    Accept:        'application/vnd.github+json'
  };

  // Fetch authenticated user identity for commit author — never service account
  const userRes = await fetch(apiBase + '/user', { headers: authHeaders });
  if (!userRes.ok) throw new Error('Failed to fetch user identity: ' + userRes.status);
  const user = await userRes.json();

  async function _attemptWrite(sha, currentContent) {
    const timestamp = new Date().toISOString();
    const updated   = appendAnnotation(currentContent, user.name, sectionHeading, annotationText, timestamp);
    const encoded   = Buffer.from(updated, 'utf8').toString('base64');

    const body = JSON.stringify({
      message:   'annotation: ' + artefactPath + ' \u2014 ' + sectionHeading + ' by ' + user.name,
      content:   encoded,
      sha,
      author:    { name: user.name, email: user.email },
      committer: { name: user.name, email: user.email }
    });

    const putUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;
    return fetch(putUrl, {
      method:  'PUT',
      headers: Object.assign({}, authHeaders, { 'Content-Type': 'application/json' }),
      body
    });
  }

  // First attempt: fetch current file to get SHA + content
  const { content: firstContent, sha: firstSha } = await _fetchArtefact(artefactPath, token);
  const firstRes = await _attemptWrite(firstSha, firstContent);

  if (firstRes.status === 409) {
    // Retry: fetch fresh SHA and content (AC6 retry path)
    const { content: retryContent, sha: retrySha } = await _fetchArtefact(artefactPath, token);
    const retryRes = await _attemptWrite(retrySha, retryContent);

    if (retryRes.status === 409) {
      throw new AnnotationConflictError();
    }
    if (!retryRes.ok) throw new Error('Failed to commit annotation on retry: ' + retryRes.status);
    return retryRes.json();
  }

  if (!firstRes.ok) throw new Error('Failed to commit annotation: ' + firstRes.status);
  return firstRes.json();
}

module.exports = { commitAnnotation, AnnotationConflictError };
