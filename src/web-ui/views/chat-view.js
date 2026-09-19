'use strict';

// chat-view.js — split-pane skill chat (left: thread, right: live draft).
// Server-rendered each request from session state. No client JS.

const { escHtml } = require('../utils/html-shell');
const { pill, btn } = require('./components');

// minimal **bold** + *italic* + `code` for assistant turns.
// All input is escaped first.
function lightMarkdown(text) {
  let s = escHtml(text || '');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s.replace(/\n/g, '<br>');
}

/**
 * @param {object} data
 * @param {string} data.skillName
 * @param {string} data.skillLabel              human-readable, e.g. 'Story shaping'
 * @param {string} data.featureSlug
 * @param {string} data.sessionId
 * @param {number} data.questionIndex           1-based
 * @param {number} data.totalQuestions
 * @param {string} data.currentQuestion         text of next question
 * @param {Array<{question, answer, modelResponse}>} data.priorQA
 *   rht-s1: `question` (rendered under "Skill") and `answer` (rendered under
 *   "You") are each independently optional -- an empty string suppresses
 *   that bubble entirely rather than rendering blank. A lone trailing
 *   assistant turn uses `{question: content, answer: ''}`; a lone leading
 *   user turn uses `{question: '', answer: content}`.
 * @param {Array<{title, body, state}>} data.draftSections   state ∈ 'drafted'|'pending'|'empty'
 * @param {boolean} data.pendingConfirmation
 * @param {boolean} [data.readOnly]              dsh-s3: when truthy, suppresses the
 *   input-form footer (no <input>/<textarea>/submit button) and the client-side
 *   <script> tag — used for viewing a completed/durable stage with no live
 *   interactivity. Default (falsy/absent) is unchanged live-chat behaviour.
 * @param {string} [data.artefactContent]        dsh-s3: pre-rendered HTML for the
 *   non-ideate right-pane artefact panel. The live chat page populates this pane
 *   client-side via SSE (no value passed here, ever, from that call site) — this
 *   field exists for callers with no live session driving that pump (the
 *   read-only historical-stage view). Falsy/absent preserves the original
 *   static placeholder text unchanged.
 */
function renderChat(data) {
  const messages = [];

  (data.priorQA || []).forEach(function(qa, i) {
    if (qa.question) {
      messages.push(
        '<div class="sw-chat-msg sw-chat-msg--assistant msg--assistant">' +
          '<div class="sw-avatar sw-avatar--assistant">✦</div>' +
          '<div class="sw-chat-body"><div class="sw-chat-from">Skill</div>' +
          '<div class="sw-chat-text">' + lightMarkdown(qa.question) + '</div></div>' +
        '</div>'
      );
    }
    if (qa.answer) {
      messages.push(
        '<div class="sw-chat-msg msg--user">' +
          '<div class="sw-avatar">' + escHtml((data.userInitial || 'M')) + '</div>' +
          '<div class="sw-chat-body"><div class="sw-chat-from">You</div>' +
          '<div class="sw-chat-text">' + lightMarkdown(qa.answer) + '</div></div>' +
        '</div>'
      );
    }
    if (qa.modelResponse) {
      messages.push(
        '<div class="sw-chat-insight">' +
          '<div class="sw-chat-insight-label">Coach insight</div>' +
          lightMarkdown(qa.modelResponse) +
        '</div>'
      );
    }
  });

  // Current question (assistant turn awaiting user)
  if (data.currentQuestion) {
    messages.push(
      '<div class="sw-chat-msg sw-chat-msg--assistant msg--assistant">' +
        '<div class="sw-avatar sw-avatar--assistant">✦</div>' +
        '<div class="sw-chat-body"><div class="sw-chat-from">Skill</div>' +
        '<div class="sw-chat-text">' + lightMarkdown(data.currentQuestion) + '</div></div>' +
      '</div>'
    );
  }

  // dsa-s4 (AC3, toggle portion): Focused-mode view, built from the SAME
  // data.priorQA/data.currentQuestion/data.questionIndex/data.totalQuestions
  // already passed into this function for the Chat thread above -- no new
  // data source, no new server call. Shows only the current unanswered
  // question (or, once all questions are answered, the most recent prior
  // turn) with a "Question X of Y" progress indicator; every earlier turn
  // collapses behind a single click-to-expand toggle, and each collapsed
  // turn is itself a <details> element so an individual prior answer can
  // also be expanded on its own.
  const focusedPriorQA = data.priorQA || [];
  const focusedHasCurrent = !!data.currentQuestion;
  const focusedQuestionIndex = data.questionIndex || (focusedPriorQA.length + (focusedHasCurrent ? 1 : 0)) || 1;
  const focusedTotalQuestions = Math.max(data.totalQuestions || focusedQuestionIndex, focusedQuestionIndex, 1);

  // The turns rendered as "prior" in Focused mode: every priorQA entry when
  // there's a live current question; all but the last one when the session
  // has no current question (that last entry becomes the "current" display
  // below instead, per "most recent turn if all answered").
  const focusedPriorItems = focusedHasCurrent ? focusedPriorQA : focusedPriorQA.slice(0, -1);
  const focusedCurrentLastTurn = !focusedHasCurrent && focusedPriorQA.length
    ? focusedPriorQA[focusedPriorQA.length - 1] : null;
  const focusedCurrentText = focusedHasCurrent
    ? data.currentQuestion
    : (focusedCurrentLastTurn ? focusedCurrentLastTurn.question : '');
  const focusedCurrentLabel = focusedHasCurrent ? 'Skill' : 'Last question';

  let focusedDotsHtml = '';
  for (let fd = 0; fd < focusedTotalQuestions; fd++) {
    const fdDone = fd < focusedPriorItems.length;
    const fdCurrent = fd === focusedPriorItems.length;
    focusedDotsHtml += '<span class="sw-focused-dot' +
      (fdDone ? ' sw-focused-dot--done' : '') +
      (fdCurrent ? ' sw-focused-dot--current' : '') + '"></span>';
  }

  const focusedPriorListHtml = focusedPriorItems.map(function(qa, i) {
    return '<details class="sw-focused-prior-item">' +
      '<summary class="sw-focused-prior-summary">Q' + (i + 1) + ': ' + lightMarkdown(qa.question || '') + '</summary>' +
      '<div class="sw-focused-prior-answer">' + lightMarkdown(qa.answer || '') + '</div>' +
    '</details>';
  }).join('');

  const focusedPriorToggleHtml = focusedPriorItems.length
    ? '<div class="sw-focused-prior-wrap">' +
        '<button type="button" class="sw-focused-prior-toggle" id="sw-focused-prior-toggle"' +
          ' data-show-label="' + focusedPriorItems.length + ' previous answered — show"' +
          ' data-hide-label="Hide previous answers"' +
          ' onclick="swToggleFocusedPrior()">' + focusedPriorItems.length + ' previous answered — show</button>' +
        '<div class="sw-focused-prior-list" id="sw-focused-prior-list" hidden>' + focusedPriorListHtml + '</div>' +
      '</div>'
    : '';

  const focusedViewHtml =
    '<div class="sw-focused-view" id="sw-focused-view" hidden>' +
      '<div class="sw-focused-progress">' +
        '<div class="sw-focused-dots">' + focusedDotsHtml + '</div>' +
        '<span class="sw-focused-progress-label" id="sw-focused-progress-label">Question ' +
          Math.min(focusedQuestionIndex, focusedTotalQuestions) + ' of ' + focusedTotalQuestions + '</span>' +
      '</div>' +
      '<div id="sw-focused-current-question">' +
        '<div class="sw-focused-current-label">' + escHtml(focusedCurrentLabel) + '</div>' +
        '<div class="sw-focused-current-text">' + lightMarkdown(focusedCurrentText) + '</div>' +
      '</div>' +
      focusedPriorToggleHtml +
    '</div>';

  const draftSections = (data.draftSections || []).map(function(s) {
    let pillHtml = '';
    if (s.state === 'drafted') pillHtml = pill('green',  'Drafted', { dot: false });
    else if (s.state === 'pending') pillHtml = pill('amber',  'Confirm',  { dot: false });
    else pillHtml = pill('neutral','Not yet',  { dot: false });

    const body = s.body
      ? '<div class="sw-draft-body" style="' +
          (s.state === 'pending' ? 'color:var(--muted);font-style:italic' : '') +
        '">' + escHtml(s.body) + '</div>'
      : '<div class="sw-draft-empty">— answer the next questions to draft this section —</div>';

    return '<div class="sw-draft-section">' +
      '<div class="sw-draft-head"><h2>' + escHtml(s.title) + '</h2>' + pillHtml + '</div>' +
      body +
    '</div>';
  }).join('');

  // Confirmation banner if a section draft is pending
  const confirmBanner = data.pendingConfirmation ? [
    '<div class="sw-chat-confirm">',
      '<div class="sw-chat-confirm-title">Section draft ready</div>',
      '<p>I\'ve drafted a section from your last few answers. Type <code>confirm</code> to accept,',
      ' or <code>edit: …</code> to provide your own version.</p>',
    '</div>'
  ].join('') : '';

  const formAction = '/api/skills/' + escHtml(data.skillName) + '/sessions/' +
    escHtml(data.sessionId) + '/answer';

  // dsh-s3: read-only mode (breadcrumb "view a completed stage" split view)
  // suppresses the input-form footer and the client-side <script> tag —
  // there is nothing to submit and no live SSE pump to wire up when
  // rendering a durable, already-completed stage. Default (readOnly
  // falsy/absent) is unchanged from before this option existed.
  // rapp-s1: /ideate has no fixed turn count before the model decides to
  // write up the artefact -- an operator who has read through several
  // lenses and sees no explicit "I'm ready to finish" control has no way to
  // signal that other than guessing they should keep replying. This button
  // submits a canned "ready to finish" turn through the same sendTurn() path
  // a typed reply uses (see the client-side handler in skills.js), so the
  // model (real or mocked) decides how to respond exactly as it would to a
  // typed equivalent -- this button doesn't force completion, it just makes
  // the "I'm done, wrap it up" signal discoverable. Hidden once the stage is
  // done (session.done) since the journey-gate panel below then already
  // shows the next-step affordance.
  const wrapUpBtn = (data.isIdeate && !data.done)
    ? '<button type="button" id="sw-wrap-ideation-btn" class="sw-btn" style="margin-left:8px">Ready to finish? Wrap up ideation →</button>'
    : '';

  const footerHtml = data.readOnly ? '' : (
    '<footer class="sw-chat-foot">' +
      confirmBanner +
      '<form method="POST" action="' + formAction + '" id="chat-form">' +
        '<div class="sw-chat-input">' +
          '<textarea id="chat-input" name="answer" placeholder="Type your answer…" autofocus></textarea>' +
          '<div class="sw-chat-input-row">' +
            '<span style="font-size:12px;color:var(--muted)">Press ⌘↵ or Ctrl+↵ to send</span>' +
            btn('primary', 'Send →', { type: 'submit' }) +
            wrapUpBtn +
          '</div>' +
        '</div>' +
      '</form>' +
    '</footer>'
  );

  // cmba-s1: the three maximise/fullscreen toggle functions (swToggleArtefactFs,
  // swToggleCanvasFs, swExpandCanvas) must be available regardless of
  // data.readOnly, since their button markup below is rendered unconditionally
  // -- previously they lived inside the readOnly-gated scriptHtml block, so
  // clicking either maximise button on a read-only/historical view threw
  // ReferenceError. Emitted unconditionally, in their own script block,
  // separate from scriptHtml's live-session-only content (the SSE pump and
  // the Cmd/Ctrl+Enter submit handler genuinely don't apply to a read-only
  // page with no live session and no chat-form to submit).
  const alwaysOnScriptHtml =
    '<script>' +
      'function swToggleArtefactFs(){var p=document.getElementById("sw-artefact-pane");var b=document.getElementById("sw-artefact-fs-btn");if(!p)return;p.classList.toggle("ad-fs");b.textContent=p.classList.contains("ad-fs")?"⊡":"⊞";}' +
      // cdpl-s1: shared canvas-maximise mechanism, mirroring
      // swToggleArtefactFs()'s exact classList.toggle() + button-glyph-swap
      // pattern (not a second, independently-invented fullscreen approach).
      // #canvas-section (the wrapper around the header + #canvas-panel) has
      // the same id in both the ideate 3-panel layout and the
      // design/definition sw-artefact-pane layout, so one function covers
      // both. Toggling the wrapper -- not #canvas-panel alone -- keeps the
      // maximise button inside the fullscreen element so it stays clickable
      // to restore the split view (a fixed #canvas-panel alone would paint
      // over its own header/button, matching #sw-artefact-pane's own
      // wrap-header-and-content shape). swExpandCanvas() (referenced via
      // onclick in the ideate layout's pre-existing "Maximise canvas"
      // button but never defined until now) is a thin alias delegating to
      // the same shared toggle.
      'function swToggleCanvasFs(){var p=document.getElementById("canvas-section");if(!p)return;p.classList.toggle("canvas-fs");var g=p.classList.contains("canvas-fs")?"⊡":"⊞";var b1=document.getElementById("sw-canvas-fs-btn");if(b1)b1.textContent=g;var b2=document.getElementById("sw-expand-canvas");if(b2)b2.textContent=g;}' +
      'function swExpandCanvas(){swToggleCanvasFs();}' +
      // dsa-s4 (AC3, toggle portion): Focused/Chat segmented-control toggle.
      // Client-side visibility swap only -- no new server route, no change
      // to how #chat-form/#chat-input/Cmd/Ctrl+Enter submit (both modes
      // share the exact same footer/form; Focused mode just changes what is
      // shown above it, same as Chat mode already does). Emitted
      // unconditionally alongside the other always-on fullscreen toggles
      // above (not gated by data.readOnly), since the segmented control
      // itself is rendered unconditionally in .sw-chat-head.
      'function swSetChatViewMode(mode){' +
        'var chatEl=document.getElementById("chat-messages");' +
        'var focusedEl=document.getElementById("sw-focused-view");' +
        'var chatBtn=document.getElementById("sw-mode-btn-chat");' +
        'var focusedBtn=document.getElementById("sw-mode-btn-focused");' +
        'if(!chatEl||!focusedEl)return;' +
        'var isFocused=mode==="focused";' +
        'chatEl.hidden=isFocused;' +
        'focusedEl.hidden=!isFocused;' +
        'if(chatBtn)chatBtn.classList.toggle("sw-mode-btn--active",!isFocused);' +
        'if(focusedBtn)focusedBtn.classList.toggle("sw-mode-btn--active",isFocused);' +
      '}' +
      'function swToggleFocusedPrior(){' +
        'var list=document.getElementById("sw-focused-prior-list");' +
        'var btn=document.getElementById("sw-focused-prior-toggle");' +
        'if(!list||!btn)return;' +
        'list.hidden=!list.hidden;' +
        'btn.textContent=list.hidden?btn.getAttribute("data-show-label"):btn.getAttribute("data-hide-label");' +
      '}' +
    '</script>';

  const scriptHtml = data.readOnly ? '' : (
    '<script>' +
      'function escHtmlClient(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}' +
      'function appendConditionItem(item){' +
        'var container=document.getElementById("condition-items");' +
        'if(!container)return;' +
        'var p=container.querySelector("p");if(p)p.remove();' +
        'var typeKey=(item.type||"").toLowerCase().replace(/[^a-z]/g,"");' +
        'var typeClass=["constraint","dependency","outcome"].indexOf(typeKey)>=0?typeKey:"constraint";' +
        'var cardEl=document.createElement("div");' +
        'cardEl.className="condition-card";' +
        'cardEl.innerHTML=\'<div class="condition-card-meta">\'+' +
          '\'<span class="ci-type-tag ci-type-\'+typeClass+\'">\'+escHtmlClient(item.type||"constraint")+\'</span>\'+' +
          '\'<span class="ci-source">\'+escHtmlClient(item.source||"model")+\'</span>\'+' +
          '\'</div><div class="condition-card-text">\'+escHtmlClient(item.text||"")+\'</div>\';' +
        'container.appendChild(cardEl);' +
      '}' +
      '// SSE pump wires: appendConditionItem, appendCanvasBlock defined in the IIFE (skills.js)' +
      'document.addEventListener("keydown",function(e){' +
        'if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){' +
          'var f=document.getElementById("chat-form");if(f)f.submit();' +
        '}' +
      '});' +
    '</script>'
  );

  return [
    '<style>',
      '.sw-chat { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 24px; height: calc(100vh - 48px - 64px); max-height: 820px; }',
      '.sw-chat-pane { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; min-width: 0; }',
      '.sw-chat-head { padding: 14px 20px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 12px; }',
      '.sw-chat-head .sw-chat-title { font-size: 14px; font-weight: 600; }',
      '.sw-chat-head .sw-chat-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }',
      '.sw-chat-progress { display: flex; gap: 4px; align-items: center; }',
      '.sw-chat-thread { flex: 1; overflow: auto; padding: 20px 20px 8px; display: flex; flex-direction: column; gap: 18px; }',
      '.sw-chat-system { align-self: center; font-size: 12px; color: var(--muted); padding: 4px 12px; background: var(--line-2); border-radius: 12px; }',
      '.sw-chat-msg { display: flex; gap: 10px; align-items: flex-start; }',
      '.sw-chat-msg .sw-avatar { flex: 0 0 24px; width: 24px; height: 24px; }',
      '.sw-avatar--assistant { background: var(--ink) !important; color: var(--bg) !important; }',
      '.sw-chat-body { flex: 1; min-width: 0; }',
      '.sw-chat-from { font-size: 12px; color: var(--muted); margin-bottom: 3px; }',
      '.sw-chat-text { font-size: 14px; color: var(--ink); line-height: 1.6; }',
      // dsa-s4: border was hardcoded #DDD6FE (a lavender not in DESIGN.md's
      // palette). var(--accent-soft) was considered (as the plan text
      // suggested) but rejected: it's IDENTICAL to this rule's own
      // background, so the border would render invisible -- and no other
      // rule in this codebase ever uses a `-soft` token for a border (see
      // .cv-pip.active/.cv-tree-root-node, both `background:accent-soft;
      // border-color:accent`). var(--accent) matches that established local
      // convention and stays visible against the accent-soft background.
      '.sw-chat-insight { margin-left: 32px; padding: 10px 12px; background: var(--accent-soft); border: 1px solid var(--accent); border-radius: 8px; font-size: 13px; color: var(--accent-ink); line-height: 1.55; }',
      '.sw-chat-insight-label { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 4px; opacity: 0.8; }',
      '.sw-chat-foot { border-top: 1px solid var(--line); padding: 12px; background: var(--bg); }',
      '.sw-chat-input { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }',
      '.sw-chat-input textarea { width: 100%; min-height: 56px; border: none; background: transparent; resize: none; outline: none; font-family: inherit; font-size: 14px; line-height: 1.5; color: var(--ink); }',
      '.sw-chat-input-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }',
      // dsa-s4: border was hardcoded #FDE68A. The plan text suggested
      // var(--warn-soft), but that's rejected for the same invisible-border
      // reason as .sw-chat-insight above (--warn-soft is a dark, low-
      // contrast fill in dark mode, nearly indistinguishable from this
      // rule's own var(--amber-soft) background) -- var(--warn) matches the
      // same established local convention (full-strength token for
      // borders, `-soft` reserved for fills) used by .chip-warn/
      // .ac-badge-amber elsewhere in this same file.
      '.sw-chat-confirm { margin: 0 0 8px; padding: 10px 12px; background: var(--amber-soft); border: 1px solid var(--warn); border-radius: 8px; font-size: 13px; color: var(--amber); }',
      '.sw-chat-confirm-title { font-weight: 600; margin-bottom: 4px; }',
      '.sw-chat-confirm code { background: rgba(180,83,9,0.1); padding: 1px 5px; border-radius: 3px; font-family: var(--mono); font-size: 12px; }',
      '.sw-draft-body { font-family: var(--serif); font-size: 14.5px; line-height: 1.65; color: var(--ink-2); white-space: pre-wrap; }',
      '.sw-draft-empty { font-size: 13px; color: var(--muted-2); }',
      '.sw-draft-section { margin-bottom: 24px; }',
      '.sw-draft-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }',
      '.sw-draft-head h2 { margin: 0; font-size: 15px; font-weight: 600; font-family: var(--sans); }',
      '@keyframes sw-dot-pulse { 0%,60%,100% { opacity:0.25; transform:translateY(0); } 30% { opacity:1; transform:translateY(-3px); } }',
      '.sw-thinking { display:inline-flex; gap:4px; align-items:center; padding:2px 0; }',
      '.sw-reasoning-block { margin:2px 32px 10px; }',
      '.sw-reasoning-summary { font-size:11.5px; color:var(--muted); cursor:pointer; user-select:none; list-style:none; display:flex; align-items:center; gap:5px; }',
      '.sw-reasoning-summary::-webkit-details-marker { display:none; }',
      '.sw-reasoning-summary::before { content:"◆"; font-size:7px; opacity:0.45; }',
      '.sw-reasoning-body { margin-top:5px; font-size:11px; color:var(--muted); font-family:var(--mono); line-height:1.55; white-space:pre-wrap; max-height:200px; overflow-y:auto; padding:8px 10px; background:var(--line-2); border-radius:6px; border-left:2px solid var(--line); }',
      '.sw-dot { width:7px; height:7px; border-radius:50%; background:var(--muted); display:inline-block; animation:sw-dot-pulse 1.2s infinite; }',
      '.sw-dot:nth-child(1) { animation-delay:0s; }',
      '.sw-dot:nth-child(2) { animation-delay:0.2s; }',
      '.sw-dot:nth-child(3) { animation-delay:0.4s; }',
      '.chip-ok   { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:var(--success-soft);color:var(--success);border-radius:10px;font-size:12px;font-weight:500;border:1px solid var(--success); }',
      '.chip-warn { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:var(--warn-soft);color:var(--warn);border-radius:10px;font-size:12px;font-weight:500;border:1px solid var(--warn); }',
      /* assumption card styles (iwu.3 mockup) */
      '.ac-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.ac-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.ac-badges { display:flex;gap:5px;align-items:center; }',
      '.ac-badge { font-size:10px;font-weight:500;padding:1px 7px;border-radius:10px; }',
      '.ac-badge-amber { background:var(--warn-soft);color:var(--warn);border:1px solid var(--warn); }',
      '.ac-badge-green { background:var(--success-soft);color:var(--success);border:1px solid var(--success); }',
      '.assumption-card { border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--surface);display:flex;flex-direction:column;gap:6px;transition:border-color 0.15s; }',
      '.assumption-card[data-state="confirmed"] { border-color:var(--success);background:var(--success-soft); }',
      '.assumption-card[data-state="flagged"]   { border-color:var(--danger);background:var(--danger-soft); }',
      '.assumption-card-meta { display:flex;align-items:center;gap:5px;flex-wrap:wrap; }',
      '.ac-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px; }',
      // dsa-s4: .ac-type-desirability (purple) is a DELIBERATE EXCEPTION,
      // left as its original hardcoded hex -- NOT tokenized. Rationale:
      // desirability/viability/feasibility/ethical badges render together
      // in the same AC-type legend on a single assumption card; collapsing
      // desirability into var(--accent) (the only candidate token) would
      // make it visually indistinguishable from .ac-type-viability just
      // below, which IS tokenized to var(--accent-soft)/var(--accent-ink).
      // DESIGN.md defines no purple token, so there is no non-lossy
      // substitution available. Kept exactly as-is, theme-invariant by
      // design (matches this rule's own pre-existing behaviour).
      '.ac-type-desirability { background:#EDE9FE;color:#3730A3; }',
      '.ac-type-viability    { background:var(--accent-soft);color:var(--accent-ink); }',
      '.ac-type-feasibility  { background:var(--success-soft);color:var(--success); }',
      '.ac-type-ethical      { background:var(--surface-2);color:var(--ink-2); }',
      '.ac-risk-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }',
      '.ac-risk-high   { background:var(--danger); }',
      '.ac-risk-medium { background:var(--warn); }',
      '.ac-risk-low    { background:var(--success); }',
      '.assumption-card-text { font-size:12px;line-height:1.5;color:var(--ink); }',
      '.assumption-card[data-state="confirmed"] .assumption-card-text { color:var(--success); }',
      '.assumption-card[data-state="flagged"]   .assumption-card-text { color:var(--danger); }',
      '.assumption-card-actions { display:flex;gap:5px; }',
      '.btn-confirm,.btn-flag { font-size:11px;padding:2px 9px;border-radius:4px;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer;font-weight:500; }',
      '.btn-confirm:hover { background:var(--success-soft);color:var(--success);border-color:var(--success); }',
      '.btn-flag:hover    { background:var(--danger-soft);color:var(--danger);border-color:var(--danger); }',
      '.btn-confirmed-state { background:var(--success-soft);color:var(--success);border-color:var(--success); }',
      '.btn-flagged-state   { background:var(--danger-soft);color:var(--danger);border-color:var(--danger); }',
      /* inc2.1 — condition card styles */
      '.ci-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.ci-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.condition-card { border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:var(--surface);display:flex;flex-direction:column;gap:5px; }',
      '.condition-card-meta { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }',
      '.ci-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px; }',
      '.ci-type-constraint  { background:var(--danger-soft);color:var(--danger); }',
      '.ci-type-dependency  { background:var(--accent-soft);color:var(--accent-ink); }',
      '.ci-type-outcome     { background:var(--success-soft);color:var(--success); }',
      '.ci-source { font-size:10px;color:var(--muted); }',
      '.condition-card-text { font-size:12px;line-height:1.5;color:var(--ink); }',
      // inc4 — canvas panel extension. dsa-s4: --teal/--teal-soft were a
      // custom token invented mid-file, not in DESIGN.md's palette, and
      // (confirmed via grep across src/ and tests/) never referenced by any
      // selector anywhere in this codebase -- dead. Removed rather than
      // left in place, per the plan's "unused -> replace it" guidance.
      '.cv-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.cv-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.cv-pips { display:flex;gap:4px; }',
      '.cv-pip { width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;background:var(--line-2);color:var(--muted);border:1px solid var(--line); }',
      '.cv-pip.active { background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent); }',
      '.canvas-block { border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden; }',
      '.canvas-block-head { display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--line-2);border-bottom:1px solid var(--line); }',
      '.canvas-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px;background:var(--accent-soft);color:var(--accent-ink); }',
      '.canvas-block-title { font-size:13px;font-weight:600;color:var(--ink); }',
      '.canvas-block-body { padding:10px 12px; }',
      '.cv-empty { font-size:13px;color:var(--muted);margin:0; }',
      /* tree diagram */
      '.cv-tree-wrap { padding:6px 2px; }',
      '.cv-tree-root-node { display:inline-block;background:var(--accent-soft);border:1.5px solid var(--accent);border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;color:var(--accent-ink);margin-bottom:6px;margin-left:12px; }',
      '.cv-tree-list { list-style:none;margin:0 0 0 20px;padding:0; }',
      '.cv-tree-item { position:relative;padding:3px 0 3px 20px; }',
      '.cv-tree-item::before { content:"";position:absolute;left:0;top:13px;width:16px;height:1.5px;background:var(--muted-2); }',
      '.cv-tree-item::after { content:"";position:absolute;left:0;top:0;bottom:0;width:1.5px;background:var(--muted-2); }',
      '.cv-tree-item:last-child::after { height:13px;bottom:auto; }',
      '.cv-tree-node-box { display:inline-block;background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:5px 10px;font-size:12px;color:var(--ink);line-height:1.4; }',
      '.cv-tree-sub { list-style:none;margin:4px 0 0 16px;padding:0; }',
      '.cv-tree-sub .cv-tree-item { padding:2px 0 2px 16px; }',
      '.cv-tree-sub .cv-tree-item::before { top:11px;width:12px; }',
      '.cv-tree-sub .cv-tree-item:last-child::after { height:11px; }',
      '.cv-tree-sub .cv-tree-node-box { font-size:11px;color:var(--ink-2); }',
      /* section toggle buttons */
      '.sw-section-toggle,.sw-section-expand { background:none;border:none;cursor:pointer;color:var(--muted);padding:2px 5px;border-radius:4px;font-size:11px;line-height:1;flex-shrink:0; }',
      '.sw-section-toggle:hover,.sw-section-expand:hover { background:var(--line);color:var(--ink); }',
      '.sw-section-expand { font-size:13px; }',
      /* artefact panel + fullscreen */
      '#sw-artefact-pane.ad-fs { position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;border-radius:0;max-height:100vh; }',
      '.ad-fs-btn { background:none;border:none;cursor:pointer;color:var(--muted);padding:2px 6px;border-radius:4px;font-size:14px;line-height:1;transition:color 0.1s; }',
      '.ad-fs-btn:hover { color:var(--ink); }',
      /* cdpl-s1 -- canvas-maximise fullscreen, mirroring .ad-fs's own
         position:fixed rule exactly (same shared toggle mechanism, applied
         to #canvas-section -- the wrapper around the Diagrams/Canvas header
         and #canvas-panel -- instead of #sw-artefact-pane). #canvas-section
         shares this id across both the ideate 3-panel layout and the
         design/definition sw-artefact-pane layout, so one rule covers both
         AC3 and AC4. Toggling the wrapper (not #canvas-panel alone) keeps
         the maximise button itself inside the fullscreen element, exactly
         like #sw-artefact-pane wraps its own header + #artefact-panel. */
      '#canvas-section.canvas-fs { position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;border-radius:0;max-height:100vh;background:var(--surface); }',
      /* artefact markdown */
      '.ad-h1 { font-size:1.2rem;font-weight:700;margin:18px 0 8px;line-height:1.3; }',
      '.ad-h2 { font-size:1rem;font-weight:600;margin:14px 0 5px;border-bottom:1px solid var(--line);padding-bottom:3px; }',
      '.ad-h3 { font-size:0.88rem;font-weight:600;margin:10px 0 4px;color:var(--ink-2,var(--ink)); }',
      '.ad-p { margin:4px 0;font-size:13px;line-height:1.65;color:var(--ink); }',
      '.ad-ul,.ad-ol { margin:4px 0 8px 16px;padding:0; }',
      '.ad-ul li,.ad-ol li { font-size:13px;margin:2px 0;line-height:1.5; }',
      '.ad-hr { border:0;border-top:1px solid var(--line);margin:14px 0; }',
      '.ad-pre { display:block;background:var(--line-2);padding:8px 12px;border-radius:6px;overflow-x:auto;font-family:var(--mono);font-size:11.5px;line-height:1.5;margin:8px 0; }',
      '.ad-code { font-family:var(--mono);font-size:11px;background:var(--line-2);padding:1px 4px;border-radius:3px; }',
      '.ad-table { width:100%;border-collapse:collapse;font-size:12px;margin:8px 0 12px; }',
      '.ad-table th { border:1px solid var(--line);padding:5px 8px;background:var(--line-2);font-weight:600;text-align:left; }',
      '.ad-table td { border:1px solid var(--line);padding:5px 8px;color:var(--ink-2,var(--ink)); }',
      /* sub-step gate */
      '.sw-gate-substeps { display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid var(--line); }',
      '.sw-gate-substep-lbl { font-size:11px;font-weight:500;color:var(--muted);white-space:nowrap; }',
      '.sw-gate-substep-btn { font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-family:inherit; }',
      '.sw-gate-substep-btn:hover { border-color:var(--accent,#2563eb); }',
      '.sw-gate-substep-btn--rec { border-color:var(--accent,#2563eb);color:var(--accent,#2563eb); }',
      '.sw-est-form { display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;padding:10px 12px;background:var(--line-2);border-radius:8px;margin-bottom:8px; }',
      '.sw-est-field { display:flex;flex-direction:column;gap:3px; }',
      '.sw-est-field label { font-size:11px;color:var(--muted);font-weight:500; }',
      '.sw-est-field input,.sw-est-field select { padding:4px 8px;border:1px solid var(--line);border-radius:5px;background:var(--surface);color:var(--ink);font-size:12px;width:80px; }',
      '.cv-table { width:100%;border-collapse:collapse; }',
      '.cv-table th,.cv-table td { border:1px solid var(--line);padding:5px 9px;font-size:12px;text-align:left; }',
      '.cv-table th { background:var(--line-2);font-weight:600;color:var(--ink); }',
      '.cv-table td { color:var(--ink-2); }',
      '.cv-text p { font-size:13px;color:var(--ink);line-height:1.6;margin:4px 0; }',
      /* csd-s1 -- data-model diagram (mermaid); csd-s2 -- system-architecture,
         program-design (same mechanism), type label, and error state */
      '.cv-diagram-wrap { padding:2px; }',
      '.cv-diagram-type-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);margin:2px 0 6px; }',
      '.cv-diagram-wrap .mermaid { display:flex;justify-content:center;overflow-x:auto; }',
      '.cv-diagram-wrap .mermaid svg { max-width:100%;height:auto; }',
      '.cv-diagram-alt { margin-top:8px; }',
      '.cv-diagram-alt summary { font-size:11px;color:var(--muted);cursor:pointer;user-select:none; }',
      '.cv-diagram-src { margin-top:6px;padding:8px 10px;background:var(--line-2);border-radius:6px;font-family:var(--mono);font-size:11px;line-height:1.5;white-space:pre-wrap;color:var(--ink-2,var(--ink));overflow-x:auto; }',
      /* csd-s2 (AC2) -- labelled error state, visually distinct from a
         successfully-rendered diagram: red-toned border/background/text,
         never a blank space and never mermaid's own raw error output. */
      '.cv-diagram-wrap .mermaid.cv-diagram-error { display:block;justify-content:initial; }',
      '.cv-diagram-error-box { display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid var(--danger);border-radius:6px;background:var(--danger-soft);color:var(--danger);font-size:12px;font-weight:600; }',
      /* definition story map */
      '.dm-canvas{padding:12px 16px}',
      '.dm-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}',
      '.dm-count{font-size:11px;color:var(--muted);font-weight:500}',
      '.dm-badge{background:var(--accent-soft,#eaf1fb);color:var(--accent-ink,#1d4ed8);font-size:10px;font-weight:600;padding:2px 9px;border-radius:10px;text-transform:uppercase;letter-spacing:0.4px}',
      '.dm-epic{margin-bottom:20px}',
      '.dm-epic-hd{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:2px solid var(--accent,#2563eb);margin-bottom:10px}',
      '.dm-epic-tag{font-size:10px;font-weight:700;background:var(--accent,#2563eb);color:#fff;border-radius:4px;padding:1px 7px;flex-shrink:0}',
      '.dm-epic-name{font-size:12px;font-weight:600;color:var(--ink);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dm-epic-count{font-size:10px;color:var(--muted);flex-shrink:0;background:var(--line-2);padding:1px 6px;border-radius:10px;white-space:nowrap}',
      '.dm-cards{display:flex;flex-wrap:wrap;gap:6px}',
      '.dm-card{cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--surface);text-align:left;min-width:96px;max-width:144px;display:flex;flex-direction:column;gap:3px;font-family:inherit;line-height:1;transition:border-color 0.15s,box-shadow 0.15s}',
      '.dm-card:hover{border-color:var(--accent,#2563eb);box-shadow:0 2px 7px rgba(0,0,0,.09)}',
      '.dm-card-id{font-size:9px;font-weight:700;font-family:var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:0.3px}',
      '.dm-card-title{font-size:11px;font-weight:500;color:var(--ink);line-height:1.35;margin:2px 0}',
      '.dm-cx{font-size:9px;font-weight:600;margin-top:2px}',
      '.dm-cx--l{color:var(--success)}.dm-cx--m{color:var(--warn)}.dm-cx--h{color:var(--danger)}',
      '.dm-empty{padding:24px 16px;font-size:13px;color:var(--muted);font-style:italic}',
      /* story detail modal */
      '.dm-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;align-items:center;justify-content:center}',
      '.dm-mo{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4)}',
      '.dm-mb{position:relative;background:var(--bg);border-radius:12px;width:700px;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.28)}',
      '.dm-mh{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line);flex-shrink:0;gap:12px}',
      '.dm-mt{font-size:14px;font-weight:600;color:var(--ink);line-height:1.4}',
      '.dm-mx{border:none;background:none;cursor:pointer;font-size:16px;color:var(--muted);padding:2px 6px;border-radius:4px;line-height:1;flex-shrink:0;font-family:inherit}',
      '.dm-mx:hover{color:var(--ink);background:var(--line)}',
      '.dm-mbd{overflow-y:auto;padding:20px 24px}',
      /* cams-s1: stack the chat/artefact split-panel into a single column
         below the same max-width:768px breakpoint html-shell.js's sidebar
         drawer already uses. height:auto lets the page scroll naturally
         instead of squeezing both panes into unreadable fixed-height,
         half-width columns. */
      '@media (max-width: 768px) {',
        '.sw-chat { grid-template-columns: 1fr; height: auto; max-height: none; }',
        '.sw-chat-pane { overflow: visible; }',
        '.sw-chat-thread { overflow: visible; }',
      '}',
      // dsa-s4 (AC3, toggle portion): Focused/Chat segmented control in the
      // left-pane header (.sw-chat-head), plus the additive Focused-mode
      // rendering path. [hidden]-specific overrides are required for
      // .sw-chat-thread/.sw-focused-view/.sw-focused-prior-list because each
      // already carries its own `display:flex` rule above -- an author
      // stylesheet rule of equal specificity to the UA stylesheet's own
      // `[hidden]{display:none}` wins over it by cascade origin (not
      // selector order), so without an explicit override here the `hidden`
      // attribute set by swSetChatViewMode()/swToggleFocusedPrior() (see
      // alwaysOnScriptHtml) would silently fail to hide the element. Mirrors
      // the established `.pvc-item[hidden]{display:none!important}` /
      // `.sw-credits-error[hidden]{display:none}` pattern already used
      // elsewhere in this codebase (products.js, settings.js).
      '.sw-mode-toggle { display:flex; gap:2px; background:var(--surface-2); border-radius:7px; padding:2px; flex-shrink:0; }',
      '.sw-mode-btn { font-family:inherit; font-size:11.5px; font-weight:500; padding:5px 11px; border-radius:6px; border:none; cursor:pointer; background:transparent; color:var(--muted); }',
      '.sw-mode-btn--active { background:var(--bg); color:var(--ink); }',
      '.sw-chat-thread[hidden] { display:none; }',
      '.sw-focused-view { flex:1; display:flex; flex-direction:column; padding:24px 28px; overflow:auto; }',
      '.sw-focused-view[hidden] { display:none; }',
      '.sw-focused-progress { display:flex; align-items:center; gap:10px; margin-bottom:16px; }',
      '.sw-focused-dots { display:flex; gap:5px; }',
      '.sw-focused-dot { width:20px; height:3px; border-radius:2px; background:var(--line); }',
      '.sw-focused-dot--done { background:var(--success); }',
      '.sw-focused-dot--current { background:var(--accent); }',
      '.sw-focused-progress-label { font-size:11.5px; color:var(--muted); font-family:var(--mono); }',
      '.sw-focused-current-label { font-size:12px; color:var(--muted); margin-bottom:8px; }',
      '.sw-focused-current-text { font-size:22px; font-weight:600; line-height:1.4; color:var(--ink); }',
      '.sw-focused-prior-wrap { margin-top:28px; }',
      '.sw-focused-prior-toggle { font-size:12px; color:var(--muted); background:none; border:1px solid var(--line); border-radius:6px; padding:5px 10px; cursor:pointer; font-family:inherit; }',
      '.sw-focused-prior-toggle:hover { color:var(--ink); border-color:var(--muted-2); }',
      '.sw-focused-prior-list { margin-top:10px; display:flex; flex-direction:column; gap:8px; }',
      '.sw-focused-prior-list[hidden] { display:none; }',
      '.sw-focused-prior-item { border:1px solid var(--line); border-radius:8px; padding:8px 12px; background:var(--surface); }',
      '.sw-focused-prior-summary { font-size:12.5px; color:var(--ink-2); cursor:pointer; }',
      '.sw-focused-prior-answer { margin-top:6px; font-size:13px; color:var(--ink); line-height:1.55; }',
    '</style>',
    (data.contextManifestHtml ||
      '<div id="context-manifest" role="region" aria-label="Loaded context files"' +
      ' style="padding:6px 16px;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--bg)">' +
      '<span id="context-manifest-empty" style="font-size:12px;color:var(--muted)">no context loaded</span>' +
      '</div>'),
    '<div class="sw-chat">',

      // LEFT: chat thread
      '<section class="sw-chat-pane">',
        '<header class="sw-chat-head">',
          '<div>',
            '<div class="sw-chat-title">' + escHtml(data.skillLabel) + '</div>',
          '</div>',
          (data.modelLabel ? '<span style="font-size:11px;color:var(--muted);background:var(--line-2);padding:2px 8px;border-radius:10px;font-family:var(--mono)">' + escHtml(data.modelLabel) + '</span>' : ''),
          // dsa-s4 (AC3, toggle portion): Focused/Chat segmented control --
          // pure append to .sw-chat-head's existing children, doesn't
          // restructure anything above. Chat stays the default active state
          // (matches the existing, already-built full-thread view); Focused
          // is the new, additive one.
          '<div class="sw-mode-toggle" id="sw-mode-toggle" role="group" aria-label="Chat view mode">' +
            '<button type="button" class="sw-mode-btn sw-mode-btn--active" id="sw-mode-btn-chat" onclick="swSetChatViewMode(\'chat\')">Chat</button>' +
            '<button type="button" class="sw-mode-btn" id="sw-mode-btn-focused" onclick="swSetChatViewMode(\'focused\')">Focused</button>' +
          '</div>',
        '</header>',
        '<div class="sw-chat-thread" id="chat-messages">' + messages.join('') + '</div>',
        focusedViewHtml,
        footerHtml,
      '</section>',

      // RIGHT: ideate → 3-panel; all other skills → artefact draft panel
      (data.skillName === 'ideate' || data.isIdeate === true
        ? [
          '<section class="sw-chat-pane" style="display:flex;flex-direction:column">',
            '<div class="ci-section-head">',
              '<span class="ci-section-label">Conditions</span>',
              '<button id="sw-toggle-conditions" class="sw-section-toggle" onclick="swToggleSection(\'condition-items\',this)" title="Collapse/expand" aria-label="Toggle conditions">▾</button>',
            '</div>',
            '<div id="condition-items" role="region" aria-label="Condition items" style="flex:0 0 auto;max-height:28%;overflow-y:auto;padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px">',
              '<p style="margin:0;font-size:12px;color:var(--muted)">No conditions identified yet</p>',
            '</div>',
            '<div class="ac-section-head">',
              '<span class="ac-section-label">Assumptions</span>',
              '<div style="display:flex;align-items:center;gap:6px">',
                '<div class="ac-badges" id="ac-badges">',
                  '<span class="ac-badge ac-badge-amber" id="ac-badge-unconf" style="display:none">0 unconfirmed</span>',
                  '<span class="ac-badge ac-badge-green" id="ac-badge-conf"   style="display:none">0 confirmed</span>',
                '</div>',
                '<button id="sw-toggle-assumptions" class="sw-section-toggle" onclick="swToggleSection(\'assumption-cards\',this)" title="Collapse/expand" aria-label="Toggle assumptions">▾</button>',
              '</div>',
            '</div>',
            '<div id="assumption-cards" role="region" aria-label="Assumption cards" style="flex:0 0 auto;max-height:42%;overflow-y:auto;padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px">',
              '<p style="margin:0;font-size:12px;color:var(--muted)">No assumptions identified yet</p>',
            '</div>',
            // cdpl-s1: header + #canvas-panel wrapped together in
            // #canvas-section so the shared fullscreen mechanism toggles a
            // container that includes the maximise button itself (mirroring
            // #sw-artefact-pane's own wrap of its header+content) -- a fixed
            // element painted on top of the page would otherwise cover a
            // sibling header/button left in normal flow, making the button
            // unclickable once maximised.
            // rapp-s1: min-height was 0 (deliberately, to let it shrink) --
            // fine while conditions/assumptions were always empty (before
            // rapp-s1's own resume-hydration fix and isc-s1's mock-content
            // fix), since flex:0 0 auto siblings with real content up to
            // max-height:28%/42% barely took any space. With real content
            // now populating those siblings, canvas-section could shrink to
            // a sliver with several lens turns' worth of assumptions/
            // conditions above it. A min-height floor (matching the
            // non-ideate branch's own #canvas-panel min-height:200px
            // convention just below) keeps the canvas usable regardless of
            // how tall the two panels above it grow, while flex:1 1 auto
            // still lets it grow larger when there's room.
            '<div id="canvas-section" style="display:flex;flex-direction:column;flex:1 1 auto;min-height:240px">',
              '<div class="cv-section-head">',
                '<span class="cv-section-label">Canvas</span>',
                '<div style="display:flex;align-items:center;gap:6px">',
                  '<div class="cv-pips" id="cv-pips">',
                    '<span class="cv-pip" data-lens="A" title="Lens A">A</span>',
                    '<span class="cv-pip" data-lens="B" title="Lens B">B</span>',
                    '<span class="cv-pip" data-lens="C" title="Lens C">C</span>',
                    '<span class="cv-pip" data-lens="D" title="Lens D">D</span>',
                    '<span class="cv-pip" data-lens="E" title="Lens E">E</span>',
                  '</div>',
                  '<button id="sw-toggle-canvas" class="sw-section-toggle" onclick="swToggleSection(\'canvas-panel\',this)" title="Collapse/expand" aria-label="Toggle canvas">▾</button>',
                  '<button id="sw-expand-canvas" class="sw-section-expand" onclick="swExpandCanvas()" title="Maximise canvas" aria-label="Maximise canvas">⊞</button>',
                '</div>',
              '</div>',
              '<div id="canvas-panel" role="region" aria-label="Canvas" style="flex:1 1 auto;overflow-y:auto;padding:16px">',
                '<p class="cv-empty">Lens output will appear here as the session progresses.</p>',
                (draftSections || ''),
              '</div>',
            '</div>',
          '</section>',
        ].join('')
        : [
          '<section class="sw-chat-pane" id="sw-artefact-pane" style="display:flex;flex-direction:column">',
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0">',
              '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted)">' + (data.skillName === 'definition' ? 'Story Map' : 'Artefact Draft') + '</span>',
              '<button id="sw-artefact-fs-btn" class="ad-fs-btn" onclick="swToggleArtefactFs()" title="Toggle fullscreen" aria-label="Toggle fullscreen">⊞</button>',
            '</div>',
            '<div id="artefact-panel" role="region" aria-label="' + (data.skillName === 'definition' ? 'Story map' : 'Artefact draft') + '" style="flex:0 1 auto;max-height:55vh;overflow-y:auto;padding:' + (data.skillName === 'definition' ? '0' : '16px 20px') + '">',
              // dsh-s3: when a caller supplies pre-rendered artefact HTML (the
              // read-only historical-stage view has no live SSE pump to
              // populate this pane client-side the way the live chat page
              // does), render it directly. Absent/falsy (every existing
              // live-session call site) preserves the exact placeholder
              // text that was here before this option existed.
              (data.artefactContent ||
                '<p style="margin:0;font-size:12px;color:var(--muted);padding:16px 20px">' + (data.skillName === 'definition' ? 'Story map will appear here as epics and stories are generated.' : 'Artefact will appear here as the session progresses.') + '</p>'),
            '</div>',
            // csd-s3/csd-s4 (found post-DoD, see decisions.md): /design and
            // /definition emit CANVAS-JSON diagram markers, but until this
            // fix, this pane had no element for appendCanvasBlock() to
            // attach to -- only the /ideate skill's 3-panel layout had one.
            // Added as an additional section below the artefact/story-map
            // panel above (which continues to work exactly as before) so
            // diagrams have somewhere real to render for these two skills.
            // cdpl-s1: header + #canvas-panel wrapped in #canvas-section --
            // see the identical comment on the ideate layout's own
            // #canvas-section above for why the wrapper (not #canvas-panel
            // alone) is the element that toggles fullscreen.
            '<div id="canvas-section" style="display:flex;flex-direction:column;flex:1 1 auto;min-height:0">',
              '<div class="cv-section-head" style="flex-shrink:0">',
                '<span class="cv-section-label">Diagrams</span>',
                '<button id="sw-canvas-fs-btn" class="ad-fs-btn" onclick="swToggleCanvasFs()" title="Maximise diagrams" aria-label="Maximise diagrams">⊞</button>',
              '</div>',
              '<div id="canvas-panel" role="region" aria-label="Diagrams" style="flex:1 1 auto;min-height:200px;overflow-y:auto;padding:16px">',
                '<p class="cv-empty">Diagrams will appear here as the session progresses.</p>',
              '</div>',
            '</div>',
          '</section>',
        ].join('')
      ),

    '</div>',
    // cmba-s1: maximise/fullscreen toggle functions, always emitted
    alwaysOnScriptHtml,
    // Cmd/Ctrl+Enter to submit + inc2.1 condition-item client rendering
    scriptHtml
  ].join('');
}

module.exports = { renderChat };
