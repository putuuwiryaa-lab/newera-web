import type {
  DayTuningLog,
  TierAuditStatus,
  AITuningDetail,
  BBFSTuningDetail,
  PaitoTuningDetail,
  PredictionResult
} from './types';
import {
  getMomentumScores,
  getMarkovScores,
  getDeltaScores,
  getAdaptiveMistikScores,
  generatePrediction
} from './adaptiveEngine';
import { generateSmartTrim, generateSniperTrim } from './generator';
import { computeBiji, getParity } from './paitoPredictor';
import { getShioFor2D } from './shio';

export interface CalibrationAudit {
  marketId?: string;
  previousDraw: { full: string; kepala: number; ekor: number };
  previousPrediction: { ai4: number[]; bbfs7: number[] };
  statusAI: 'HIT' | 'LOSE';
  statusBBFS: 'HIT' | 'LOSE';
  isTwin: boolean;
  twinGap: number;
  twinAnomalyLevel: 'NORMAL' | 'MENINGKAT' | 'EKSTREM';
  hitDigits: number[];
  diagnosis: string;
  penaltyApplied: string[];
  rewardApplied: string[];
  calibratedWeights: Record<string, number>;
  regime: 'NORMAL' | 'HIGH_MOMENTUM' | 'ANTI_STREAK_ALERT';
  recommendedTier: string;
  streakCount: number;
  aiAudit: {
    tierAudits: Record<number, TierAuditStatus>;
    hitDigits: number[];
    statusAI4: 'HIT' | 'LOSE';
    rewardedMethods: string[];
    penalizedMethods: string[];
    calibratedWeights: Record<string, number>;
    calibratedTierWeights: Record<number, Record<string, number>>;
    tierMethodWeights?: Record<number, Record<string, number>>;
    streak: number;
    regime: 'NORMAL' | 'HIGH_MOMENTUM' | 'ANTI_STREAK_ALERT';
    recommendedTier: string;
    diagnosis: string;
    actionSummary: string;
  };
  bbfsAudit: {
    tierAudits: Record<number, TierAuditStatus>;
    deadDigits: number[];
    deadDigitsClean: boolean;
    deadDigitsIsolationRate14: number;
    statusBBFS7: 'HIT' | 'LOSE';
    isTwin: boolean;
    twinStatus: 'NON_TWIN' | 'TWIN_PROTECTED' | 'TWIN_UNPROTECTED';
    trimmerZone: 'BOM_10' | 'MEDIUM_15' | 'CADANGAN' | 'MISSED';
    rewardedFactor: string;
    penalizedFactor: string;
    regime: 'HIGH_COUPLING' | 'NORMAL' | 'TWIN_SHOCK' | 'DEAD_DIGIT_ALERT' | 'EXPANDED_DEFENSE';
    recommendedTier: string;
    diagnosis: string;
    actionSummary: string;
    tierFactorWeights: Record<number, Record<string, number>>;
  };
}

const AI_SIZES = [3, 4, 5, 6] as const;
const BBFS_SIZES = [6, 7, 8, 9] as const;

function hasSignal(scores: Record<number, number>): boolean {
  return Object.values(scores).some((v) => Number.isFinite(v) && v > 0);
}

function getMethodScores(history: [number, number][]) {
  return {
    Momentum: getMomentumScores(history),
    Markov: getMarkovScores(history),
    Delta: getDeltaScores(history),
    Mistik: getAdaptiveMistikScores(history)
  };
}

function overlaySavedPrediction(
  fallback: PredictionResult,
  saved?: any
): PredictionResult {
  if (!saved || typeof saved !== 'object') return fallback;

  const readTierWeights = (obj: any): Record<number, Record<string, number>> | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const out: Record<number, Record<string, number>> = {};
    Object.entries(obj).forEach(([key, value]) => {
      const n = Number(key);
      if (Number.isFinite(n) && value && typeof value === 'object') {
        out[n] = value as Record<string, number>;
      }
    });
    return Object.keys(out).length ? out : undefined;
  };

  const tierMethodWeights = readTierWeights(saved.tier_method_weights || saved.tierMethodWeights)
    || fallback.tierMethodWeights;
  const bbfsTierWeights = readTierWeights(saved.bbfs_tier_weights || saved.bbfsTierWeights)
    || fallback.bbfsTierWeights;

  return {
    ...fallback,
    ai: {
      3: saved.ai3 || saved.ai?.[3] || fallback.ai[3],
      4: saved.ai4 || saved.ai?.[4] || fallback.ai[4],
      5: saved.ai5 || saved.ai?.[5] || fallback.ai[5],
      6: saved.ai6 || saved.ai?.[6] || fallback.ai[6]
    },
    bbfs: {
      6: saved.bbfs6 || saved.bbfs?.[6] || fallback.bbfs[6],
      7: saved.bbfs7 || saved.bbfs?.[7] || fallback.bbfs[7],
      8: saved.bbfs8 || saved.bbfs?.[8] || fallback.bbfs[8],
      9: saved.bbfs9 || saved.bbfs?.[9] || fallback.bbfs[9]
    },
    tierMethodWeights,
    bbfsTierWeights,
    deadDigits: saved.dead_digits || saved.deadDigits || fallback.deadDigits
  };
}

function tuneMethodWeight(prev: number, hit: boolean): number {
  const safePrev = Number.isFinite(prev) && prev > 0 ? prev : 1;
  const eta = 0.10;
  const target = safePrev * Math.exp(hit ? eta : -eta);
  const smoothed = 0.7 * safePrev + 0.3 * target;
  return Number(Math.max(0.5, Math.min(25, smoothed)).toFixed(2));
}

function tuneBBFSWeights(
  base: Record<string, number>,
  shouldCalibrate: boolean
): Record<string, number> {
  const out = { ...base };
  if (!shouldCalibrate) return out;

  // Koreksi nyata, bounded, dan konservatif. Pada miss, engine memperlebar
  // coverage/momentum dan mengurangi ketergantungan pada pair/transition lama.
  if (Number.isFinite(out['Coverage Proteksi'])) out['Coverage Proteksi'] *= 1.08;
  if (Number.isFinite(out['Momentum Posisi'])) out['Momentum Posisi'] *= 1.04;
  if (Number.isFinite(out['Densitas Pasangan'])) out['Densitas Pasangan'] *= 0.96;
  if (Number.isFinite(out['Transisi Markov'])) out['Transisi Markov'] *= 0.96;

  Object.keys(out).forEach((key) => {
    out[key] = Number(Math.max(2, Math.min(24, out[key])).toFixed(2));
  });
  return out;
}

/**
 * Audit result terakhir. savedPreviousPrediction harus berupa prediksi yang
 * memang dibuat sebelum result terakhir keluar. Jika tidak tersedia, engine
 * merekonstruksi fallback dari history T-1.
 */
export function auditAndCalibrate(
  results4D: string[],
  savedPreviousPrediction?: any
): CalibrationAudit | null {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length < 15) return null;

  const lastFull = valid4D[valid4D.length - 1];
  const actualK = Number(lastFull[2]);
  const actualE = Number(lastFull[3]);
  const isTwin = actualK === actualE;
  const historyUntilTMinus1 = valid4D.slice(0, -1);
  const fallback = generatePrediction(historyUntilTMinus1);
  if (!fallback) return null;
  const predTMinus1 = overlaySavedPrediction(fallback, savedPreviousPrediction);

  const ai4TMinus1 = predTMinus1.ai[4];
  const bbfs7TMinus1 = predTMinus1.bbfs[7];
  const hitDigits = Array.from(new Set(ai4TMinus1.filter((d) => d === actualK || d === actualE)));
  const statusAI: 'HIT' | 'LOSE' = hitDigits.length ? 'HIT' : 'LOSE';

  const aiTierAudits: Record<number, TierAuditStatus> = {};
  AI_SIZES.forEach((sz) => {
    const tierDigits = predTMinus1.ai[sz];
    const hit = tierDigits.includes(actualK) || tierDigits.includes(actualE);
    const ranking = predTMinus1.tierRankedDigits?.[sz] || predTMinus1.rankedDigits;
    const kIdx = ranking.indexOf(actualK);
    const eIdx = ranking.indexOf(actualE);
    const minRank = Math.min(kIdx >= 0 ? kIdx : 99, eIdx >= 0 ? eIdx : 99);
    aiTierAudits[sz] = {
      size: sz,
      name: `AI-${sz}`,
      parameter: `Parameter AI-${sz}`,
      status: hit ? 'HIT' : 'LOSE',
      action: hit ? 'FREEZE' : 'CALIBRATED',
      tuningDirective: hit ? 'Freeze bobot tier yang menang' : 'Kalibrasi bobot tier yang kalah',
      marginalNote: hit
        ? `Hit via digit ${tierDigits.filter((d) => d === actualK || d === actualE).join(' & ')}`
        : minRank < 10 ? `Digit aktual berada di rank ${minRank + 1} tier ini` : 'Meleset total'
    };
  });

  const bbfsTierAudits: Record<number, TierAuditStatus> = {};
  BBFS_SIZES.forEach((sz) => {
    const tierDigits = predTMinus1.bbfs[sz];
    const set = new Set(tierDigits);
    // Semua set BBFS di sini non-twin. Twin tidak boleh dianggap HIT/freeze.
    const hit = !isTwin && set.has(actualK) && set.has(actualE);
    bbfsTierAudits[sz] = {
      size: sz,
      name: `BBFS-${sz}`,
      parameter: `Parameter BBFS-${sz} (${sz * (sz - 1)} line non-twin)`,
      status: hit ? 'HIT' : 'LOSE',
      action: hit ? 'FREEZE' : 'CALIBRATED',
      tuningDirective: hit ? 'Freeze faktor tier yang menang' : 'Kalibrasi faktor tier yang kalah',
      marginalNote: isTwin
        ? `Twin ${actualK}${actualE}: kalah pada set non-twin`
        : hit ? `Tembus 2D ${actualK}${actualE}` : 'Set tidak menutup kedua digit'
    };
  });

  const bbfsSet7 = new Set(bbfs7TMinus1);
  const statusBBFS: 'HIT' | 'LOSE' = !isTwin && bbfsSet7.has(actualK) && bbfsSet7.has(actualE)
    ? 'HIT' : 'LOSE';

  const deadDigits = predTMinus1.deadDigits;
  const deadDigitsClean = !deadDigits.includes(actualK) && !deadDigits.includes(actualE);
  const trimmerResult = generateSmartTrim(bbfs7TMinus1);
  const target2D = `${actualK}${actualE}`;
  let trimmerZone: 'BOM_10' | 'MEDIUM_15' | 'CADANGAN' | 'MISSED' = 'MISSED';
  if (!isTwin && trimmerResult.top10.includes(target2D)) trimmerZone = 'BOM_10';
  else if (!isTwin && trimmerResult.medium15.includes(target2D)) trimmerZone = 'MEDIUM_15';
  else if (!isTwin && trimmerResult.cadangan.includes(target2D)) trimmerZone = 'CADANGAN';

  const history2D: [number, number][] = historyUntilTMinus1.map((r) => [Number(r[2]), Number(r[3])]);
  const methodScores = getMethodScores(history2D);
  const calibratedTierWeights: Record<number, Record<string, number>> = {};
  const rewarded = new Set<string>();
  const penalized = new Set<string>();

  AI_SIZES.forEach((sz) => {
    const base = predTMinus1.tierMethodWeights?.[sz] || predTMinus1.methodWeights;
    const next = { ...base };
    if (aiTierAudits[sz].action === 'CALIBRATED') {
      Object.entries(methodScores).forEach(([name, scores]) => {
        if (!hasSignal(scores)) return; // ABSTAIN: no reward/no penalty.
        const top = Object.keys(scores).map(Number)
          .sort((a, b) => scores[b] - scores[a] || a - b)
          .slice(0, sz);
        const hit = top.includes(actualK) || top.includes(actualE);
        next[name] = tuneMethodWeight(base[name] ?? 1, hit);
        if (hit) rewarded.add(name);
        else penalized.add(name);
      });
    }
    calibratedTierWeights[sz] = next;
  });

  const calibratedWeights = calibratedTierWeights[4] || { ...predTMinus1.methodWeights };

  const calibratedBBFSWeights: Record<number, Record<string, number>> = {};
  BBFS_SIZES.forEach((sz) => {
    calibratedBBFSWeights[sz] = tuneBBFSWeights(
      predTMinus1.bbfsTierWeights?.[sz] || {},
      bbfsTierAudits[sz].action === 'CALIBRATED'
    );
  });

  let cleanCount14 = 0;
  let evaluated14 = 0;
  for (let i = Math.max(5, valid4D.length - 14); i < valid4D.length; i++) {
    const p = generatePrediction(valid4D.slice(0, i));
    if (!p) continue;
    evaluated14++;
    const k = Number(valid4D[i][2]);
    const e = Number(valid4D[i][3]);
    if (!p.deadDigits.includes(k) && !p.deadDigits.includes(e)) cleanCount14++;
  }
  const deadDigitsIsolationRate14 = evaluated14
    ? Number(((cleanCount14 / evaluated14) * 100).toFixed(1)) : 0;

  let streak = 0;
  for (let i = valid4D.length - 1; i >= Math.max(5, valid4D.length - 7); i--) {
    const p = generatePrediction(valid4D.slice(0, i));
    if (!p) break;
    const k = Number(valid4D[i][2]);
    const e = Number(valid4D[i][3]);
    const hit = p.ai[4].includes(k) || p.ai[4].includes(e);
    if (streak === 0) streak = hit ? 1 : -1;
    else if (streak > 0 && hit) streak++;
    else if (streak < 0 && !hit) streak--;
    else break;
  }

  let twinGap = 0;
  for (let i = valid4D.length - 1; i >= 0; i--) {
    if (valid4D[i][2] === valid4D[i][3]) break;
    twinGap++;
  }
  const twinAnomalyLevel: 'NORMAL' | 'MENINGKAT' | 'EKSTREM' =
    twinGap >= 20 ? 'EKSTREM' : twinGap >= 14 ? 'MENINGKAT' : 'NORMAL';

  const allAIFrozen = AI_SIZES.every((sz) => aiTierAudits[sz].action === 'FREEZE');
  const aiCalibrated = AI_SIZES.filter((sz) => aiTierAudits[sz].action === 'CALIBRATED');
  const regimeAI: CalibrationAudit['regime'] = streak <= -2
    ? 'ANTI_STREAK_ALERT' : streak >= 3 ? 'HIGH_MOMENTUM' : 'NORMAL';
  const recommendedTierAI = streak <= -2 ? 'AI-5' : aiTierAudits[3].action === 'FREEZE' ? 'AI-3' : 'AI-4';
  const diagnosisAI = allAIFrozen
    ? `Semua tier AI hit pada ${actualK}${actualE}; bobot masing-masing tier di-freeze.`
    : `Tier ${aiCalibrated.map((x) => `AI-${x}`).join(', ')} dikalibrasi secara independen. Metode tanpa sinyal tidak ikut reward/penalty.`;

  let regimeBBFS: CalibrationAudit['bbfsAudit']['regime'] = 'NORMAL';
  if (isTwin) regimeBBFS = 'TWIN_SHOCK';
  else if (!deadDigitsClean) regimeBBFS = 'DEAD_DIGIT_ALERT';
  else if (bbfsTierAudits[6].action === 'FREEZE') regimeBBFS = 'HIGH_COUPLING';
  else if (statusBBFS === 'LOSE') regimeBBFS = 'EXPANDED_DEFENSE';

  const recommendedTierBBFS = isTwin ? 'Twin Guard / jangan anggap BBFS non-twin menang'
    : bbfsTierAudits[6].action === 'FREEZE' ? 'BBFS-6' : statusBBFS === 'LOSE' ? 'BBFS-8' : 'BBFS-7';
  const diagnosisBBFS = isTwin
    ? `Result ${actualK}${actualE} twin: semua tier BBFS non-twin dihitung LOSE dan tidak di-freeze.`
    : statusBBFS === 'HIT'
      ? `BBFS-7 menutup kedua digit ${actualK}${actualE}; tier yang hit di-freeze.`
      : `BBFS-7 meleset; faktor coverage/momentum dinaikkan konservatif dan pair/transition diturunkan.`;

  const rewardApplied = Array.from(rewarded);
  const penaltyApplied = Array.from(penalized);

  return {
    previousDraw: { full: lastFull, kepala: actualK, ekor: actualE },
    previousPrediction: { ai4: ai4TMinus1, bbfs7: bbfs7TMinus1 },
    statusAI,
    statusBBFS,
    isTwin,
    twinGap,
    twinAnomalyLevel,
    hitDigits,
    diagnosis: diagnosisAI,
    penaltyApplied,
    rewardApplied,
    calibratedWeights,
    regime: regimeAI,
    recommendedTier: recommendedTierAI,
    streakCount: streak,
    aiAudit: {
      tierAudits: aiTierAudits,
      hitDigits,
      statusAI4: statusAI,
      rewardedMethods: rewardApplied,
      penalizedMethods: penaltyApplied,
      calibratedWeights,
      calibratedTierWeights,
      tierMethodWeights: predTMinus1.tierMethodWeights,
      streak,
      regime: regimeAI,
      recommendedTier: recommendedTierAI,
      diagnosis: diagnosisAI,
      actionSummary: allAIFrozen
        ? 'Semua tier AI freeze' : `${aiCalibrated.map((x) => `AI-${x}`).join(', ')} dikalibrasi per-tier`
    },
    bbfsAudit: {
      tierAudits: bbfsTierAudits,
      deadDigits,
      deadDigitsClean,
      deadDigitsIsolationRate14,
      statusBBFS7: statusBBFS,
      isTwin,
      twinStatus: !isTwin ? 'NON_TWIN' : bbfsSet7.has(actualK) ? 'TWIN_PROTECTED' : 'TWIN_UNPROTECTED',
      trimmerZone,
      rewardedFactor: statusBBFS === 'HIT' ? 'Freeze faktor tier hit' : 'Coverage/Momentum diperkuat pada tier miss',
      penalizedFactor: statusBBFS === 'HIT' ? 'None' : 'Densitas/Transisi lama dikurangi pada tier miss',
      regime: regimeBBFS,
      recommendedTier: recommendedTierBBFS,
      diagnosis: diagnosisBBFS,
      actionSummary: isTwin
        ? 'Twin = LOSE pada BBFS non-twin; seluruh tier dikalibrasi'
        : BBFS_SIZES.filter((sz) => bbfsTierAudits[sz].action === 'CALIBRATED').map((sz) => `BBFS-${sz}`).join(', ') + ' dikalibrasi',
      tierFactorWeights: calibratedBBFSWeights
    }
  };
}

/**
 * Riwayat 7 draw untuk UI. Ini memakai walk-forward causal (history hanya sampai
 * sebelum target), dengan aturan twin konsisten. State production penuh diuji di evaluator.
 */
export function reconstructLast7DaysTuningLogs(results4D: string[]): DayTuningLog[] {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length < 15) return [];
  const logs: DayTuningLog[] = [];
  const startIdx = Math.max(10, valid4D.length - 7);
  let previousWasLoss = false;
  let runningStreak = 0;

  for (let i = startIdx; i < valid4D.length; i++) {
    const pred = generatePrediction(valid4D.slice(0, i));
    if (!pred) continue;
    const k = Number(valid4D[i][2]);
    const e = Number(valid4D[i][3]);
    const isTwin = k === e;
    const ai4 = pred.ai[4];
    const bbfs7 = pred.bbfs[7];
    const hitDigits = Array.from(new Set(ai4.filter((d) => d === k || d === e)));
    const statusAI: 'HIT' | 'LOSE' = hitDigits.length ? 'HIT' : 'LOSE';
    const bbfsSet = new Set(bbfs7);
    const statusBBFS: 'HIT' | 'LOSE' = !isTwin && bbfsSet.has(k) && bbfsSet.has(e) ? 'HIT' : 'LOSE';

    if (runningStreak === 0) runningStreak = statusAI === 'HIT' ? 1 : -1;
    else if (runningStreak > 0 && statusAI === 'HIT') runningStreak++;
    else if (runningStreak < 0 && statusAI === 'LOSE') runningStreak--;
    else runningStreak = statusAI === 'HIT' ? 1 : -1;

    const recovered = previousWasLoss && statusAI === 'HIT';
    previousWasLoss = statusAI === 'LOSE';

    const h2d: [number, number][] = valid4D.slice(0, i).map((r) => [Number(r[2]), Number(r[3])]);
    const scores = getMethodScores(h2d);
    const dayHits: string[] = [];
    const dayMisses: string[] = [];
    Object.entries(scores).forEach(([name, map]) => {
      if (!hasSignal(map)) return;
      const top = Object.keys(map).map(Number).sort((a, b) => map[b] - map[a] || a - b).slice(0, 4);
      (top.includes(k) || top.includes(e) ? dayHits : dayMisses).push(name);
    });

    const aiTierAudits: Record<number, TierAuditStatus> = {};
    AI_SIZES.forEach((sz) => {
      const digits = pred.ai[sz];
      const hit = digits.includes(k) || digits.includes(e);
      const ranking = pred.tierRankedDigits?.[sz] || pred.rankedDigits;
      const rank = Math.min(
        ranking.indexOf(k) >= 0 ? ranking.indexOf(k) : 99,
        ranking.indexOf(e) >= 0 ? ranking.indexOf(e) : 99
      );
      aiTierAudits[sz] = {
        size: sz, name: `AI-${sz}`, parameter: `AI-${sz}`,
        status: hit ? 'HIT' : 'LOSE', action: hit ? 'FREEZE' : 'CALIBRATED',
        tuningDirective: hit ? 'Freeze' : 'Kalibrasi',
        marginalNote: hit ? 'Hit' : rank < 10 ? `Rank ${rank + 1}` : 'Meleset'
      };
    });

    const bbfsTierAudits: Record<number, TierAuditStatus> = {};
    BBFS_SIZES.forEach((sz) => {
      const set = new Set(pred.bbfs[sz]);
      const hit = !isTwin && set.has(k) && set.has(e);
      bbfsTierAudits[sz] = {
        size: sz, name: `BBFS-${sz}`, parameter: `BBFS-${sz}`,
        status: hit ? 'HIT' : 'LOSE', action: hit ? 'FREEZE' : 'CALIBRATED',
        tuningDirective: hit ? 'Freeze' : 'Kalibrasi',
        marginalNote: isTwin ? 'Twin kalah pada non-twin lines' : hit ? 'Tembus 2D' : 'Meleset'
      };
    });

    const deadDigits = pred.deadDigits;
    const deadDigitsClean = !deadDigits.includes(k) && !deadDigits.includes(e);
    const target2D = `${k}${e}`;
    const trimmer = generateSmartTrim(bbfs7);
    let trimmerZone: 'BOM_10' | 'MEDIUM_15' | 'CADANGAN' | 'MISSED' = 'MISSED';
    if (!isTwin && trimmer.top10.includes(target2D)) trimmerZone = 'BOM_10';
    else if (!isTwin && trimmer.medium15.includes(target2D)) trimmerZone = 'MEDIUM_15';
    else if (!isTwin && trimmer.cadangan.includes(target2D)) trimmerZone = 'CADANGAN';

    const aiTuning: AITuningDetail = {
      predictedTiers: pred.ai,
      tierAudits: aiTierAudits,
      hitDigits,
      statusAI4: statusAI,
      rewardedMethods: dayHits,
      penalizedMethods: dayMisses,
      calibratedWeights: pred.methodWeights,
      tierMethodWeights: pred.tierMethodWeights,
      recoveredFromLoss: recovered,
      streak: runningStreak,
      recommendedTier: aiTierAudits[3].action === 'FREEZE' ? 'AI-3' : 'AI-4',
      actionSummary: 'Walk-forward causal'
    };

    const bbfsTuning: BBFSTuningDetail = {
      predictedTiers: pred.bbfs,
      tierAudits: bbfsTierAudits,
      deadDigits,
      deadDigitsClean,
      statusBBFS7: statusBBFS,
      isTwin,
      twinProtected: false,
      trimmerZone,
      rewardedFactor: statusBBFS === 'HIT' ? 'Tier hit' : 'None',
      penalizedFactor: statusBBFS === 'LOSE' ? 'Tier miss' : 'None',
      recommendedTier: bbfsTierAudits[6].action === 'FREEZE' ? 'BBFS-6' : 'BBFS-7',
      actionSummary: isTwin ? 'Twin dihitung kalah pada non-twin lines' : 'Walk-forward causal',
      tierFactorWeights: pred.bbfsTierWeights
    };

    let paito: PaitoTuningDetail | undefined;
    if (pred.paitoPrediction) {
      const actualBiji = computeBiji(k, e);
      const actualParity = getParity(k, e);
      const actualMagnitude = k * 10 + e >= 50 ? 'Besar' : 'Kecil';
      const shio = getShioFor2D(k * 10 + e);
      const sn = generateSniperTrim(bbfs7, pred.paitoPrediction, false);
      let sniperZone: PaitoTuningDetail['sniperZone'] = 'MISSED';
      if (!isTwin && sn.sniperTop.includes(target2D)) sniperZone = 'BOM_SNIPER';
      else if (!isTwin && sn.sniperSecondary.includes(target2D)) sniperZone = 'SEKUNDER';
      else if (!isTwin && sn.cadangan.includes(target2D)) sniperZone = 'CADANGAN';
      const hitBiji = pred.paitoPrediction.topBiji.includes(actualBiji);
      const hitParity = pred.paitoPrediction.primaryParity === actualParity;
      const hitMagnitude = pred.paitoPrediction.primaryMagnitude === actualMagnitude;
      const hitShio = pred.paitoPrediction.topShios.includes(shio.no);
      paito = {
        predictedTopBiji: pred.paitoPrediction.topBiji,
        actualBiji, hitBiji,
        predictedParity: pred.paitoPrediction.primaryParity,
        actualParity, hitParity,
        predictedMagnitude: pred.paitoPrediction.primaryMagnitude,
        actualMagnitude, hitMagnitude,
        predictedTopShios: pred.paitoPrediction.topShios,
        actualShio: shio.no, hitShio,
        predictedJalur: pred.paitoPrediction.primaryJalur,
        actualJalur: shio.jalur,
        hitJalur: pred.paitoPrediction.primaryJalur === shio.jalur,
        sniperZone,
        strikeCount: Number(hitBiji) + Number(hitParity) + Number(hitMagnitude) + Number(hitShio)
      };
    }

    logs.push({
      periodIndex: i + 1,
      fullResult: valid4D[i],
      target2D,
      isTwin,
      ai: aiTuning,
      bbfs: bbfsTuning,
      paito,
      predictedAI4: ai4,
      predictedBBFS7: bbfs7,
      statusAI,
      statusBBFS,
      hitDigits,
      rewardedMethod: dayHits.join(', ') || 'None',
      penalizedMethod: dayMisses.join(', ') || 'None',
      recoveredFromPreviousLoss: recovered
    });
  }

  return logs;
}
