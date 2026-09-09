import type { PaitoMacroPrediction, OverdueAlert, OverdueShioInfo } from './types';
import { getShioFor2D, SHIO_2026_LIST, JALUR_SHIO_MAP } from './shio';

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
    const defaultShioProbs: Record<number, number> = {};
    for (let s = 1; s <= 12; s++) defaultShioProbs[s] = Number((1 / 12).toFixed(3));
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
      topShios: [1, 2, 3],
      primaryJalur: 1,
      shioProbabilities: defaultShioProbs,
      jalurProbabilities: { 1: 0.34, 2: 0.33, 3: 0.33 },
      overdueShios: [],
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

  // 4. Analisis Shio 2026 (Tahun Kuda Api)
  const shioHistory = sub.map(([k, e]) => getShioFor2D(k * 10 + e).no);
  const lastShio = shioHistory[shioHistory.length - 1];

  const shioTrans: Record<number, number> = {};
  const shioMomentum: Record<number, number> = {};
  for (let s = 1; s <= 12; s++) {
    shioTrans[s] = 0;
    shioMomentum[s] = 0;
  }

  for (let i = 0; i < shioHistory.length - 1; i++) {
    if (shioHistory[i] === lastShio) {
      shioTrans[shioHistory[i + 1]] += 1;
    }
  }

  shioHistory.forEach((s, idx) => {
    const decay = Math.exp(0.06 * (idx - shioHistory.length + 1));
    shioMomentum[s] += decay;
  });

  const shioGap: Record<number, number> = {};
  for (let s = 1; s <= 12; s++) {
    let gap = shioHistory.length;
    for (let step = 0; step < shioHistory.length; step++) {
      if (shioHistory[shioHistory.length - 1 - step] === s) {
        gap = step;
        break;
      }
    }
    shioGap[s] = gap;
  }

  const shioScores: Record<number, number> = {};
  for (let s = 1; s <= 12; s++) {
    const mScore = shioMomentum[s];
    const tScore = shioTrans[s] * 1.5;
    const gapBonus = shioGap[s] >= 14 ? 1.5 : 0;
    shioScores[s] = mScore + tScore + gapBonus;
  }

  const totShioScore = Object.values(shioScores).reduce((a, b) => a + b, 0) || 1.0;
  const shioProbabilities: Record<number, number> = {};
  for (let s = 1; s <= 12; s++) {
    shioProbabilities[s] = Number((shioScores[s] / totShioScore).toFixed(3));
  }

  const topShios = Array.from({ length: 12 }, (_, i) => i + 1)
    .sort((a, b) => shioScores[b] - shioScores[a])
    .slice(0, 3);

  // Probabilitas 3 Jalur Shio
  const jalurProbabilities: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  ([1, 2, 3] as (1 | 2 | 3)[]).forEach((j) => {
    const shiosInJalur = JALUR_SHIO_MAP[j];
    const sumProb = shiosInJalur.reduce((acc, sno) => acc + (shioProbabilities[sno] || 0), 0);
    jalurProbabilities[j] = sumProb;
  });
  const totJalur = (jalurProbabilities[1] + jalurProbabilities[2] + jalurProbabilities[3]) || 1.0;
  jalurProbabilities[1] = Number((jalurProbabilities[1] / totJalur).toFixed(3));
  jalurProbabilities[2] = Number((jalurProbabilities[2] / totJalur).toFixed(3));
  jalurProbabilities[3] = Number((jalurProbabilities[3] / totJalur).toFixed(3));

  let primaryJalur: 1 | 2 | 3 = 1;
  let maxJalurProb = -1;
  ([1, 2, 3] as (1 | 2 | 3)[]).forEach((j) => {
    if (jalurProbabilities[j] > maxJalurProb) {
      maxJalurProb = jalurProbabilities[j];
      primaryJalur = j;
    }
  });

  // 5. Overdue Alerts
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

  // Overdue Shios Tracker
  const overdueShios: OverdueShioInfo[] = [];
  SHIO_2026_LIST.forEach((sInfo) => {
    const g = shioGap[sInfo.no];
    if (g >= 14) {
      const alertLevel = g >= 20 ? 'EKSTREM' : 'WASPADA';
      overdueShios.push({
        number: sInfo.no,
        name: sInfo.name,
        emoji: sInfo.emoji,
        jalur: sInfo.jalur,
        gap: g,
        alertLevel
      });
      overdueAlerts.push({
        type: 'shio',
        label: `Shio ${sInfo.emoji} ${sInfo.name} (${String(sInfo.no).padStart(2, '0')})`,
        gap: g,
        alertLevel
      });
    }
  });

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
    topShios,
    primaryJalur,
    shioProbabilities,
    jalurProbabilities,
    overdueShios,
    overdueAlerts,
    confidenceScore
  };
}
