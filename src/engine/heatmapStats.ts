import type { Heatmap2DStats, HeatmapCellData, PositionalDigitStat } from './types';
import { getShioFor2D } from './shio';
import { computeBiji, getParity } from './movementPredictor';

export function computeHeatmap2DStats(
  history2D: [number, number][],
  lookback = 50
): Heatmap2DStats {
  const actualLookback = Math.min(history2D.length, lookback);
  const sub = history2D.slice(-actualLookback);
  const totalDraws = sub.length;

  // 1. Inisialisasi 100 Sel Matrix 2D (00-99)
  const cells: Record<string, HeatmapCellData> = {};
  for (let k = 0; k < 10; k++) {
    for (let e = 0; e < 10; e++) {
      const comb2D = `${k}${e}`;
      const shio = getShioFor2D(k * 10 + e);
      cells[comb2D] = {
        comb2D,
        kepala: k,
        ekor: e,
        count: 0,
        lastSeenGap: totalDraws,
        biji: computeBiji(k, e),
        parity: getParity(k, e),
        magnitude: k * 10 + e >= 50 ? 'Besar' : 'Kecil',
        shioNumber: shio.no,
        shioName: shio.name,
        shioEmoji: shio.emoji,
        isTwin: k === e
      };
    }
  }

  // 2. Hitung Kemunculan & Gap
  let maxCount = 0;
  for (let i = 0; i < totalDraws; i++) {
    const [k, e] = sub[i];
    const comb2D = `${k}${e}`;
    if (cells[comb2D]) {
      cells[comb2D].count++;
      if (cells[comb2D].count > maxCount) {
        maxCount = cells[comb2D].count;
      }
    }
  }

  // Hitung gap dari result paling baru ke belakang
  for (let step = 0; step < totalDraws; step++) {
    const [k, e] = sub[totalDraws - 1 - step];
    const comb2D = `${k}${e}`;
    if (cells[comb2D] && cells[comb2D].lastSeenGap === totalDraws) {
      cells[comb2D].lastSeenGap = step;
    }
  }

  // 3. Statistik Posisi Kepala (0-9)
  const kCounts: Record<number, number> = {};
  const kGaps: Record<number, number> = {};
  const kRecentHalf: Record<number, number> = {};
  const kOlderHalf: Record<number, number> = {};

  // 4. Statistik Posisi Ekor (0-9)
  const eCounts: Record<number, number> = {};
  const eGaps: Record<number, number> = {};
  const eRecentHalf: Record<number, number> = {};
  const eOlderHalf: Record<number, number> = {};

  for (let d = 0; d < 10; d++) {
    kCounts[d] = 0;
    kGaps[d] = totalDraws;
    kRecentHalf[d] = 0;
    kOlderHalf[d] = 0;

    eCounts[d] = 0;
    eGaps[d] = totalDraws;
    eRecentHalf[d] = 0;
    eOlderHalf[d] = 0;
  }

  const halfPoint = Math.floor(totalDraws / 2);
  for (let i = 0; i < totalDraws; i++) {
    const [k, e] = sub[i];
    kCounts[k]++;
    eCounts[e]++;
    if (i >= halfPoint) {
      kRecentHalf[k]++;
      eRecentHalf[e]++;
    } else {
      kOlderHalf[k]++;
      eOlderHalf[e]++;
    }
  }

  for (let step = 0; step < totalDraws; step++) {
    const [k, e] = sub[totalDraws - 1 - step];
    if (kGaps[k] === totalDraws) kGaps[k] = step;
    if (eGaps[e] === totalDraws) eGaps[e] = step;
  }

  const avgKCount = totalDraws > 0 ? totalDraws / 10 : 1;
  const avgECount = totalDraws > 0 ? totalDraws / 10 : 1;

  const kepalaStats: Record<number, PositionalDigitStat> = {};
  const ekorStats: Record<number, PositionalDigitStat> = {};

  for (let d = 0; d < 10; d++) {
    const kc = kCounts[d];
    const kg = kGaps[d];
    let kStatus: 'HOT' | 'WARM' | 'COLD' = 'WARM';
    if (kc >= avgKCount * 1.25 && kg <= 4) kStatus = 'HOT';
    else if (kc <= avgKCount * 0.65 || kg >= 12) kStatus = 'COLD';

    let kTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (kRecentHalf[d] > kOlderHalf[d] + 1) kTrend = 'UP';
    else if (kRecentHalf[d] < kOlderHalf[d] - 1) kTrend = 'DOWN';

    kepalaStats[d] = {
      digit: d,
      count: kc,
      rate: Number((kc / (totalDraws || 1)).toFixed(3)),
      lastSeenGap: kg,
      status: kStatus,
      trend: kTrend
    };

    const ec = eCounts[d];
    const eg = eGaps[d];
    let eStatus: 'HOT' | 'WARM' | 'COLD' = 'WARM';
    if (ec >= avgECount * 1.25 && eg <= 4) eStatus = 'HOT';
    else if (ec <= avgECount * 0.65 || eg >= 12) eStatus = 'COLD';

    let eTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (eRecentHalf[d] > eOlderHalf[d] + 1) eTrend = 'UP';
    else if (eRecentHalf[d] < eOlderHalf[d] - 1) eTrend = 'DOWN';

    ekorStats[d] = {
      digit: d,
      count: ec,
      rate: Number((ec / (totalDraws || 1)).toFixed(3)),
      lastSeenGap: eg,
      status: eStatus,
      trend: eTrend
    };
  }

  // 5. Kinetic Trace (5 result terakhir berurutan)
  const last5 = sub.slice(-5);
  const kineticTrace = last5.map(([k, e], idx) => ({
    step: idx + 1,
    comb2D: `${k}${e}`,
    kepala: k,
    ekor: e
  }));

  return {
    lookback: actualLookback,
    totalDraws,
    maxCount: Math.max(1, maxCount),
    cells,
    kepalaStats,
    ekorStats,
    kineticTrace
  };
}
