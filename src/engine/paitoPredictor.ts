import type { PaitoMacroPrediction, OverdueAlert } from './types';

/**
 * Hitung Biji 2D (Digital Root): penjumlahan berulang Kepala + Ekor hingga 1 digit (0-9).
 */
export function computeBiji(k: number, e: number): number {
  if (k === 0 && e === 0) return 0;
  let s = k + e;
  while (s >= 10) {
    s = Math.floor(s / 10) + (s % 10);
  }
  return s;
}

export type ParityState = 'Genap-Genap' | 'Genap-Ganjil' | 'Ganjil-Genap' | 'Ganjil-Ganjil';
export const PARITY_STATES: ParityState[] = [
  'Genap-Genap',
  'Genap-Ganjil',
  'Ganjil-Genap',
  'Ganjil-Ganjil'
];

export function getParity(k: number, e: number): ParityState {
  const kp = k % 2 === 0 ? 'Genap' : 'Ganjil';
  const ep = e % 2 === 0 ? 'Genap' : 'Ganjil';
  return `${kp}-${ep}` as ParityState;
}

/**
 * Memprediksi atribut makro paito berdasarkan riwayat 2D:
 * 1. Biji 2D (Transisi Markov + Momentum Recency + Overdue Gap Tracker)
 * 2. Pola Ganjil-Genap (4 Kuadran Transisi + Deteksi Pola Terlambat)
 * 3. Kategori Besar-Kecil (>= 50 Besar vs < 50 Kecil)
 */
export function predictPaitoMacro(
  history2D: [number, number][],
  lookback = 50
): PaitoMacroPrediction {
  if (history2D.length === 0) {
    const defaultProbs: Record<number, number> = {};
    for (let d = 0; d < 10; d++) defaultProbs[d] = 0.1;
    return {
      topBiji: [1, 2, 3],
      bijiProbabilities: defaultProbs,
      primaryParity: 'Genap-Ganjil',
      parityProbabilities: {
        'Genap-Genap': 0.25,
        'Genap-Ganjil': 0.25,
        'Ganjil-Genap': 0.25,
        'Ganjil-Ganjil': 0.25
      },
      primaryMagnitude: 'Kecil',
      magnitudeProbabilities: { Besar: 0.5, Kecil: 0.5 },
      overdueAlerts: [],
      confidenceScore: 60
    };
  }

  const sub = history2D.slice(-lookback);

  // 1. Analisis Biji 2D
  const bijiHistory = sub.map(([k, e]) => computeBiji(k, e));
  const lastBiji = bijiHistory[bijiHistory.length - 1];

  const bijiTrans: Record<number, number> = {};
  const bijiMomentum: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    bijiTrans[d] = 0;
    bijiMomentum[d] = 0;
  }

  for (let i = 0; i < bijiHistory.length - 1; i++) {
    if (bijiHistory[i] === lastBiji) {
      bijiTrans[bijiHistory[i + 1]] += 1;
    }
  }

  bijiHistory.forEach((b, idx) => {
    const decay = Math.exp(0.06 * (idx - bijiHistory.length + 1));
    bijiMomentum[b] += decay;
  });

  // Gap / Overdue Tracker Biji
  const bijiGap: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    let gap = bijiHistory.length;
    for (let step = 0; step < bijiHistory.length; step++) {
      if (bijiHistory[bijiHistory.length - 1 - step] === d) {
        gap = step;
        break;
      }
    }
    bijiGap[d] = gap;
  }

  const bijiScores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    const mScore = bijiMomentum[d];
    const tScore = bijiTrans[d] * 1.5;
    const gapBonus = bijiGap[d] >= 12 ? 1.2 : 0;
    bijiScores[d] = mScore + tScore + gapBonus;
  }

  const totBijiScore = Object.values(bijiScores).reduce((a, b) => a + b, 0) || 1.0;
  const bijiProbabilities: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    bijiProbabilities[d] = Number((bijiScores[d] / totBijiScore).toFixed(3));
  }

  const topBiji = Array.from({ length: 10 }, (_, i) => i)
    .sort((a, b) => bijiScores[b] - bijiScores[a])
    .slice(0, 3);

  // 2. Analisis Ganjil-Genap (4 Kuadran)
  const parityHistory = sub.map(([k, e]) => getParity(k, e));
  const lastParity = parityHistory[parityHistory.length - 1];

  const parityTrans: Record<ParityState, number> = {
    'Genap-Genap': 0,
    'Genap-Ganjil': 0,
    'Ganjil-Genap': 0,
    'Ganjil-Ganjil': 0
  };
  const parityMomentum: Record<ParityState, number> = {
    'Genap-Genap': 0,
    'Genap-Ganjil': 0,
    'Ganjil-Genap': 0,
    'Ganjil-Ganjil': 0
  };

  for (let i = 0; i < parityHistory.length - 1; i++) {
    if (parityHistory[i] === lastParity) {
      parityTrans[parityHistory[i + 1]] += 1;
    }
  }

  parityHistory.forEach((p, idx) => {
    const decay = Math.exp(0.08 * (idx - parityHistory.length + 1));
    parityMomentum[p] += decay;
  });

  const parityGap: Record<ParityState, number> = {
    'Genap-Genap': parityHistory.length,
    'Genap-Ganjil': parityHistory.length,
    'Ganjil-Genap': parityHistory.length,
    'Ganjil-Ganjil': parityHistory.length
  };

  PARITY_STATES.forEach((p) => {
    for (let step = 0; step < parityHistory.length; step++) {
      if (parityHistory[parityHistory.length - 1 - step] === p) {
        parityGap[p] = step;
        break;
      }
    }
  });

  const parityScores: Record<ParityState, number> = {
    'Genap-Genap': 0,
    'Genap-Ganjil': 0,
    'Ganjil-Genap': 0,
    'Ganjil-Ganjil': 0
  };

  PARITY_STATES.forEach((p) => {
    const reversion = parityGap[p] >= 8 ? 1.5 : 0;
    parityScores[p] = parityMomentum[p] + parityTrans[p] * 2.0 + reversion;
  });

  const totParity = Object.values(parityScores).reduce((a, b) => a + b, 0) || 1.0;
  const parityProbabilities: Record<string, number> = {};
  PARITY_STATES.forEach((p) => {
    parityProbabilities[p] = Number((parityScores[p] / totParity).toFixed(3));
  });

  const primaryParity = PARITY_STATES.slice().sort(
    (a, b) => parityScores[b] - parityScores[a]
  )[0];

  // 3. Analisis Kategori Besar-Kecil
  const magnitudeHistory = sub.map(([k, e]) => (k * 10 + e >= 50 ? 'Besar' : 'Kecil'));
  const lastMag = magnitudeHistory[magnitudeHistory.length - 1];

  let magTransBesar = 0;
  let magTransKecil = 0;
  for (let i = 0; i < magnitudeHistory.length - 1; i++) {
    if (magnitudeHistory[i] === lastMag) {
      if (magnitudeHistory[i + 1] === 'Besar') magTransBesar += 1;
      else magTransKecil += 1;
    }
  }

  let magMomBesar = 0;
  let magMomKecil = 0;
  magnitudeHistory.forEach((m, idx) => {
    const decay = Math.exp(0.08 * (idx - magnitudeHistory.length + 1));
    if (m === 'Besar') magMomBesar += decay;
    else magMomKecil += decay;
  });

  const scoreBesar = magMomBesar + magTransBesar * 1.5;
  const scoreKecil = magMomKecil + magTransKecil * 1.5;
  const totMag = scoreBesar + scoreKecil || 1.0;

  const magnitudeProbabilities = {
    Besar: Number((scoreBesar / totMag).toFixed(3)),
    Kecil: Number((scoreKecil / totMag).toFixed(3))
  };
  const primaryMagnitude: 'Besar' | 'Kecil' = scoreBesar >= scoreKecil ? 'Besar' : 'Kecil';

  // 4. Overdue Alerts
  const overdueAlerts: OverdueAlert[] = [];
  PARITY_STATES.forEach((p) => {
    const g = parityGap[p];
    if (g >= 8) {
      overdueAlerts.push({
        type: 'parity',
        label: `Pola ${p}`,
        gap: g,
        alertLevel: g >= 12 ? 'EKSTREM' : 'WASPADA'
      });
    }
  });

  for (let d = 0; d < 10; d++) {
    const g = bijiGap[d];
    if (g >= 14) {
      overdueAlerts.push({
        type: 'biji',
        label: `Biji ${d}`,
        gap: g,
        alertLevel: g >= 20 ? 'EKSTREM' : 'WASPADA'
      });
    }
  }

  const confidenceScore = Math.min(
    92,
    Math.max(
      60,
      Math.round(
        60 +
          (parityProbabilities[primaryParity] || 0.25) * 40 +
          (magnitudeProbabilities[primaryMagnitude] || 0.5) * 20
      )
    )
  );

  return {
    topBiji,
    bijiProbabilities,
    primaryParity,
    parityProbabilities,
    primaryMagnitude,
    magnitudeProbabilities,
    overdueAlerts,
    confidenceScore
  };
}
