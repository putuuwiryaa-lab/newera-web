import type { EvaluationMetrics, PredictionResult } from './types';
import { generatePrediction } from './adaptiveEngine';
import { auditAndCalibrate } from './smartCalibrator';
import { computeBiji, getParity } from './paitoPredictor';
import { getShioFor2D } from './shio';

export const AI_BASELINES: Record<number, number> = {
  3: 51.0,
  4: 64.0,
  5: 75.0,
  6: 84.0
};

export const BBFS_BASELINES: Record<number, number> = {
  6: 30.0,
  7: 42.0,
  8: 56.0,
  9: 72.0
};

function predictionToSavedShape(pred: PredictionResult): any {
  return {
    ai3: pred.ai[3],
    ai4: pred.ai[4],
    ai5: pred.ai[5],
    ai6: pred.ai[6],
    tier_method_weights: pred.tierMethodWeights,
    bbfs6: pred.bbfs[6],
    bbfs7: pred.bbfs[7],
    bbfs8: pred.bbfs[8],
    bbfs9: pred.bbfs[9],
    bbfs_tier_weights: pred.bbfsTierWeights,
    dead_digits: pred.deadDigits
  };
}

function settleLines(lines: string[], actual2D: string): { hit: boolean; cost: number; net: number } {
  const cost = lines.length;
  const hit = lines.includes(actual2D);
  return { hit, cost, net: hit ? 70 - cost : -cost };
}

function getBBFSLines(digits: number[]): string[] {
  const lines: string[] = [];
  for (const k of digits) {
    for (const e of digits) {
      if (k !== e) lines.push(`${k}${e}`);
    }
  }
  return lines;
}

function getBijiBaseline(targets: number[]): number {
  const unique = Array.from(new Set(targets));
  return unique.reduce((sum, d) => sum + (d === 0 ? 0.01 : 0.11), 0);
}

function getShioBaseline(targets: number[]): number {
  const targetSet = new Set(targets);
  let hit = 0;
  for (let n = 0; n < 100; n++) {
    if (targetSet.has(getShioFor2D(n).no)) hit++;
  }
  return hit / 100;
}

function getJalurBaseline(target: number): number {
  let hit = 0;
  for (let n = 0; n < 100; n++) {
    if (getShioFor2D(n).jalur === target) hit++;
  }
  return hit / 100;
}

/**
 * Walk-forward stateful: prediction T dibuat sebelum result T diketahui,
 * result T kemudian mengaudit prediction yang benar-benar dipakai, lalu hasil
 * kalibrasi tersebut dipakai untuk membuat prediction T+1.
 */
export function runWalkForwardEvaluation(
  results4D: string[],
  warmup = 50
): EvaluationMetrics | null {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length <= warmup + 10) return null;

  // Stateful replay lebih berat daripada evaluator lama. Batasi 250 draw terakhir.
  const evalSubset = valid4D.length > 250 ? valid4D.slice(-250) : valid4D;
  const totalDraws = evalSubset.length;
  const effectiveWarmup = Math.min(warmup, totalDraws - 10);
  const testDraws = totalDraws - effectiveWarmup;

  const aiHits: Record<number, number> = { 3: 0, 4: 0, 5: 0, 6: 0 };
  const bbfsHits: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  const pnl: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  let twinCount = 0;

  const ai4Streaks = { currentWin: 0, maxWin: 0, currentLose: 0, maxLose: 0 };

  let paitoBijiHits = 0;
  let paitoParityHits = 0;
  let paitoMagHits = 0;
  let paitoShioHits = 0;
  let paitoJalurHits = 0;
  let bijiBaselineSum = 0;
  let shioBaselineSum = 0;
  let jalurBaselineSum = 0;

  let sniperBomHits = 0;
  let totalSniperLines = 0;
  let sniperPnl = 0;
  let superSniperHits = 0;
  let totalSuperSniperLines = 0;
  let superSniperPnl = 0;
  let bbfs7PaitoProHits = 0;
  let bbfs7PaitoProPnl = 0;
  let nuklir6Hits = 0;
  let nuklir6Pnl = 0;
  let bom12Hits = 0;
  let bom12Pnl = 0;
  let tarung4x4Hits = 0;
  let tarung4x4Pnl = 0;

  // Burn-in state dari awal subset hingga warmup, tanpa memasukkan statistik test.
  const stateStart = Math.min(15, effectiveWarmup);
  let currentPrediction = generatePrediction(evalSubset.slice(0, stateStart));
  if (!currentPrediction) return null;

  for (let t = stateStart; t < effectiveWarmup; t++) {
    const historyIncludingActual = evalSubset.slice(0, t + 1);
    const audit = auditAndCalibrate(historyIncludingActual, predictionToSavedShape(currentPrediction));
    currentPrediction = generatePrediction(historyIncludingActual, audit);
    if (!currentPrediction) return null;
  }

  for (let t = effectiveWarmup; t < totalDraws; t++) {
    const actualFull = evalSubset[t];
    const actualK = Number(actualFull[2]);
    const actualE = Number(actualFull[3]);
    const actual2D = `${actualK}${actualE}`;
    const isTwin = actualK === actualE;
    if (isTwin) twinCount++;

    // 1. AI: prediction yang memang sudah dibuat sebelum draw T.
    ([3, 4, 5, 6] as const).forEach((size) => {
      const hit = currentPrediction!.ai[size].includes(actualK) || currentPrediction!.ai[size].includes(actualE);
      if (hit) aiHits[size]++;
      if (size === 4) {
        if (hit) {
          ai4Streaks.currentWin++;
          ai4Streaks.maxWin = Math.max(ai4Streaks.maxWin, ai4Streaks.currentWin);
          ai4Streaks.currentLose = 0;
        } else {
          ai4Streaks.currentLose++;
          ai4Streaks.maxLose = Math.max(ai4Streaks.maxLose, ai4Streaks.currentLose);
          ai4Streaks.currentWin = 0;
        }
      }
    });

    // 2. BBFS: line yang dibet adalah P(size,2) non-twin. Twin tetap membayar cost dan kalah.
    ([6, 7, 8, 9] as const).forEach((size) => {
      const settlement = settleLines(getBBFSLines(currentPrediction!.bbfs[size]), actual2D);
      if (settlement.hit) bbfsHits[size]++;
      pnl[size] += settlement.net;
    });

    // 3. Paito macro dan baseline dinamis sesuai target yang benar-benar dipilih.
    const paitoPred = currentPrediction.paitoPrediction;
    if (paitoPred) {
      const actualBiji = computeBiji(actualK, actualE);
      const actualParity = getParity(actualK, actualE);
      const actualMag = actualK * 10 + actualE >= 50 ? 'Besar' : 'Kecil';
      const actualShio = getShioFor2D(actualK * 10 + actualE);

      if (paitoPred.topBiji.includes(actualBiji)) paitoBijiHits++;
      if (actualParity === paitoPred.primaryParity) paitoParityHits++;
      if (actualMag === paitoPred.primaryMagnitude) paitoMagHits++;
      if (paitoPred.topShios.includes(actualShio.no)) paitoShioHits++;
      if (actualShio.jalur === paitoPred.primaryJalur) paitoJalurHits++;

      bijiBaselineSum += getBijiBaseline(paitoPred.topBiji);
      shioBaselineSum += getShioBaseline(paitoPred.topShios);
      jalurBaselineSum += getJalurBaseline(paitoPred.primaryJalur);

      // Sniper dibuat dari state prediction yang sama.
      const sniperTop = currentPrediction.paitoBBFS7
        ? currentPrediction.paitoBBFS7.full42.filter((line) => {
            const k = Number(line[0]);
            const e = Number(line[1]);
            return paitoPred.topBiji.includes(computeBiji(k, e)) && getParity(k, e) === paitoPred.primaryParity;
          })
        : [];
      const superSniper = sniperTop.filter((line) => paitoPred.topShios.includes(getShioFor2D(Number(line)).no));

      const sniperSettlement = settleLines(sniperTop, actual2D);
      totalSniperLines += sniperSettlement.cost;
      sniperPnl += sniperSettlement.net;
      if (sniperSettlement.hit) sniperBomHits++;

      const superSettlement = settleLines(superSniper, actual2D);
      totalSuperSniperLines += superSettlement.cost;
      superSniperPnl += superSettlement.net;
      if (superSettlement.hit) superSniperHits++;
    }

    // 4. Paito BBFS hierarchy. Jangan special-case twin; membership line menentukan hit.
    const paitoBBFS = currentPrediction.paitoBBFS7;
    if (paitoBBFS) {
      const fullSettlement = settleLines(paitoBBFS.full42, actual2D);
      bbfs7PaitoProPnl += fullSettlement.net;
      if (fullSettlement.hit) bbfs7PaitoProHits++;

      const nuklirSettlement = settleLines(paitoBBFS.nuklir6, actual2D);
      nuklir6Pnl += nuklirSettlement.net;
      if (nuklirSettlement.hit) nuklir6Hits++;

      const bomSettlement = settleLines(paitoBBFS.bom12, actual2D);
      bom12Pnl += bomSettlement.net;
      if (bomSettlement.hit) bom12Hits++;
    }

    const polaTarungLines = currentPrediction.polaTarung?.tarung4x4 || [];
    const tarungSettlement = settleLines(polaTarungLines, actual2D);
    tarung4x4Pnl += tarungSettlement.net;
    if (tarungSettlement.hit) tarung4x4Hits++;

    // 5. Update state production untuk prediction T+1 menggunakan prediction T yang tersimpan.
    const historyIncludingActual = evalSubset.slice(0, t + 1);
    const audit = auditAndCalibrate(historyIncludingActual, predictionToSavedShape(currentPrediction));
    currentPrediction = generatePrediction(historyIncludingActual, audit);
    if (!currentPrediction && t < totalDraws - 1) return null;
  }

  const aiStats: EvaluationMetrics['aiStats'] = {};
  [3, 4, 5, 6].forEach((size) => {
    const actualRate = (aiHits[size] / testDraws) * 100;
    const baselineRate = AI_BASELINES[size];
    aiStats[size] = {
      hitCount: aiHits[size],
      actualRate: Number(actualRate.toFixed(2)),
      baselineRate,
      diff: Number((actualRate - baselineRate).toFixed(2))
    };
  });

  const bbfsStats: EvaluationMetrics['bbfsStats'] = {};
  [6, 7, 8, 9].forEach((size) => {
    const actualRate = (bbfsHits[size] / testDraws) * 100;
    const baselineRate = BBFS_BASELINES[size];
    bbfsStats[size] = {
      hitCount: bbfsHits[size],
      lines: size * (size - 1),
      actualRate: Number(actualRate.toFixed(2)),
      baselineRate,
      diff: Number((actualRate - baselineRate).toFixed(2)),
      pnlNet: pnl[size] * 1000
    };
  });

  const paitoStats: EvaluationMetrics['paitoStats'] = {
    bijiHits: paitoBijiHits,
    bijiRate: Number(((paitoBijiHits / testDraws) * 100).toFixed(2)),
    bijiBaseline: Number(((bijiBaselineSum / testDraws) * 100).toFixed(2)),
    parityHits: paitoParityHits,
    parityRate: Number(((paitoParityHits / testDraws) * 100).toFixed(2)),
    parityBaseline: 25.0,
    magnitudeHits: paitoMagHits,
    magnitudeRate: Number(((paitoMagHits / testDraws) * 100).toFixed(2)),
    magnitudeBaseline: 50.0,
    shioHits: paitoShioHits,
    shioRate: Number(((paitoShioHits / testDraws) * 100).toFixed(2)),
    shioBaseline: Number(((shioBaselineSum / testDraws) * 100).toFixed(2)),
    jalurHits: paitoJalurHits,
    jalurRate: Number(((paitoJalurHits / testDraws) * 100).toFixed(2)),
    jalurBaseline: Number(((jalurBaselineSum / testDraws) * 100).toFixed(2)),
    superSniperHits,
    superSniperRate: Number(((superSniperHits / testDraws) * 100).toFixed(2)),
    avgSuperSniperLines: Number((totalSuperSniperLines / testDraws).toFixed(1)),
    superSniperPnlNet: superSniperPnl * 1000,
    sniperBomHits,
    sniperBomRate: Number(((sniperBomHits / testDraws) * 100).toFixed(2)),
    avgSniperLines: Number((totalSniperLines / testDraws).toFixed(1)),
    sniperPnlNet: sniperPnl * 1000,
    bbfs7PaitoProHits,
    bbfs7PaitoProRate: Number(((bbfs7PaitoProHits / testDraws) * 100).toFixed(2)),
    bbfs7PaitoProPnl: bbfs7PaitoProPnl * 1000,
    nuklir6Hits,
    nuklir6Rate: Number(((nuklir6Hits / testDraws) * 100).toFixed(2)),
    nuklir6Pnl: nuklir6Pnl * 1000,
    bom12Hits,
    bom12Rate: Number(((bom12Hits / testDraws) * 100).toFixed(2)),
    bom12Pnl: bom12Pnl * 1000,
    tarung4x4Hits,
    tarung4x4Rate: Number(((tarung4x4Hits / testDraws) * 100).toFixed(2)),
    tarung4x4Pnl: tarung4x4Pnl * 1000
  };

  return {
    totalDraws,
    testDraws,
    twinCount,
    twinRate: Number(((twinCount / testDraws) * 100).toFixed(1)),
    aiStats,
    bbfsStats,
    paitoStats,
    ai4Streak: {
      maxWin: ai4Streaks.maxWin,
      maxLose: ai4Streaks.maxLose,
      current: ai4Streaks.currentWin > 0 ? ai4Streaks.currentWin : -ai4Streaks.currentLose
    }
  };
}
