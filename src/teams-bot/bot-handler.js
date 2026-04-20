'use strict';
// src/teams-bot/bot-handler.js
// p4-nta-surface — Teams bot runtime, C11-compliant state machine
//
// C11: stateless — no module-scope mutable session state; all state returned to caller
// C7:  AWAITING_RESPONSE lock — sendQuestion blocked until recordAnswer called
// ADR-004: no hardcoded tenant/channel IDs
// MC-SEC-02: no credentials in source

const STATES = {
  AWAITING_RESPONSE:     'AWAITING_RESPONSE',
  READY_FOR_NEXT_QUESTION: 'READY_FOR_NEXT_QUESTION',
  PROCESSING:             'PROCESSING',
};

/**
 * Initialises a new per-session state object.
 * Returns a plain object with status: AWAITING_RESPONSE and a questionId.
 * All session state lives in the returned object — caller stores it externally (C11).
 *
 * @param {{ step: string, question: string, questionId?: string }} opts
 * @returns {{ status: string, questionId: string, step: string, question: string, answers: object }}
 */
function initSession({ step, question, questionId } = {}) {
  return {
    status:     STATES.AWAITING_RESPONSE,
    questionId: questionId || ('q-' + Date.now()),
    step:       step || '',
    question:   question || '',
    answers:    {},
  };
}

/**
 * Attempts to send a second question to a session that is still AWAITING_RESPONSE.
 * C7: returns an error object — never allows two concurrent questions.
 *
 * @param {{ status: string }} session
 * @param {{ question: string }} opts
 * @returns {{ error: string, message: string } | { status: string }}
 */
function sendQuestion(session, { question } = {}) {
  if (!session) return { error: 'NO_SESSION', message: 'No session provided' };
  if (session.status === STATES.AWAITING_RESPONSE) {
    return {
      error:   'AWAITING_RESPONSE',
      message: 'C7: cannot send a new question while AWAITING_RESPONSE',
      status:  STATES.AWAITING_RESPONSE,
    };
  }
  // Transition to AWAITING_RESPONSE for the new question
  return Object.assign({}, session, {
    status:   STATES.AWAITING_RESPONSE,
    question: question || '',
  });
}

/**
 * Records an answer and transitions the session to READY_FOR_NEXT_QUESTION.
 * The recorded answer is stored keyed by questionId.
 *
 * @param {{ status: string, questionId: string, answers: object }} session
 * @param {{ answer: string }} opts
 * @returns {{ status: string, answers: object }}
 */
function recordAnswer(session, { answer } = {}) {
  if (!session) return { error: 'NO_SESSION', message: 'No session provided' };
  const updatedAnswers = Object.assign({}, session.answers);
  updatedAnswers[session.questionId || 'default'] = answer;
  return Object.assign({}, session, {
    status:  STATES.READY_FOR_NEXT_QUESTION,
    answers: updatedAnswers,
  });
}

module.exports = { initSession, sendQuestion, recordAnswer, STATES };
