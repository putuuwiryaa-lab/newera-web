import type { PredictionResult, TierAuditStatus } from './types';
import { auditAndCalibrate, type CalibrationAudit } from './smartCalibrator';

export const PRODUCTION_ENGINE_VERSION = '2026.09.11-v2';

export function serverPredictionMatchesHistory(server: any, results4D: string[]): boolean {
  if (!server || typeof server !== 'object' || results4D.length === 0) return false;
  const version = String(server.engine_version ?? server.engineVersion ?? '');
  const basisCount = Number(server.basis_draw_count ?? server.basisDrawCount ?? -1);
  const basisLastDraw = String(server.basis_last_draw ?? server.basisLastDraw ?? '');
  return (
    version === PRODUCTION_ENGINE_VERSION
    && basisCount === results4D.length
    && basisLastDraw === results4D[results4D.length - 1]
  );
}

function intArray(
  value: any,
  fallback: number[],
  min = 0,
  max = 9,
  expectedLength?: number
): number[] {
  if (!Array.isArray(value)) return fallback;
  const out = Array.from(new Set(
    value
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= min && n <= max)
  ));
  if (expectedLength !== undefined && out.length !== expectedLength) return fallback;
  return out.length ? out : fallback;
}

function lineArray(value: any, fallback: string[], expectedLength?: number): string[] {
  if (!Array.isArray(value)) return fallback;
  const out = Array.from(new Set(
    value.map(String).filter((v) => /^\d{2,4}$/.test(v))
  ));
  if (expectedLength !== undefined && out.length !== expectedLength) return fallback;
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

function readStringNumberRecord(value: any, fallback: Record<string, number>): Record<string, number> {
  if (!value || typeof value !== 'object') return fallback;
  const out: Record<string, number> = {};
  Object.entries(value).forEach(([key, raw]) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) out[key] = n;
  });
  return Object.keys(out).length ? out : fallback;
}

function readNumberRecord(value: any, fallback: Record<number, number>): Record<number, number> {
  if (!value || typeof value !== 'object') return fallback;
  const out: Record<number, number> = {};
  Object.entries(value).forEach(([key, raw]) => {
    const k = Number(key);
    const n = Number(raw);
    if (Number.isFinite(k) && Number.isFinite(n) && n >= 0) out[k] = n;
  });
  return Object.keys(out).length ? out : fallback;
}

function normalizedNumberRecord(value: any, fallback: Record<number, number>): Record<number, number> {
  const out = readNumberRecord(value, fallback);
  const total = Object.values(out).reduce((a, b) => a + b, 0);
  if (total <= 0) return fallback;
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [Number(k), v / total])
  );
}

function normalizedStringRecord(value: any, fallback: Record<string, number>): Record<string, number> {
  const out = readStringNumberRecord(value, fallback);
  const total = Object.values(out).reduce((a, b) => a + b, 0);
  if (total <= 0) return fallback;
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v / total]));
}

function clampConfidence(value: any, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
}

/**
 * Backend Firestore adalah source of truth untuk prediction production.
 * Metadata visual/diagnostik yang belum disimpan backend tetap memakai hasil lokal.
 */
export function mergeServerPrediction(
  local: PredictionResult | null,
  server: any,
  results4D: string[]
): PredictionResult | null {
  if (!local || !serverPredictionMatchesHistory(server, results4D)) return local;

  const tierMethodWeights = readTierWeights(server.tier_method_weights || server.tierMethodWeights)
    || local.tierMethodWeights;
  const bbfsTierWeights = readTierWeights(server.bbfs_tier_weights || server.bbfsTierWeights)
    || local.bbfsTierWeights;

  let paitoPrediction = local.paitoPrediction;
  const sp = server.paito;
  if (paitoPrediction && sp && typeof sp === 'object') {
    const parity = String(sp.primary_parity || sp.primaryParity || paitoPrediction.primaryParity);
    const magnitude = String(sp.primary_magnitude || sp.primaryMagnitude || paitoPrediction.primaryMagnitude);
    const jalurRaw = Number(sp.primary_jalur ?? sp.primaryJalur ?? paitoPrediction.primaryJalur);
    const validParity = ['Genap-Genap', 'Genap-Ganjil', 'Ganjil-Genap', 'Ganjil-Ganjil'].includes(parity)
      ? parity as typeof paitoPrediction.primaryParity
      : paitoPrediction.primaryParity;
    const validMagnitude = magnitude === 'Besar' || magnitude === 'Kecil'
      ? magnitude
      : paitoPrediction.primaryMagnitude;
    const validJalur = jalurRaw === 1 || jalurRaw === 2 || jalurRaw === 3
      ? jalurRaw as 1 | 2 | 3
      : paitoPrediction.primaryJalur;

    paitoPrediction = {
      ...paitoPrediction,
      topBiji: intArray(sp.top_biji || sp.topBiji, paitoPrediction.topBiji, 0, 9, 3),
      bijiProbabilities: normalizedNumberRecord(
        sp.biji_probabilities || sp.bijiProbabilities,
        paitoPrediction.bijiProbabilities
      ),
      primaryParity: validParity,
      parityProbabilities: normalizedStringRecord(
        sp.parity_probabilities || sp.parityProbabilities,
        paitoPrediction.parityProbabilities
      ),
      primaryMagnitude: validMagnitude,
      magnitudeProbabilities: normalizedStringRecord(
        sp.magnitude_probabilities || sp.magnitudeProbabilities,
        paitoPrediction.magnitudeProbabilities
      ),
      topShios: intArray(sp.top_shios || sp.topShios, paitoPrediction.topShios, 1, 12, 3),
      primaryJalur: validJalur,
      shioProbabilities: normalizedNumberRecord(
        sp.shio_probabilities || sp.shioProbabilities,
        paitoPrediction.shioProbabilities
      ),
      jalurProbabilities: normalizedNumberRecord(
        sp.jalur_probabilities || sp.jalurProbabilities,
        paitoPrediction.jalurProbabilities
      ),
      confidenceScore: clampConfidence(
        sp.confidence_score ?? sp.confidenceScore,
        paitoPrediction.confidenceScore
      )
    };
  }

  let polaTarung = local.polaTarung;
  const st = server.pola_tarung || server.polaTarung;
  if (polaTarung && st && typeof st === 'object') {
    const kd = String(st.kepala_direction || st.kepalaDirection || polaTarung.kepalaDirection);
    const ed = String(st.ekor_direction || st.ekorDirection || polaTarung.ekorDirection);
    const direction = (v: string, fallback: 'NAIK' | 'TURUN' | 'STABIL') =>
      (v === 'NAIK' || v === 'TURUN' || v === 'STABIL') ? v : fallback;
    polaTarung = {
      ...polaTarung,
      rankedKepala: intArray(st.ranked_kepala || st.rankedKepala, polaTarung.rankedKepala, 0, 9, 10),
      rankedEkor: intArray(st.ranked_ekor || st.rankedEkor, polaTarung.rankedEkor, 0, 9, 10),
      kepalaDirection: direction(kd, polaTarung.kepalaDirection),
      ekorDirection: direction(ed, polaTarung.ekorDirection),
      tarung3x3: lineArray(st.tarung_3x3 || st.tarung3x3, polaTarung.tarung3x3, 9),
      tarung4x4: lineArray(st.tarung_4x4 || st.tarung4x4, polaTarung.tarung4x4, 16),
      tarung5x5: lineArray(st.tarung_5x5 || st.tarung5x5, polaTarung.tarung5x5, 25)
    };
  }

  let paitoBBFS7 = local.paitoBBFS7;
  const sb = server.paito_bbfs7 || server.paitoBBFS7;
  if (paitoBBFS7 && sb && typeof sb === 'object') {
    const serverDigits = intArray(sb.digits || sb.ranked7, paitoBBFS7.digits, 0, 9, 7);
    paitoBBFS7 = {
      ...paitoBBFS7,
      digits: serverDigits,
      ranked7: serverDigits,
      nuklir6: lineArray(sb.nuklir6, paitoBBFS7.nuklir6, 6),
      bom12: lineArray(sb.bom12, paitoBBFS7.bom12, 12),
      invest20: lineArray(sb.invest20, paitoBBFS7.invest20, 20),
      full42: lineArray(sb.full42, paitoBBFS7.full42, 42),
      twin7: lineArray(sb.twin7, paitoBBFS7.twin7, 7)
    };
  }

  let wheeling7 = local.wheeling7;
  const sw = server.wheeling7;
  if (wheeling7 && sw && typeof sw === 'object') {
    wheeling7 = {
      ...wheeling7,
      wheel3D: lineArray(sw.wheel_3d || sw.wheel3D, wheeling7.wheel3D),
      wheel3DFull: lineArray(sw.wheel_3d_full || sw.wheel3DFull, wheeling7.wheel3DFull),
      wheel4D: lineArray(sw.wheel_4d || sw.wheel4D, wheeling7.wheel4D),
      wheel4DFull: lineArray(sw.wheel_4d_full || sw.wheel4DFull, wheeling7.wheel4DFull),
      guarantee3D: String(sw.guarantee_3d || sw.guarantee3D || wheeling7.guarantee3D),
      guarantee4D: String(sw.guarantee_4d || sw.guarantee4D || wheeling7.guarantee4D)
    };
  }

  return {
    ...local,
    ai: {
      3: intArray(server.ai3 || server.ai?.[3], local.ai[3], 0, 9, 3),
      4: intArray(server.ai4 || server.ai?.[4], local.ai[4], 0, 9, 4),
      5: intArray(server.ai5 || server.ai?.[5], local.ai[5], 0, 9, 5),
      6: intArray(server.ai6 || server.ai?.[6], local.ai[6], 0, 9, 6)
    },
    bbfs: {
      6: intArray(server.bbfs6 || server.bbfs?.[6], local.bbfs[6], 0, 9, 6),
      7: intArray(server.bbfs7 || server.bbfs?.[7], local.bbfs[7], 0, 9, 7),
      8: intArray(server.bbfs8 || server.bbfs?.[8], local.bbfs[8], 0, 9, 8),
      9: intArray(server.bbfs9 || server.bbfs?.[9], local.bbfs[9], 0, 9, 9)
    },
    tierMethodWeights,
    methodWeights: tierMethodWeights[4] || local.methodWeights,
    bbfsTierWeights,
    deadDigits: intArray(server.dead_digits || server.deadDigits, local.deadDigits, 0, 9, 2),
    paitoPrediction,
    polaTarung,
    paitoBBFS7,
    wheeling7
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
  if (!serverPredictionMatchesHistory(nextPrediction, results4D)) return null;
  const currentLast = results4D[results4D.length - 1] || '';
  const actualFull = String(serverAudit.actual_result || currentLast || '0000');
  if (!/^\d{4}$/.test(actualFull) || actualFull !== currentLast) return null;

  const actualK = Number(actualFull[2]);
  const actualE = Number(actualFull[3]);
  const isTwin = Boolean(serverAudit.is_twin ?? (actualK === actualE));
  const aiTuning = serverAudit.ai_tuning || serverAudit.aiTuning || {};
  const bbfsTuning = serverAudit.bbfs_tuning || serverAudit.bbfsTuning || {};
  const prev = serverAudit.previous_prediction || serverAudit.previousPrediction || {};

  const aiTierAudits = convertTierAudits(aiTuning.tier_audits || aiTuning.tierAudits, 'ai', [3, 4, 5, 6]);
  const bbfsTierAudits = convertTierAudits(bbfsTuning.tier_audits || bbfsTuning.tierAudits, 'bbfs', [6, 7, 8, 9]);

  if (isTwin) {
    [6, 7, 8, 9].forEach((size) => {
      bbfsTierAudits[size] = {
        ...bbfsTierAudits[size],
        status: 'LOSE',
        action: 'CALIBRATED',
        tuningDirective: 'Twin kalah pada BBFS non-twin; kalibrasi tier',
        marginalNote: `Twin ${actualK}${actualE} tidak ada di line non-twin`
      };
    });
  }

  // Audit harus memakai bobot yang disimpan bersama last_audit. next_prediction
  // hanya fallback legacy jika dokumen audit lama belum menyimpan bobot per-tier.
  const tierWeights = readTierWeights(
    aiTuning.tier_method_weights || aiTuning.tierMethodWeights
  ) || readTierWeights(nextPrediction?.tier_method_weights || nextPrediction?.tierMethodWeights) || {};
  const bbfsWeights = readTierWeights(
    bbfsTuning.tier_factor_weights || bbfsTuning.tierFactorWeights
  ) || readTierWeights(nextPrediction?.bbfs_tier_weights || nextPrediction?.bbfsTierWeights) || {};
  const calibratedWeights = readStringNumberRecord(
    aiTuning.calibrated_weights || aiTuning.calibratedWeights,
    tierWeights[4] || {}
  );

  let twinGap = 0;
  for (let i = results4D.length - 1; i >= 0; i--) {
    const r = results4D[i];
    if (/^\d{4}$/.test(r) && r[2] === r[3]) break;
    twinGap++;
  }
  const twinAnomalyLevel: CalibrationAudit['twinAnomalyLevel'] =
    twinGap >= 20 ? 'EKSTREM' : twinGap >= 14 ? 'MENINGKAT' : 'NORMAL';

  const statusAI = normalizeStatus(serverAudit.status_ai || serverAudit.statusAI || aiTuning.status_ai4);
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

  // Server belum menyimpan semua metrik diagnostik lama. Rekonstruksi lokal hanya
  // mengisi statistik sekunder; status/prediksi/tuning utama tetap milik server.
  const localFallback = auditAndCalibrate(results4D);
  const streak = Number.isFinite(Number(aiTuning.streak))
    ? Number(aiTuning.streak)
    : (localFallback?.streakCount || 0);
  const regimeAI: CalibrationAudit['regime'] = localFallback?.regime || 'NORMAL';

  const deadDigits = intArray(
    bbfsTuning.dead_digits || bbfsTuning.deadDigits || prev.dead_digits || prev.deadDigits,
    localFallback?.bbfsAudit.deadDigits || [],
    0,
    9,
    2
  );
  const deadDigitsClean = Boolean(
    bbfsTuning.dead_digits_clean ?? bbfsTuning.deadDigitsClean ?? localFallback?.bbfsAudit.deadDigitsClean ?? true
  );
  const rawIsolation = Number(
    bbfsTuning.dead_digits_isolation_rate14 ?? bbfsTuning.deadDigitsIsolationRate14
  );
  const deadDigitsIsolationRate14 = Number.isFinite(rawIsolation)
    ? rawIsolation
    : (localFallback?.bbfsAudit.deadDigitsIsolationRate14 || 0);

  const aiDiagnosis = String(aiTuning.action_summary || aiTuning.actionSummary || 'Audit production dari Firestore');
  const bbfsDiagnosis = isTwin
    ? `Result ${actualK}${actualE} twin: semua BBFS non-twin dinormalisasi sebagai LOSE.`
    : String(bbfsTuning.action_summary || bbfsTuning.actionSummary || 'Audit BBFS production dari Firestore');

  let regimeBBFS: CalibrationAudit['bbfsAudit']['regime'] = 'NORMAL';
  if (isTwin) regimeBBFS = 'TWIN_SHOCK';
  else if (!deadDigitsClean) regimeBBFS = 'DEAD_DIGIT_ALERT';
  else if (bbfsTierAudits[6]?.action === 'FREEZE') regimeBBFS = 'HIGH_COUPLING';
  else if (statusBBFS === 'LOSE') regimeBBFS = 'EXPANDED_DEFENSE';

  return {
    previousDraw: { full: actualFull, kepala: actualK, ekor: actualE },
    previousPrediction: {
      ai4: intArray(prev.ai4, localFallback?.previousPrediction.ai4 || [], 0, 9, 4),
      bbfs7: intArray(prev.bbfs7, localFallback?.previousPrediction.bbfs7 || [], 0, 9, 7)
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
    streakCount: streak,
    aiAudit: {
      tierAudits: aiTierAudits,
      hitDigits,
      statusAI4: statusAI,
      rewardedMethods: rewardApplied,
      penalizedMethods: penaltyApplied,
      calibratedWeights,
      calibratedTierWeights: tierWeights,
      tierMethodWeights: tierWeights,
      streak,
      regime: regimeAI,
      recommendedTier: String(aiTuning.recommended_tier || aiTuning.recommendedTier || 'AI-4'),
      diagnosis: aiDiagnosis,
      actionSummary: aiDiagnosis
    },
    bbfsAudit: {
      tierAudits: bbfsTierAudits,
      deadDigits,
      deadDigitsClean,
      deadDigitsIsolationRate14,
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
