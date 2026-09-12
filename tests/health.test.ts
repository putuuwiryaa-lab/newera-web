import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { assessMarketHealth, evaluationIntegrityErrors } from '../src/engine/marketHealth';
import { mergeServerPrediction, mergeMarketPrediction, serverEvaluationMatchesHistory } from '../src/engine/serverState';
import { generatePrediction } from '../src/engine/adaptiveEngine';
import { compareSnapshots, diagnosticSnapshot, productionSnapshot } from '../src/engine/engineParity';
import { MarketHealthPanel } from '../src/components/MarketHealthPanel';
import { ProductionEvaluationPanel } from '../src/components/ProductionEvaluationPanel';
import { fetchAllMarkets } from '../src/services/marketService';

const original = JSON.parse(readFileSync(new URL('./fixtures/healthy-market.json', import.meta.url), 'utf8'));
const market = () => structuredClone(original);
const history = original.history_data.split(' ');
const now = Date.parse(original.last_checked_at);
const local = generatePrediction(history)!;

test('Python-generated live accumulator passes browser validation and expires', () => {
  assert.deepEqual(evaluationIntegrityErrors(original.production_evaluation), []);
  assert.equal(assessMarketHealth(original, now).status, 'HEALTHY');
  assert.equal(assessMarketHealth(original, now + 27 * 3600000).status, 'STALE');
  assert.equal(assessMarketHealth({ ...original, data_source: 'cached' }, now).status, 'STALE');
});

test('all required metadata has explicit health states; evaluator version is exact', () => {
  const mutations = [
    ['next_prediction', 'engine_version', 'old', 'DRIFT'],
    ['production_evaluation', 'evaluator_version', original.production_evaluation.evaluator_version + '-unknown', 'DRIFT'],
    ['next_prediction', 'basis_draw_count', 71, 'STALE'],
    ['next_prediction', 'basis_last_draw', '9999', 'DRIFT'],
    ['next_prediction', 'basis_draw_count', 'bad', 'ERROR']
  ];
  for (const [obj, key, value, expected] of mutations) {
    const m = market(); m[obj as string][key as string] = value;
    assert.equal(assessMarketHealth(m, now).status, expected);
    if (obj === 'production_evaluation') assert.equal(serverEvaluationMatchesHistory(m.production_evaluation, history), false);
  }
});

test('production merge never falls back to diagnostic predictions on missing/stale/malformed state', () => {
  for (const server of [undefined, {}, { ...original.next_prediction, engine_version: 'old' },
    { ...original.next_prediction, basis_draw_count: 71 }, { ...original.next_prediction, ai3: [1, 1, 1] },
    { ...original.next_prediction, paito: {} }, { ...original.next_prediction, wheeling7: {} }]) {
    assert.equal(mergeServerPrediction(local, server, history), null);
  }
  assert.equal(mergeMarketPrediction(local, { ...original, data_source: 'cached' }, history, now), null);
  assert.equal(mergeMarketPrediction(local, original, history, now + 27 * 3600000), null);
  assert.equal(mergeMarketPrediction(local, { ...original, health_error: 'scrape failed' }, history, now), null);
});

test('Python digits/weights/Paito/rankings remain authoritative despite a different diagnostic output', () => {
  const p = mergeMarketPrediction(local, original, history, now)!;
  assert.equal(p.source, 'python');
  assert.deepEqual(p.ai[4], original.next_prediction.ai4);
  assert.deepEqual(p.rankedDigits, original.next_prediction.tier_ranked_digits['4']);
  assert.deepEqual(p.bbfsTierWeights, original.next_prediction.bbfs_tier_weights);
  assert.deepEqual(p.paitoPrediction!.topBiji, original.next_prediction.paito.top_biji);
  assert.deepEqual(p.deadDigits, original.next_prediction.dead_digits);
  assert.ok(p.diagnosticFields!.length > 0);
  const parity = compareSnapshots(productionSnapshot(original.next_prediction), diagnosticSnapshot(local));
  assert.equal(parity.status, 'DRIFT');
  assert.equal(assessMarketHealth(original, now, parity).status, 'DRIFT');
});

test('corrupt counters, projections, confidence intervals and false readiness cannot be displayed as evidence', () => {
  const mutations = [
    (s: any) => { s.accumulators.live_only.tested = 90; },
    (s: any) => { s.accumulators.live_only.ai['3'].hits = -1; },
    (s: any) => { s.accumulators.live_only.paito.biji.brier_sum = NaN; },
    (s: any) => { s.prospective.ready = true; },
    (s: any) => { s.prospective.ai_stats['3'].lift_pp = 99; },
    (s: any) => { s.prospective.ai_stats['3'].ci95_pct = [90, 99]; },
    (s: any) => { delete s.accumulators.live_only; },
    (s: any) => { s.accumulators.live_draws = 999; },
    (s: any) => { s.accumulators.paito.biji = {}; },
    (s: any) => { s.accumulators.live_only = {}; },
    (s: any) => { s.prospective = null; }
  ];
  for (const mutate of mutations) {
    const m = market(); mutate(m.production_evaluation);
    assert.ok(evaluationIntegrityErrors(m.production_evaluation).length);
    assert.equal(serverEvaluationMatchesHistory(m.production_evaluation, history), false);
    assert.equal(assessMarketHealth(m, now).status, 'ERROR');
  }
});

test('parity measures ordered digits, absent fields, and numeric tolerance', () => {
  assert.equal(compareSnapshots({ weights: [1] }, { weights: [1 + 1e-10] }).status, 'MATCH');
  const p = compareSnapshots({ ai: [1, 2], missing: 7 }, { ai: [2, 1] });
  assert.equal(p.differingFields, 3);
  assert.equal(p.divergencePct, 100);
});

test('health and prospective panels label source, divergence, and early samples', () => {
  const p = compareSnapshots(productionSnapshot(original.next_prediction), diagnosticSnapshot(local));
  const html = renderToStaticMarkup(React.createElement(MarketHealthPanel, { health: assessMarketHealth(original, now, p), productionAvailable: true }));
  assert.match(html, /DRIFT/); assert.match(html, /Python/); assert.match(html, /TypeScript/);
  const evaluation = renderToStaticMarkup(React.createElement(ProductionEvaluationPanel, { metrics: original.production_evaluation, marketName: 'FIXTURE' }));
  assert.match(evaluation, /Prospective Live Holdout/); assert.match(evaluation, /2\/30/);
  assert.match(evaluation, /Jangan gunakan hasil ini untuk tuning production/);
  assert.match(evaluation, /Inconclusive/);
});

test('Firestore failures explicitly label cached data and expose the error', async () => {
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline fixture'); };
  try {
    const result = await fetchAllMarkets();
    assert.equal(result.source, 'cached'); assert.equal(result.error, 'offline fixture');
    assert.ok(result.markets.every(m => m.data_source === 'cached'));
  } finally { globalThis.fetch = fetchBefore; }
});

test('legacy zero-live projection stays available but is marked pending migration', () => {
  // A genuinely empty legacy state is built from a zero-live projection exported by Python.
  const m = market();
  const s = m.production_evaluation;
  s.accumulators = structuredClone(s.accumulators.live_only);
  // Use a zero-live historical projection derived from this live-only segment.
  Object.assign(s, s.prospective);
  s.accumulators.replay_draws = s.tested_draws;
  s.replay_draws = s.tested_draws;
  s.live_draws = 0;
  s.twin_rate_pct = s.twin_count / s.tested_draws * 100;
  delete s.prospective;
  assert.deepEqual(evaluationIntegrityErrors(s, true), []);
  assert.equal(serverEvaluationMatchesHistory(s, history), true);
  assert.equal(assessMarketHealth(m, now).status, 'STALE');
  s.live_draws = 1;
  assert.equal(serverEvaluationMatchesHistory(s, history), false);
});

test('Firestore pagination is complete before marking the source live', async () => {
  const fetchBefore = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ documents: [{ name: `markets/${calls}`, fields: { id: { stringValue: String(calls) } } }], ...(calls === 1 ? { nextPageToken: 'next' } : {}) }), { status: 200 });
  };
  try {
    const result = await fetchAllMarkets();
    assert.equal(result.source, 'live'); assert.equal(result.markets.length, 2);
    assert.ok(result.markets.every(m => m.data_source === 'live'));
  } finally { globalThis.fetch = fetchBefore; }
});
