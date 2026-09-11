import type { PredictionResult, TierAuditStatus } from './types';
import type { CalibrationAudit } from './smartCalibrator';

function numberArray(value: any, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;
  const out = value.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 9);
  return out.length ? out : fallback;
}

function readTierWeights(value: any): Record<number, Record<string, number>> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const out: Record<number, Record<string, number>> = {};
  Object.entries(value).forEach(([key, raw]) => {
    const tier = Number(key);
    if (!Number.isFinite(tier) || !raw || typeof raw !== 'object') return;
    const mapped: Record<string, number> = {};
    Object.entries(raw as Record<string, any>).forEach(([name, v]) => {
      const n = Number(v);
      if (Number.isFinite(n)) mapped[name] = n;
    });
    if (Object.keys(mapped).length) out[tier] = mapped;
  });
  return Object.keys(out).length ? out : undefined;
}

/**
 * Backend Firestore adalah source of truth untuk tier AI/BBFS dan bobot yang
 * sudah melalui audit production. Kalkulasi lokal tetap menyediakan detail
 * paito/heatmap serta fallback jika dokumen server belum punya prediction.
 */
export function mergeServerPrediction(
  local: PredictionResult | null,
  server: any
): PredictionResult | null {
  if (!local || !server || typeof server !== 'object') return local;

  const tierMethodWeights = readTierWeights(server.tier_method_weights || server.tierMethodWeights)
    || local.tierMethodWeights;
  const bbfsTierWeights = readTierWeights(server.bbfs_tier_weights || server.bbfsTierWeights)
    || local.bbfsTierWeights;

  return {
    ...local,
    ai: {
      3: numberArray(server.ai3 || server.ai?.[3], local.ai[3]),
      4: numberArray(server.ai4 || server.ai?.[4], local.ai[4]),
      5: numberArray(server.ai5 || server.ai?.[5], local.ai[5]),
      6: numberArray(server.ai6 || server.ai?.[6], local.ai[6])
    },
    bbfs: {
      6: numberArray(server.bbfs6 || server.bbfs?.[6], local.bbfs[6]),
      7: numberArray(server.bbfs7 || server.bbfs?.[7], local.bbfs[7]),
      8: numberArray(server.bbfs8 || server.bbfs?.[8], local.bbfs[8]),
      9: numberArray(server.bbfs9 || server.bbfs?.[9], local.bbfs[9])
    },
    tierMethodWeights,
    methodWeights: tierMethodWeights[4] || local.methodWeights,
    bbfsTierWeights,
    deadDigits: numberArray(server.dead_digits || server.deadDigits, local.deadDigits)
  };
}

function normalizeStatus(value: any): 'HIT' | 'LOSE' {
  return String(value).toUpperCase() === 'HIT' ? 'HIT' : 'LOSE';
}

function normalizeAction(value: any): 'FREEZE' | 'CALIBRATED' {
  return String(value).toUpperCase() === 'FREEZE' ? 'FREEZE' : 'CALIBRATED';
}

function convertTierAudits(
  source: any,
  prefix: 'ai' | 'bbfs',
  sizes: number[]
): Record<number, TierAuditStatus> {
  const out: Record<number, TierAuditStatus> = {};
  sizes.forEach((size) => {
    const raw = source?.[`${prefix}${size}`] || source?.[size] || source?.[String(size)] || {};
    const status = normalizeStatus(raw.status);
    const action = normalizeAction(raw.action || (status === 'HIT' ? 'FREEZE' : 'CALIBRATED'));
    out[size] = {
      size,
      name: `${prefix === 'ai' ? 'AI' : 'BBFS'}-${size}`,
      parameter: raw.parameter || `${prefix === 'ai' ? 'AI' : 'BBFS'}-${size}`,
      status,
      action,
      tuningDirective: raw.tuning_directive || raw.tuningDirective || (action === 'FREEZE' ? 'Freeze' : 'Kalibrasi'),
      marginalNote: raw.marginal_note || raw.marginalNote || ''
    };
  });
  return out;
}

/** Convert last_audit Python/Firebase ke bentuk CalibrationAudit frontend. */
export function calibrationAuditFromServer(
  serverAudit: any,
  nextPrediction: any,
  results4D: string[]
): CalibrationAudit | null {
  if (!serverAudit || typeof serverAudit !== 'object') return null;
  const actualFull = String(serverAudit.actual_result || results4D[results4D.length - 1] || '0000');
  if (!/^\d{4}$/.test(actualFull)) return null;

  const actualK = Number(actualFull[2]);
  const actualE = Number(actualFull[3]);
  const isTwin = Boolean(serverAudit.is_twin ?? actualK === actualE);
  const aiTuning = serverAudit.ai_tuning || serverAudit.aiTuning || {};
  const bbfsTuning = serverAudit.bbfs_tuning || serverAudit.bbfsTuning || {};
  const prev = serverAudit.previous_prediction || serverAudit.previousPrediction || {};

  const aiTierAudits = convertTierAudits(aiTuning.tier_audits || aiTuning.tierAudits, 'ai', [3, 4, 5, 6]);
  const bbfsTierAudits = convertTierAudits(bbfsTuning.tier_audits || bbfsTuning.tierAudits, 'bbfs', [6, 7, 8, 9]);

  const tierWeights = readTierWeights(nextPrediction?.tier_method_weights || nextPrediction?.tierMethodWeights) || {};
  const bbfsWeights = readTierWeights(nextPrediction?.bbfs_tier_weights || nextPrediction?.bbfsTierWeights) || {};
  const calibratedWeights = aiTuning.calibrated_weights || aiTuning.calibratedWeights || tierWeights[4] || {};

  let twinGap = 0;
  for (let i = results4D.length - 1; i >= 0; i--) {
    const r = results4D[i];
    if (/^\d{4}$/.test(r) && r[2] === r[3]) break;
    twinGap++;
  }
  const twinAnomalyLevel: CalibrationAudit['twinAnomalyLevel'] =
    twinGap >= 20 ? 'EKSTREM' : twinGap >= 14 ? 'MENINGKAT' : 'NORMAL';

  const statusAI = normalizeStatus(serverAudit.status_ai || serverAudit.statusAI || aiTuning.status_ai4);
  // Untuk non-twin BBFS, backend lama mungkin pernah menandai twin sebagai HIT.
  // Frontend menormalkan ulang agar rule baru konsisten.
  const statusBBFS: 'HIT' | 'LOSE' = isTwin
    ? 'LOSE'
    : normalizeStatus(serverAudit.status_bbfs || serverAudit.statusBBFS || bbfsTuning.status_bbfs7);

  const hitDigits = Array.isArray(aiTuning.hit_digits || aiTuning.hitDigits)
    ? (aiTuning.hit_digits || aiTuning.hitDigits).map(Number)
    : [];
  const rewardApplied = Array.isArray(aiTuning.rewarded_methods || aiTuning.rewardedMethods)
    ? (aiTuning.rewarded_methods || aiTuning.rewardedMethods).map(String)
    : [];
  const penaltyApplied = Array.isArray(aiTuning.penalized_methods || aiTuning.penalizedMethods)
    ? (aiTuning.penalized_methods || aiTuning.penalizedMethods).map(String)
    : [];

  const aiDiagnosis = String(aiTuning.action_summary || aiTuning.actionSummary || 'Audit production dari Firestore');
  const bbfsDiagnosis = isTwin
    ? `Result ${actualK}${actualE} twin: BBFS non-twin dinormalisasi sebagai LOSE.`
    : String(bbfsTuning.action_summary || bbfsTuning.actionSummary || 'Audit BBFS production dari Firestore');

  const regimeAI: CalibrationAudit['regime'] = 'NORMAL';
  const regimeBBFS: CalibrationAudit['bbfsAudit']['regime'] = isTwin ? 'TWIN_SHOCK' : statusBBFS === 'LOSE' ? 'EXPANDED_DEFENSE' : 'NORMAL';

  return {
    previousDraw: { full: actualFull, kepala: actualK, ekor: actualE },
    previousPrediction: {
      ai4: numberArray(prev.ai4, []),
      bbfs7: numberArray(prev.bbfs7, [])
    },
    statusAI,
    statusBBFS,
    isTwin,
    twinGap,
    twinAnomalyLevel,
    hitDigits,
    diagnosis: aiDiagnosis,
    penaltyApplied,
    rewardApplied,
    calibratedWeights,
    regime: regimeAI,
    recommendedTier: String(aiTuning.recommended_tier || aiTuning.recommendedTier || 'AI-4'),
    streakCount: 0,
    aiAudit: {
      tierAudits: aiTierAudits,
      hitDigits,
      statusAI4: statusAI,
      rewardedMethods: rewardApplied,
      penalizedMethods: penaltyApplied,
      calibratedWeights,
      calibratedTierWeights: tierWeights,
      tierMethodWeights: tierWeights,
      streak: 0,
      regime: regimeAI,
      recommendedTier: String(aiTuning.recommended_tier || aiTuning.recommendedTier || 'AI-4'),
      diagnosis: aiDiagnosis,
      actionSummary: aiDiagnosis
    },
    bbfsAudit: {
      tierAudits: bbfsTierAudits,
      deadDigits: numberArray(bbfsTuning.dead_digits || bbfsTuning.deadDigits || nextPrediction?.dead_digits, []),
      deadDigitsClean: Boolean(bbfsTuning.dead_digits_clean ?? bbfsTuning.deadDigitsClean ?? true),
      deadDigitsIsolationRate14: 0,
      statusBBFS7: statusBBFS,
      isTwin,
      twinStatus: !isTwin ? 'NON_TWIN' : 'TWIN_UNPROTECTED',
      trimmerZone: (bbfsTuning.trimmer_zone || bbfsTuning.trimmerZone || 'MISSED') as CalibrationAudit['bbfsAudit']['trimmerZone'],
      rewardedFactor: String(bbfsTuning.rewarded_factor || bbfsTuning.rewardedFactor || 'State production'),
      penalizedFactor: String(bbfsTuning.penalized_factor || bbfsTuning.penalizedFactor || 'State production'),
      regime: regimeBBFS,
      recommendedTier: String(bbfsTuning.recommended_tier || bbfsTuning.recommendedTier || 'BBFS-7'),
      diagnosis: bbfsDiagnosis,
      actionSummary: bbfsDiagnosis,
      tierFactorWeights: bbfsWeights
    }
  };
}
