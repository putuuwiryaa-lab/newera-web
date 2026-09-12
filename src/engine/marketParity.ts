import { generatePrediction } from './adaptiveEngine';
import { AI_SIZES, BBFS_SIZES, matchesBasis, predictionIntegrityErrors } from './productionContract';
import { compareSnapshots, diagnosticSnapshot, productionSnapshot } from './engineParity';
import type { Market } from './types';

/** Runtime parity holds both the history AND persisted factor/method weights constant. */
export function compareMarketEngines(market: Market) {
  const history = market.history_data.trim().split(/\s+/).filter(r => /^\d{4}$/.test(r));
  const server = market.next_prediction;
  if (!matchesBasis(server, history) || predictionIntegrityErrors(server).length) return undefined;
  const local = generatePrediction(history, {
    aiAudit: { tierAudits: Object.fromEntries(AI_SIZES.map(n => [n, { action: 'FREEZE' }])), tierMethodWeights: server.tier_method_weights },
    bbfsAudit: { tierAudits: Object.fromEntries(BBFS_SIZES.map(n => [n, { action: 'FREEZE' }])), tierFactorWeights: server.bbfs_tier_weights }
  });
  if (!local) return undefined;
  const py = productionSnapshot(server), ts = diagnosticSnapshot(local);
  // Legacy documents have no full rankings. Report only fields actually persisted.
  if (!server.tier_ranked_digits) { delete py.ai_rankings; delete ts.ai_rankings; }
  return compareSnapshots(py, ts);
}
