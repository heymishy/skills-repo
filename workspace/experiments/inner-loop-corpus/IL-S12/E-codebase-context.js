// Existing codebase context for IL-S12
// File: src/models/credit-model-pipeline.js (existing — credit.7 MODIFIES this)

'use strict';

const modelTrainer = require('./model-trainer');       // existing: gradient boosting retrain
const modelEvaluator = require('./model-evaluator');   // existing: Gini, ROC-AUC, KS statistic
const dataLoader = require('./training-data-loader');  // existing: loads origination data from data warehouse

/**
 * Retrains the credit limit model.
 * Currently: trains + evaluates, but does NOT produce MRM validation artefact
 * and does NOT compute FMA demographic parity metrics.
 *
 * credit.7 adds:
 *   - Fairness metric computation (see src/models/fairness-metrics.js — new file)
 *   - MRM validation report writing to artefacts/credit-model/model-validation-report.md
 */
async function runRetrainPipeline(config) {
  const { trainingPeriodMonths = 24, holdoutFraction = 0.2 } = config;

  // Step 1: Load origination data
  const { trainSet, holdoutSet } = await dataLoader.load({
    periodMonths: trainingPeriodMonths,
    holdoutFraction,
  });

  // Step 2: Retrain model
  const model = await modelTrainer.train(trainSet);

  // Step 3: Evaluate on holdout
  const metrics = await modelEvaluator.evaluate(model, holdoutSet);
  // metrics = { gini, rocAuc, ksStat }

  // TODO credit.7: compute demographic parity metrics (fairness-metrics.js)
  // TODO credit.7: write model-validation-report.md (C5 — mandatory MRM artefact)
  // TODO credit.7: flag FAIRNESS_THRESHOLD_EXCEEDED if gap > 5pp (C6 — FMA methodology)

  return { model, metrics };
}

module.exports = { runRetrainPipeline };

// ─────────────────────────────────────────────────────────────────────────────
// File: src/models/model-evaluator.js (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────
//
// async function evaluate(model, holdoutSet) {
//   // Returns { gini, rocAuc, ksStat }
//   // gini: Gini coefficient (0 to 1, higher is better)
//   // rocAuc: area under ROC curve
//   // ksStat: Kolmogorov-Smirnov statistic
// }

// ─────────────────────────────────────────────────────────────────────────────
// Fairness metrics module to be created by credit.7:
// src/models/fairness-metrics.js
// ─────────────────────────────────────────────────────────────────────────────
//
// const FAIRNESS_THRESHOLD_PCT = 5; // FMA Algorithmic Fairness Methodology — NOT configurable
//
// function computeDemographicParityGap(predictions, demographicField) {
//   // predictions: [{ approved: bool, gender: 'M'|'F', ethnicity: 'Māori'|'Pacific'|'Other' }]
//   // demographicField: 'gender' | 'ethnicity'
//   // Returns: { gap: number (percentage points), cohortRates: { [cohort]: number } }
// }
//
// module.exports = { computeDemographicParityGap, FAIRNESS_THRESHOLD_PCT };
