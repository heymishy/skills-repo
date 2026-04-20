/**
 * pipeline-adapter.js
 * Reads .github/pipeline-state.json and exposes window.CYCLES + window.EPICS
 * in the shape expected by dashboards/index.html.
 *
 * Uses async fetch. Once data arrives, dispatches 'pipeline-loaded' so
 * index.html can remount React with live data.
 *
 * URL candidates (resolved relative to document, not this script):
 *   1. pipeline-state.json          — same directory (GitHub Pages copy step)
 *   2. ../.github/pipeline-state.json — Live Server / local dev from repo root
 *
 * Security (MC-SEC-02): no credentials, tokens, or personal identifiers.
 */
(function () {
  // ── Stage → phase key mapping ────────────────────────────────────
  var STAGE_TO_PHASE = {
    'discovery':          'discovery',
    'benefit-metric':     'benefit',
    'definition':         'definition',
    'review':             'review',
    'test-plan':          'testplan',
    'definition-of-ready':'dor',
    'issue-dispatch':     'dispatch',
    'subagent-execution': 'inner',
    'ci-assurance':       'assurance',
    'definition-of-done': 'dod',
    'trace':              'trace',
    'improve':            'improve',
  };

  function toPhaseKey(stage) {
    return STAGE_TO_PHASE[stage] || 'discovery';
  }

  // ── Story state derivation ───────────────────────────────────────
  function deriveStoryState(story) {
    if (story.dodStatus === 'complete')  return 'done';
    if (story.health === 'red')          return 'blocked';
    var reviewStages = ['review', 'test-plan', 'definition-of-ready'];
    if (reviewStages.indexOf(story.stage) !== -1) return 'review';
    if (story.health === 'green')        return 'current';
    return 'queued';
  }

  // ── Epic risk derivation ─────────────────────────────────────────
  function deriveRisk(stories) {
    if (!stories || stories.length === 0) return 'low';
    var hasRed   = stories.some(function (s) { return s.health === 'red'; });
    var hasAmber = stories.some(function (s) { return s.health === 'amber'; });
    return hasRed ? 'high' : hasAmber ? 'med' : 'low';
  }

  // ── Cycle note ───────────────────────────────────────────────────
  // ── Schema variant helpers ───────────────────────────────────────
  // Phase 1/2 epics: stories are full objects (.slug, .stage, .health …)
  // Phase 2 batch 2: stored under f.epics_batch2 (same story shape)
  // Phase 3 epics:   stories are slug strings → resolve from f.stories[]
  function collectEpicBatches(f) {
    return Object.keys(f).filter(function (k) {
      return k === 'epics' || /^epics_/.test(k);
    }).reduce(function (acc, k) {
      return Array.isArray(f[k]) ? acc.concat(f[k]) : acc;
    }, []);
  }

  function buildStoryMap(f) {
    var map = {};
    (f.stories || []).forEach(function (s) {
      // Support both old schema (s.slug) and Phase 3+ schema (s.id)
      if (s.slug) map[s.slug] = s;
      if (s.id)   map[s.id]   = s;
    });
    return map;
  }

  function resolveStory(s, storyMap) {
    return typeof s === 'string' ? (storyMap[s] || { id: s }) : s;
  }

  // Return the canonical identifier for a story object (slug or id fallback)
  function storyId(s) {
    return s.slug || s.id || '';
  }

  // Return feature-level stories belonging to a given epic
  // Used for Phase 3+ schema where epics carry no stories[] and stories
  // reference the epic via s.epic back-reference.
  function storiesForEpic(f, epicId) {
    if (!Array.isArray(f.stories) || !epicId) return [];
    return f.stories.filter(function (s) { return s.epic === epicId; });
  }

  // ── Transform pipeline-state.json → CYCLES / EPICS ──────────────
  function transform(state) {
    if (!state || !Array.isArray(state.features)) return;

    window.PIPELINE_STATE = state;

    window.CYCLES = state.features.map(function (f) {
      var storyMap = buildStoryMap(f);
      var allRaw = collectEpicBatches(f).reduce(function (acc, e) {
        var epicId = e.slug || e.id;
        // Phase 1/2: stories embedded in epic; Phase 3+: stories in f.stories[] with back-ref
        var epicStories = (e.stories && e.stories.length > 0)
          ? e.stories
          : storiesForEpic(f, epicId);
        return acc.concat(epicStories);
      }, []);
      // Fallback: if no epics have stories, use f.stories[] directly
      if (allRaw.length === 0 && Array.isArray(f.stories)) {
        allRaw = f.stories.slice();
      }
      var resolved = allRaw.map(function (s) { return resolveStory(s, storyMap); });
      var doneN = resolved.filter(function (s) {
        return s.dodStatus === 'complete' || s.stage === 'definition-of-done';
      }).length;
      var note = resolved.length > 0
        ? f.stage + ' \u00B7 ' + doneN + '/' + resolved.length + ' done'
        : f.stage;
      var isDone = f.stage === 'definition-of-done' || f.dodStatus === 'complete';
      return {
        id:           f.slug,
        tag:          f.track || f.slug.replace(/^\d{4}-\d{2}-\d{2}-/, ''),
        name:         f.name,
        currentPhase: toPhaseKey(f.stage),
        state:        f.health === 'red' ? 'blocked' : isDone ? 'done' : 'in-flight',
        note:         note,
        featureSlug:  f.slug,
        stageRaw:     f.stage || '',
        health:       f.health || '',
        discoveryStatus:     f.discoveryStatus || '',
        benefitMetricStatus: f.benefitMetricStatus || '',
      };
    });

    var epics = [];
    state.features.forEach(function (f) {
      var storyMap = buildStoryMap(f);
      collectEpicBatches(f).forEach(function (epic) {
        var epicId = epic.slug || epic.id;
        // Phase 1/2: stories embedded in epic; Phase 3+: stories in f.stories[] with back-ref
        var rawStories = (epic.stories && epic.stories.length > 0)
          ? epic.stories
          : storiesForEpic(f, epicId);
        var fullStories = rawStories.map(function (s) { return resolveStory(s, storyMap); });
        var mappedStories = fullStories.map(function (s) {
          var sid = storyId(s);
          var obj = {
            id: sid,
            name: s.name || sid || '',
            phase: toPhaseKey(s.stage),
            state: deriveStoryState(s),
            stageRaw: s.stage || '',
            health: s.health || '',
            dodStatus: s.dodStatus || '',
            reviewStatus: s.reviewStatus || '',
            prUrl: s.prUrl || '',
            issueUrl: s.issueUrl || '',
            mergedAt: s.mergedAt || '',
            dorArtefact: s.dorArtefact || '',
            acTotal: s.acTotal || 0,
            acVerified: s.acVerified || 0,
          };
          if (s.testPlan) obj.testPlan = s.testPlan;
          if (s.health === 'red') obj.blockerId = sid + '-blocked';
          return obj;
        });
        epics.push({
          id:      epicId,
          cycleId: f.slug,
          name:    epic.name,
          risk:    deriveRisk(fullStories),
          stories: mappedStories,
        });
      });
    });
    window.EPICS = epics;
    window.dispatchEvent(new CustomEvent('pipeline-loaded'));
    console.log('[pipeline-adapter] loaded ' + window.CYCLES.length + ' feature(s), ' + epics.length + ' epic(s)');
  }

  // ── Async fetch — try candidates in order ────────────────────────
  // fetch() resolves relative URLs against the document URL, not this script.
  // From http://127.0.0.1:5500/dashboards/index.html:
  //   ./pipeline-state.json          → /dashboards/pipeline-state.json  (Pages deployment)
  //   ../.github/pipeline-state.json → /.github/pipeline-state.json     (Live Server / dev)
  var candidates = ['./pipeline-state.json', '../.github/pipeline-state.json'];
  function tryLoad(i) {
    if (i >= candidates.length) {
      console.warn('[pipeline-adapter] could not load pipeline-state.json — dashboard shows mock data');
      return;
    }
    fetch(candidates[i])
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { transform(data); })
      .catch(function () { tryLoad(i + 1); });
  }
  tryLoad(0);
})();
