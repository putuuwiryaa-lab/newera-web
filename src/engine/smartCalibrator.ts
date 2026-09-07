import type {
  DayTuningLog,
  TierAuditStatus,
  AITuningDetail,
  BBFSTuningDetail
} from './types';
import {
  getMomentumScores,
  getMarkovScores,
  getDeltaScores,
  getAdaptiveMistikScores,
  generatePrediction
} from './adaptiveEngine';
import { generateSmartTrim } from './generator';

export interface CalibrationAudit {
  marketId?: string;
  previousDraw: {
    full: string;
    kepala: number;
    ekor: number;
  };
  previousPrediction: {
    ai4: number[];
    bbfs7: number[];
  };
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

  // Audit Spesifik AI (Per-Tier Freeze vs Calibrate & 4 Metode)
  aiAudit: {
    tierAudits: Record<number, TierAuditStatus>; // 3, 4, 5, 6
    hitDigits: number[];
    statusAI4: 'HIT' | 'LOSE';
    rewardedMethods: string[];
    penalizedMethods: string[];
    calibratedWeights: Record<string, number>;
    streak: number;
    regime: 'NORMAL' | 'HIGH_MOMENTUM' | 'ANTI_STREAK_ALERT';
    recommendedTier: string;
    diagnosis: string;
    actionSummary: string;
  };

  // Audit Spesifik BBFS (Per-Tier Freeze vs Calibrate, Dead Digits & Trimmer)
  bbfsAudit: {
    tierAudits: Record<number, TierAuditStatus>; // 6, 7, 8, 9
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

/**
 * Melakukan Audit & Kalibrasi Cerdas pada Result Terakhir:
 * 1. Merekonstruksi tebakan yang dibuat pada periode T-1.
 * 2. Membandingkan dengan Result aktual di periode T.
 * 3. Menghukum (penalti) metode yang meleset, dan memberi reward pada metode yang kena.
 * 4. Mendeteksi rezim (apakah sedang lose streak / twin anomaly).
 */
export function auditAndCalibrate(results4D: string[]): CalibrationAudit | null {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length < 15) return null;

  // Periode T (Result Aktual Terakhir)
  const lastFull = valid4D[valid4D.length - 1];
  const actualK = parseInt(lastFull[2], 10);
  const actualE = parseInt(lastFull[3], 10);
  const isTwin = actualK === actualE;

  // Data historis sampai T-1 (sebelum result terakhir keluar)
  const historyUntilTMinus1 = valid4D.slice(0, -1);
  const predTMinus1 = generatePrediction(historyUntilTMinus1);

  if (!predTMinus1) return null;

  const ai4TMinus1 = predTMinus1.ai[4];
  const bbfs7TMinus1 = predTMinus1.bbfs[7];

  // --------------------------------------------------------------------------
  // 1. AUDIT PER-TIER AI (AI-3, AI-4, AI-5, AI-6): ZONK -> KALIBRASI, WIN -> FREEZE
  // --------------------------------------------------------------------------
  const aiTierAudits: Record<number, TierAuditStatus> = {};
  const aiSizes: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
  const hitDigits: number[] = [];
  if (ai4TMinus1.includes(actualK)) hitDigits.push(actualK);
  if (ai4TMinus1.includes(actualE) && !hitDigits.includes(actualE)) hitDigits.push(actualE);

  aiSizes.forEach((sz) => {
    const tierDigits = predTMinus1.ai[sz];
    const isHit = tierDigits.includes(actualK) || tierDigits.includes(actualE);
    let marginalNote = '';

    if (isHit) {
      const matched = tierDigits.filter((d) => d === actualK || d === actualE);
      marginalNote = `Hit via digit ${matched.join(' & ')}`;
    } else {
      const kIdx = predTMinus1.rankedDigits.indexOf(actualK);
      const eIdx = predTMinus1.rankedDigits.indexOf(actualE);
      const minRank = Math.min(kIdx >= 0 ? kIdx : 99, eIdx >= 0 ? eIdx : 99);
      marginalNote = minRank < 10 ? `Digit tembus di Rank ke-${minRank + 1}` : 'Meleset total';
    }

    const paramLabel = sz === 3 ? 'Seleksi 3 Digit Ketat' : sz === 4 ? 'Seleksi 4 Digit Utama' : sz === 5 ? 'Seleksi 5 Digit Moderat' : 'Seleksi 6 Digit Proteksi';
    aiTierAudits[sz] = {
      size: sz,
      name: `AI-${sz}`,
      parameter: `Parameter AI-${sz} (${paramLabel})`,
      status: isHit ? 'HIT' : 'LOSE',
      action: isHit ? 'FREEZE' : 'CALIBRATED',
      tuningDirective: isHit
        ? `🔒 FREEZE: Parameter AI-${sz} dipertahankan stabil (Formasi valid)`
        : `⚡ KALIBRASI: Parameter AI-${sz} dikalibrasi ulang (Koreksi bobot karena Zonk)`,
      marginalNote
    };
  });

  const statusAI: 'HIT' | 'LOSE' = hitDigits.length > 0 ? 'HIT' : 'LOSE';

  // --------------------------------------------------------------------------
  // 2. AUDIT PER-TIER BBFS (BBFS-6, 7, 8, 9): ZONK -> KALIBRASI, WIN -> FREEZE
  // --------------------------------------------------------------------------
  const bbfsTierAudits: Record<number, TierAuditStatus> = {};
  const bbfsSizes: (6 | 7 | 8 | 9)[] = [6, 7, 8, 9];

  bbfsSizes.forEach((sz) => {
    const tierDigits = predTMinus1.bbfs[sz];
    const bbfsSet = new Set(tierDigits);
    const isHit = isTwin
      ? bbfsSet.has(actualK)
      : (bbfsSet.has(actualK) && bbfsSet.has(actualE));

    let marginalNote = '';
    if (isHit) {
      marginalNote = `Tembus 2D [${actualK}${actualE}]`;
    } else {
      if (isTwin) {
        marginalNote = 'Angka Kembar di luar himpunan';
      } else {
        const hasK = bbfsSet.has(actualK);
        const hasE = bbfsSet.has(actualE);
        if (hasK || hasE) {
          marginalNote = `1 Digit Masuk (${hasK ? actualK : actualE}), 1 Lepas`;
        } else {
          marginalNote = 'Kedua digit di luar himpunan';
        }
      }
    }

    const bbfsParamLabel = sz === 6 ? 'Kombinasi 30 Line' : sz === 7 ? 'Kombinasi 42 Line' : sz === 8 ? 'Kombinasi 56 Line' : 'Kombinasi 72 Line';
    bbfsTierAudits[sz] = {
      size: sz,
      name: `BBFS-${sz}`,
      parameter: `Parameter BBFS-${sz} (${bbfsParamLabel})`,
      status: isHit ? 'HIT' : 'LOSE',
      action: isHit ? 'FREEZE' : 'CALIBRATED',
      tuningDirective: isHit
        ? `🔒 FREEZE: Parameter BBFS-${sz} dipertahankan stabil (2D tembus)`
        : `⚡ KALIBRASI: Parameter BBFS-${sz} dikalibrasi ulang (Matriks pasangan zonk)`,
      marginalNote
    };
  });

  const bbfsSet7 = new Set(bbfs7TMinus1);
  const statusBBFS: 'HIT' | 'LOSE' = isTwin
    ? bbfsSet7.has(actualK) ? 'HIT' : 'LOSE'
    : (bbfsSet7.has(actualK) && bbfsSet7.has(actualE) ? 'HIT' : 'LOSE');

  // --------------------------------------------------------------------------
  // 3. AUDIT DEAD DIGITS & SMART TRIMMER ZONE (BBFS)
  // --------------------------------------------------------------------------
  const deadDigits = predTMinus1.deadDigits;
  const deadDigitsClean = !deadDigits.includes(actualK) && !deadDigits.includes(actualE);

  const trimmerResult = generateSmartTrim(bbfs7TMinus1);
  const target2DStr = `${actualK}${actualE}`;
  let trimmerZone: 'BOM_10' | 'MEDIUM_15' | 'CADANGAN' | 'MISSED' = 'MISSED';

  if (trimmerResult.top10.includes(target2DStr)) {
    trimmerZone = 'BOM_10';
  } else if (trimmerResult.medium15.includes(target2DStr)) {
    trimmerZone = 'MEDIUM_15';
  } else if (trimmerResult.cadangan.includes(target2DStr)) {
    trimmerZone = 'CADANGAN';
  } else if (isTwin && bbfsSet7.has(actualK)) {
    trimmerZone = 'CADANGAN';
  }

  // Hitung Isolasi Dead Digits 14 Draw Terakhir
  let cleanCount14 = 0;
  let evaluatedDraws14 = 0;
  for (let i = valid4D.length - 1; i >= Math.max(1, valid4D.length - 14); i--) {
    const prevHist = valid4D.slice(0, i);
    const prevP = generatePrediction(prevHist);
    if (!prevP) continue;
    const rK = parseInt(valid4D[i][2], 10);
    const rE = parseInt(valid4D[i][3], 10);
    evaluatedDraws14++;
    if (!prevP.deadDigits.includes(rK) && !prevP.deadDigits.includes(rE)) {
      cleanCount14++;
    }
  }
  const deadDigitsIsolationRate14 = evaluatedDraws14 > 0
    ? Number(((cleanCount14 / evaluatedDraws14) * 100).toFixed(1))
    : 100;

  // --------------------------------------------------------------------------
  // 4. PENYESUAIAN BOBOT 4 METODE ENSEMBLE AI (HANYA JIKA ADA TIER ZONK)
  // --------------------------------------------------------------------------
  const history2DUntilTMinus1: [number, number][] = historyUntilTMinus1.map((r) => [
    parseInt(r[2], 10),
    parseInt(r[3], 10)
  ]);

  const methodEvaluations = {
    Momentum: getMomentumScores(history2DUntilTMinus1),
    Markov: getMarkovScores(history2DUntilTMinus1),
    Delta: getDeltaScores(history2DUntilTMinus1),
    Mistik: getAdaptiveMistikScores(history2DUntilTMinus1)
  };

  const penaltyApplied: string[] = [];
  const rewardApplied: string[] = [];
  const calibratedWeights: Record<string, number> = { ...predTMinus1.methodWeights };

  // Cek apakah seluruh parameter tier AI (AI-3 s/d AI-6) tembus / WIN (FREEZE)
  const allAIFrozen = Object.values(aiTierAudits).every((t) => t.action === 'FREEZE');

  if (!allAIFrozen) {
    // Penyelarasan bobot HANYA dilakukan jika ada tier yang ZONK / butuh kalibrasi
    for (const [mName, scores] of Object.entries(methodEvaluations)) {
      const top3 = Object.keys(scores)
        .map(Number)
        .sort((a, b) => scores[b] - scores[a])
        .slice(0, 3);

      const hitMethod = top3.includes(actualK) || top3.includes(actualE);

      if (hitMethod) {
        calibratedWeights[mName] = Number(((calibratedWeights[mName] || 1.0) * 1.35).toFixed(2));
        rewardApplied.push(mName);
      } else {
        calibratedWeights[mName] = Number(
          Math.max(0.4, (calibratedWeights[mName] || 1.0) * 0.65).toFixed(2)
        );
        penaltyApplied.push(mName);
      }
    }
  }

  // Hitung AI-4 Streak Terakhir
  let streak = 0;
  for (let i = valid4D.length - 1; i >= Math.max(0, valid4D.length - 6); i--) {
    const rFull = valid4D[i];
    const k = parseInt(rFull[2], 10);
    const e = parseInt(rFull[3], 10);
    const histBefore = valid4D.slice(0, i);
    const p = generatePrediction(histBefore);
    if (!p) break;
    const isHit = p.ai[4].includes(k) || p.ai[4].includes(e);

    if (i === valid4D.length - 1) {
      streak = isHit ? 1 : -1;
    } else {
      if (streak > 0 && isHit) streak++;
      else if (streak < 0 && !isHit) streak--;
      else break;
    }
  }

  // Twin Gap
  let twinGap = 0;
  for (let i = valid4D.length - 1; i >= 0; i--) {
    const k = parseInt(valid4D[i][2], 10);
    const e = parseInt(valid4D[i][3], 10);
    if (k === e) break;
    twinGap++;
  }

  let twinAnomalyLevel: 'NORMAL' | 'MENINGKAT' | 'EKSTREM' = 'NORMAL';
  if (twinGap >= 20) twinAnomalyLevel = 'EKSTREM';
  else if (twinGap >= 14) twinAnomalyLevel = 'MENINGKAT';

  // --------------------------------------------------------------------------
  // 5. DIAGNOSIS & REKOMENDASI TERPISAH (AI vs BBFS)
  // --------------------------------------------------------------------------
  const aiFrozen = Object.values(aiTierAudits).filter((t) => t.action === 'FREEZE').map((t) => t.name);
  const aiCalib = Object.values(aiTierAudits).filter((t) => t.action === 'CALIBRATED').map((t) => t.name);

  let diagnosisAI = '';
  let regimeAI: CalibrationAudit['regime'] = 'NORMAL';
  let recommendedTierAI = 'AI-4 (Standar Utama)';

  if (statusAI === 'HIT') {
    if (allAIFrozen) {
      regimeAI = streak >= 3 ? 'HIGH_MOMENTUM' : 'NORMAL';
      diagnosisAI = `Akurasi optimal! Seluruh tier AI (AI-3 s/d AI-6) tembus 2D [${actualK}${actualE}] via digit ${hitDigits.join(
        ' & '
      )}. Seluruh parameter & bobot ensemble DIBEKUKAN (FREEZE) stabil tanpa mutasi bobot.`;
      recommendedTierAI = 'AI-3 (On-Fire / Ketat)';
    } else if (streak >= 3) {
      regimeAI = 'HIGH_MOMENTUM';
      diagnosisAI = `Akurasi tinggi! Tebakan menembus 2D [${actualK}${actualE}] via digit ${hitDigits.join(
        ' & '
      )}. Model AI berada dalam siklus High-Momentum (${streak}x win-streak). Tier ${aiFrozen.join(', ')} di-freeze, tier zonk dikalibrasi.`;
      recommendedTierAI = aiTierAudits[3].action === 'FREEZE' ? 'AI-3 (On-Fire / Ketat)' : 'AI-4 (Konsisten)';
    } else {
      diagnosisAI = `Tebakan AI berhasil tembus (Digit ${hitDigits.join(
        ' & '
      )} hadir di 2D [${actualK}${actualE}]). Tier ${aiFrozen.join(', ')} di-freeze, tier zonk (${aiCalib.join(', ')}) dikalibrasi. Metode ${rewardApplied.join(', ')} diberi reward.`;
      recommendedTierAI = aiTierAudits[3].action === 'FREEZE' ? 'AI-3 atau AI-4' : 'AI-4 (Rekomendasi Utama)';
    }
  } else {
    if (streak <= -2) {
      regimeAI = 'ANTI_STREAK_ALERT';
      diagnosisAI = `Terdeteksi ${Math.abs(
        streak
      )}x Lose berturut-turut! Kalibrasi Darurat: Bobot ${penaltyApplied.join(', ')} dipangkas, disarankan menggunakan AI-5.`;
      recommendedTierAI = 'AI-5 (Pelebaran Cakupan untuk Pengaman Modal)';
    } else {
      diagnosisAI = `Result [${actualK}${actualE}] meleset. Seluruh tier ZONK dikalibrasi penalti bobot untuk periode berikutnya.`;
      recommendedTierAI = 'AI-4 atau AI-5';
    }
  }

  const actionSummaryAI = allAIFrozen
    ? 'Semua tier AI (3-6) WIN -> Bobot parameter di-freeze stabil (0 Penalti)'
    : `${aiCalib.join(', ')} dikalibrasi; ${aiFrozen.length > 0 ? aiFrozen.join(', ') + ' di-freeze (stabil)' : 'semua tier evaluasi ulang'}`;

  // BBFS Diagnosis & Regime
  const bbfsFrozen = Object.values(bbfsTierAudits).filter((t) => t.action === 'FREEZE').map((t) => t.name);
  const bbfsCalib = Object.values(bbfsTierAudits).filter((t) => t.action === 'CALIBRATED').map((t) => t.name);
  const allBBFSFrozen = bbfsCalib.length === 0;

  let rewardedFactorBBFS = 'Matriks Densitas Pasangan (+25%)';
  let penalizedFactorBBFS = 'Dispersi Pasangan Anomali (-20%)';

  if (allBBFSFrozen) {
    rewardedFactorBBFS = 'Seluruh Tier BBFS (6-9) Tembus (Freeze Total)';
    penalizedFactorBBFS = 'None (Formasi Terkunci Stabil)';
  } else {
    if (trimmerZone === 'BOM_10') {
      rewardedFactorBBFS = 'Prioritas Top 10 BOM Hit (+40%)';
    } else if (deadDigitsClean) {
      rewardedFactorBBFS = 'Isolasi 2 Digit Lemah (+30%)';
    }

    if (!deadDigitsClean) {
      penalizedFactorBBFS = 'Kebocoran Dead Digit ke 2D (-35%)';
    } else if (isTwin && !bbfsSet7.has(actualK)) {
      penalizedFactorBBFS = 'Anomali Kembar Tanpa Proteksi (-30%)';
    }
  }

  let regimeBBFS: 'HIGH_COUPLING' | 'NORMAL' | 'TWIN_SHOCK' | 'DEAD_DIGIT_ALERT' | 'EXPANDED_DEFENSE' = 'NORMAL';
  let recommendedTierBBFS = 'BBFS-7 (Standar Investasi Stabil)';

  if (isTwin) {
    regimeBBFS = 'TWIN_SHOCK';
    recommendedTierBBFS = 'BBFS-7 (+Twin Defense Diaktifkan)';
  } else if (!deadDigitsClean) {
    regimeBBFS = 'DEAD_DIGIT_ALERT';
    recommendedTierBBFS = 'BBFS-8 (Perketat Isolasi Digit Lemah)';
  } else if (bbfsTierAudits[6].action === 'FREEZE') {
    regimeBBFS = 'HIGH_COUPLING';
    recommendedTierBBFS = 'BBFS-6 (Performa Tinggi / Hemat Line)';
  } else if (statusBBFS === 'LOSE') {
    regimeBBFS = 'EXPANDED_DEFENSE';
    recommendedTierBBFS = 'BBFS-8 (Pelebaran Proteksi Modal)';
  }

  const diagnosisBBFS = statusBBFS === 'HIT'
    ? `BBFS tembus 2D [${actualK}${actualE}] via zona ${trimmerZone}. 2 Digit Terlemah [${deadDigits.join(
        ', '
      )}] ${deadDigitsClean ? '100% AMAN terisolasi' : '⚠️ BOCOR'}. Tier ${bbfsFrozen.join(', ')} di-freeze.`
    : `BBFS-7 meleset pada result 2D [${actualK}${actualE}]. ${bbfsCalib.join(', ')} dikalibrasi ulang untuk menyerap pola pasangan.`;

  const actionSummaryBBFS = allBBFSFrozen
    ? 'Semua tier BBFS (6-9) WIN -> Parameter di-freeze stabil (0 Penalti)'
    : `${bbfsCalib.join(', ')} dikalibrasi; ${bbfsFrozen.length > 0 ? bbfsFrozen.join(', ') + ' di-freeze' : 're-scoring matriks pasangan'} (${deadDigitsClean ? '🛡️ Dead Digits Bersih' : '⚠️ Dead Digit Bocor'})`;

  return {
    previousDraw: {
      full: lastFull,
      kepala: actualK,
      ekor: actualE
    },
    previousPrediction: {
      ai4: ai4TMinus1,
      bbfs7: bbfs7TMinus1
    },
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

    // Audit Spesifik AI
    aiAudit: {
      tierAudits: aiTierAudits,
      hitDigits,
      statusAI4: statusAI,
      rewardedMethods: rewardApplied,
      penalizedMethods: penaltyApplied,
      calibratedWeights,
      streak,
      regime: regimeAI,
      recommendedTier: recommendedTierAI,
      diagnosis: diagnosisAI,
      actionSummary: actionSummaryAI
    },

    // Audit Spesifik BBFS
    bbfsAudit: {
      tierAudits: bbfsTierAudits,
      deadDigits,
      deadDigitsClean,
      deadDigitsIsolationRate14,
      statusBBFS7: statusBBFS,
      isTwin,
      twinStatus: !isTwin ? 'NON_TWIN' : (bbfsSet7.has(actualK) ? 'TWIN_PROTECTED' : 'TWIN_UNPROTECTED'),
      trimmerZone,
      rewardedFactor: rewardedFactorBBFS,
      penalizedFactor: penalizedFactorBBFS,
      regime: regimeBBFS,
      recommendedTier: recommendedTierBBFS,
      diagnosis: diagnosisBBFS,
      actionSummary: actionSummaryBBFS,
      tierFactorWeights: predTMinus1.bbfsTierWeights || {}
    }
  };
}

/**
 * Merekonstruksi audit tebakan dan riwayat kalibrasi 7 periode terakhir secara deterministik.
 */
export function reconstructLast7DaysTuningLogs(results4D: string[]): DayTuningLog[] {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length < 15) return [];

  const logs: DayTuningLog[] = [];
  const startIdx = Math.max(10, valid4D.length - 7);

  let previousWasLoss = false;

  for (let i = startIdx; i < valid4D.length; i++) {
    const rFull = valid4D[i];
    const k = parseInt(rFull[2], 10);
    const e = parseInt(rFull[3], 10);
    const isTwin = k === e;

    const histBefore = valid4D.slice(0, i);
    const pred = generatePrediction(histBefore);
    if (!pred) continue;

    const ai4 = pred.ai[4];
    const bbfs7 = pred.bbfs[7];
    const hitDigits = ai4.filter((d) => d === k || d === e);
    const statusAI: 'HIT' | 'LOSE' = hitDigits.length > 0 ? 'HIT' : 'LOSE';

    const bbfsSet = new Set(bbfs7);
    const statusBBFS: 'HIT' | 'LOSE' = isTwin
      ? bbfsSet.has(k) ? 'HIT' : 'LOSE'
      : (bbfsSet.has(k) && bbfsSet.has(e) ? 'HIT' : 'LOSE');

    const recovered = previousWasLoss && statusAI === 'HIT';
    previousWasLoss = statusAI === 'LOSE';

    const sortedMethods = Object.entries(pred.methodWeights).sort((a, b) => b[1] - a[1]);
    const rewardedMethod = sortedMethods[0] ? sortedMethods[0][0] : 'Momentum';
    const penalizedMethod = sortedMethods[sortedMethods.length - 1] ? sortedMethods[sortedMethods.length - 1][0] : 'Markov';

    // AI Tier Audits
    const aiTierAudits: Record<number, TierAuditStatus> = {};
    [3, 4, 5, 6].forEach((sz) => {
      const tierD = pred.ai[sz as 3 | 4 | 5 | 6];
      const h = tierD.includes(k) || tierD.includes(e);
      let mNote = '';
      if (h) {
        mNote = `Hit via digit ${tierD.filter((d) => d === k || d === e).join(' & ')}`;
      } else {
        const kIdx = pred.rankedDigits.indexOf(k);
        const eIdx = pred.rankedDigits.indexOf(e);
        const minRank = Math.min(kIdx >= 0 ? kIdx : 99, eIdx >= 0 ? eIdx : 99);
        mNote = minRank < 10 ? `Rank ke-${minRank + 1}` : 'Meleset';
      }
      const pLabel = sz === 3 ? '3 Digit Ketat' : sz === 4 ? '4 Digit Utama' : sz === 5 ? '5 Digit Moderat' : '6 Digit Proteksi';
      aiTierAudits[sz] = {
        size: sz,
        name: `AI-${sz}`,
        parameter: `Parameter AI-${sz} (${pLabel})`,
        status: h ? 'HIT' : 'LOSE',
        action: h ? 'FREEZE' : 'CALIBRATED',
        tuningDirective: h ? `🔒 Di-Freeze (Hit)` : `⚡ Dikalibrasi (Zonk)`,
        marginalNote: mNote
      };
    });

    // BBFS Tier Audits
    const bbfsTierAudits: Record<number, TierAuditStatus> = {};
    [6, 7, 8, 9].forEach((sz) => {
      const tierD = pred.bbfs[sz as 6 | 7 | 8 | 9];
      const s = new Set(tierD);
      const h = isTwin ? s.has(k) : (s.has(k) && s.has(e));
      bbfsTierAudits[sz] = {
        size: sz,
        name: `BBFS-${sz}`,
        parameter: `Parameter BBFS-${sz} (${sz} Digit)`,
        status: h ? 'HIT' : 'LOSE',
        action: h ? 'FREEZE' : 'CALIBRATED',
        tuningDirective: h ? `🔒 Di-Freeze (Hit 2D)` : `⚡ Dikalibrasi (Zonk)`,
        marginalNote: h ? `Tembus 2D [${k}${e}]` : 'Meleset'
      };
    });

    // Dead Digits & Trimmer
    const deadDigits = pred.deadDigits;
    const deadDigitsClean = !deadDigits.includes(k) && !deadDigits.includes(e);

    const trimmer = generateSmartTrim(bbfs7);
    const target2D = `${k}${e}`;
    let trimmerZone: 'BOM_10' | 'MEDIUM_15' | 'CADANGAN' | 'MISSED' = 'MISSED';
    if (trimmer.top10.includes(target2D)) trimmerZone = 'BOM_10';
    else if (trimmer.medium15.includes(target2D)) trimmerZone = 'MEDIUM_15';
    else if (trimmer.cadangan.includes(target2D)) trimmerZone = 'CADANGAN';
    else if (isTwin && bbfsSet.has(k)) trimmerZone = 'CADANGAN';

    const anyAICalibDay = Object.values(aiTierAudits).some((t) => t.action === 'CALIBRATED');
    const allAIFrozenDay = !anyAICalibDay;

    const anyBBFSCalibDay = Object.values(bbfsTierAudits).some((t) => t.action === 'CALIBRATED');
    const allBBFSFrozenDay = !anyBBFSCalibDay;

    const aiTuning: AITuningDetail = {
      predictedTiers: pred.ai,
      tierAudits: aiTierAudits,
      hitDigits,
      statusAI4: statusAI,
      rewardedMethods: allAIFrozenDay ? [] : [rewardedMethod],
      penalizedMethods: allAIFrozenDay ? [] : [penalizedMethod],
      calibratedWeights: pred.methodWeights,
      recoveredFromLoss: recovered,
      streak: statusAI === 'HIT' ? 1 : -1,
      recommendedTier: aiTierAudits[3].action === 'FREEZE' ? 'AI-3' : 'AI-4',
      actionSummary: allAIFrozenDay ? 'Semua tier stabil (Freeze Total)' : `${Object.values(aiTierAudits).filter(t => t.action === 'CALIBRATED').map(t => t.name).join(', ')} dikalibrasi`
    };

    const bbfsTuning: BBFSTuningDetail = {
      predictedTiers: pred.bbfs,
      tierAudits: bbfsTierAudits,
      deadDigits,
      deadDigitsClean,
      statusBBFS7: statusBBFS,
      isTwin,
      twinProtected: isTwin ? bbfsSet.has(k) : false,
      trimmerZone,
      rewardedFactor: allBBFSFrozenDay ? 'Seluruh Tier Tembus (Freeze Total)' : (trimmerZone === 'BOM_10' ? 'Top 10 BOM Hit' : (deadDigitsClean ? 'Dead Digits 100% Bersih' : 'Afinitas Pasangan')),
      penalizedFactor: allBBFSFrozenDay ? 'None' : (!deadDigitsClean ? 'Dead Digit Bocor' : (statusBBFS === 'LOSE' ? 'Dispersi Pasangan' : 'None')),
      recommendedTier: bbfsTierAudits[6].action === 'FREEZE' ? 'BBFS-6' : 'BBFS-7',
      actionSummary: allBBFSFrozenDay ? 'Semua tier BBFS stabil (Freeze Total)' : `${Object.values(bbfsTierAudits).filter(t => t.action === 'CALIBRATED').map(t => t.name).join(', ')} dikalibrasi`,
      tierFactorWeights: pred.bbfsTierWeights
    };

    logs.push({
      periodIndex: i + 1,
      fullResult: rFull,
      target2D: `${k}${e}`,
      isTwin,
      ai: aiTuning,
      bbfs: bbfsTuning,

      // Compatibility
      predictedAI4: ai4,
      predictedBBFS7: bbfs7,
      statusAI,
      statusBBFS,
      hitDigits,
      rewardedMethod: allAIFrozenDay ? 'Freeze' : rewardedMethod,
      penalizedMethod: allAIFrozenDay ? 'None' : penalizedMethod,
      recoveredFromPreviousLoss: recovered
    });
  }

  return logs;
}
