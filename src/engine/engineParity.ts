import type { PredictionResult } from './types';
import type { CalibrationAudit } from './smartCalibrator';
import { AI_SIZES, BBFS_SIZES } from './productionContract';

export const DIAGNOSTIC_ENGINE_VERSION = '2026.09.11-ts-diagnostic-v1';
export const PARITY_TOLERANCE = 1e-8;
export interface Divergence { path: string; python: unknown; typescript: unknown; absoluteDelta?: number }
export interface ParityResult {
  status: 'MATCH' | 'DRIFT' | 'UNAVAILABLE';
  comparedFields: number;
  differingFields: number;
  divergencePct: number;
  groups: Record<string, { compared: number; differing: number; maxAbsoluteDelta: number }>;
  differences: Divergence[];
}

export function diagnosticSnapshot(p: PredictionResult, audit?: CalibrationAudit | null): Record<string, any> {
  const sp = p.paitoPrediction;
  const result: Record<string, any> = {
    ai_rankings: p.tierRankedDigits,
    ai_digits: p.ai, bbfs_digits: p.bbfs,
    paito: sp ? {
      top_biji: sp.topBiji, biji_probabilities: sp.bijiProbabilities,
      primary_parity: sp.primaryParity, parity_probabilities: sp.parityProbabilities,
      primary_magnitude: sp.primaryMagnitude, magnitude_probabilities: sp.magnitudeProbabilities,
      top_shios: sp.topShios, shio_probabilities: sp.shioProbabilities,
      primary_jalur: sp.primaryJalur, jalur_probabilities: sp.jalurProbabilities,
      confidence_score: sp.confidenceScore
    } : null,
    method_weights: p.tierMethodWeights, factor_weights: p.bbfsTierWeights, dead_digits: p.deadDigits
  };
  if (audit) result.calibration = {
    ai: Object.fromEntries(AI_SIZES.map(n => [n, { status: audit.aiAudit.tierAudits[n].status, action: audit.aiAudit.tierAudits[n].action }])),
    bbfs: Object.fromEntries(BBFS_SIZES.map(n => [n, { status: audit.bbfsAudit.tierAudits[n].status, action: audit.bbfsAudit.tierAudits[n].action }])),
    rewarded_methods: [...audit.rewardApplied].sort(), penalized_methods: [...audit.penaltyApplied].sort(),
    twin_status: audit.bbfsAudit.twinStatus
  };
  return result;
}

export function productionSnapshot(p: any): Record<string, any> {
  return {
    ai_rankings: p.tier_ranked_digits,
    ai_digits: Object.fromEntries(AI_SIZES.map(n => [n, p[`ai${n}`]])),
    bbfs_digits: Object.fromEntries(BBFS_SIZES.map(n => [n, p[`bbfs${n}`]])),
    paito: p.paito && Object.fromEntries(Object.entries(p.paito).filter(([k]) => !['overdue_shios', 'overdue_alerts'].includes(k))),
    method_weights: p.tier_method_weights, factor_weights: p.bbfs_tier_weights, dead_digits: p.dead_digits
  };
}

/** Compare raw engines BEFORE the Firestore overlay; order matters for rankings/digits. */
export function compareSnapshots(python: Record<string, any>, typescript: Record<string, any>): ParityResult {
  const differences: Divergence[] = [];
  const groups: ParityResult['groups'] = {};
  const visit = (a: any, b: any, path: string, group: string) => {
    const objectA = a !== null && typeof a === 'object';
    const objectB = b !== null && typeof b === 'object';
    if (objectA && objectB && Array.isArray(a) === Array.isArray(b)) {
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
      if (keys.length) { for (const k of keys) visit(a[k], b[k], `${path}.${k}`, group); return; }
    }
    const stats = groups[group] ??= { compared: 0, differing: 0, maxAbsoluteDelta: 0 };
    stats.compared++;
    const numeric = typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b);
    const delta = numeric ? Math.abs(a - b) : undefined;
    if (delta !== undefined) stats.maxAbsoluteDelta = Math.max(stats.maxAbsoluteDelta, delta);
    const equal = delta !== undefined ? delta <= PARITY_TOLERANCE : a === b || (objectA && objectB && JSON.stringify(a) === JSON.stringify(b));
    if (!equal) { stats.differing++; differences.push({ path, python: a ?? null, typescript: b ?? null, ...(delta !== undefined ? { absoluteDelta: delta } : {}) }); }
  };
  for (const group of [...new Set([...Object.keys(python), ...Object.keys(typescript)])].sort()) visit(python[group], typescript[group], group, group);
  const comparedFields = Object.values(groups).reduce((s, g) => s + g.compared, 0);
  return { status: differences.length ? 'DRIFT' : 'MATCH', comparedFields, differingFields: differences.length,
    divergencePct: comparedFields ? 100 * differences.length / comparedFields : 0, groups, differences };
}
