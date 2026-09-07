import type { EvaluationMetrics } from './types';
import { AdaptiveEnsemble, computeDedicatedBBFSTiers } from './adaptiveEngine';

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

/**
 * Menjalankan Evaluasi Walk-Forward Otomatis pada seluruh riwayat data 4D.
 */
export function runWalkForwardEvaluation(
  results4D: string[],
  warmup = 50
): EvaluationMetrics | null {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length <= warmup + 10) return null;

  const history2D: [number, number][] = valid4D.map((r) => [
    parseInt(r[2], 10),
    parseInt(r[3], 10)
  ]);

  const totalDraws = history2D.length;
  const testDraws = totalDraws - warmup;
  const ensemble = new AdaptiveEnsemble(20);

  const aiHits: Record<number, number> = { 3: 0, 4: 0, 5: 0, 6: 0 };
  const bbfsHits: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  let twinCount = 0;

  const ai4Streaks = {
    currentWin: 0,
    maxWin: 0,
    currentLose: 0,
    maxLose: 0
  };

  // PnL: Asumsi 2D payout 70x, cost 1x per line
  const pnl: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };

  for (let t = warmup; t < totalDraws; t++) {
    const pastData = history2D.slice(0, t);
    const [actualK, actualE] = history2D[t];
    const isTwin = actualK === actualE;

    if (isTwin) twinCount++;

    // 1. Evaluasi AI Per-Tier (3, 4, 5, 6) secara independen
    [3, 4, 5, 6].forEach((size) => {
      const { ranked: tierRanked } = ensemble.rankDigitsForTier(pastData, size);
      const aiSet = new Set(tierRanked.slice(0, size));
      if (aiSet.has(actualK) || aiSet.has(actualE)) {
        aiHits[size]++;
        if (size === 4) {
          ai4Streaks.currentWin++;
          ai4Streaks.maxWin = Math.max(ai4Streaks.maxWin, ai4Streaks.currentWin);
          ai4Streaks.currentLose = 0;
        }
      } else {
        if (size === 4) {
          ai4Streaks.currentLose++;
          ai4Streaks.maxLose = Math.max(ai4Streaks.maxLose, ai4Streaks.currentLose);
          ai4Streaks.currentWin = 0;
        }
      }
    });

    // 2. Evaluasi BBFS Khusus (6, 7, 8, 9) Menggunakan pastData (Bebas Data Leakage)
    const bbfsResult = computeDedicatedBBFSTiers(pastData);
    [6, 7, 8, 9].forEach((size) => {
      const bbfsSet = new Set(bbfsResult.tiers[size as 6 | 7 | 8 | 9]);
      const lines = size * (size - 1);
      const isHitBBFS = isTwin
        ? bbfsSet.has(actualK)
        : (bbfsSet.has(actualK) && bbfsSet.has(actualE));

      if (isHitBBFS) {
        bbfsHits[size]++;
        pnl[size] += (70 - lines);
      } else {
        pnl[size] -= lines;
      }
    });
  }

  // Format statistik AI
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

  // Format statistik BBFS
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
      pnlNet: pnl[size] * 1000 // nominal rupiah misal 1.000 per baris
    };
  });

  return {
    totalDraws,
    testDraws,
    twinCount,
    twinRate: Number(((twinCount / testDraws) * 100).toFixed(1)),
    aiStats,
    bbfsStats,
    ai4Streak: {
      maxWin: ai4Streaks.maxWin,
      maxLose: ai4Streaks.maxLose,
      current: ai4Streaks.currentWin > 0 ? ai4Streaks.currentWin : -ai4Streaks.currentLose
    }
  };
}
