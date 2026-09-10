import type { PaitoMacroPrediction, OverdueAlert, OverdueShioInfo } from './types';
import { SHIO_2026_LIST, JALUR_SHIO_MAP, getShioFor2D } from './shio';
import {
  computeBiji,
  getParity,
  analyzeMovementDynamics,
  PARITY_STATES,
  type ParityState
} from './movementPredictor';

// Re-export untuk kompatibilitas modul lain
export { computeBiji, getParity, PARITY_STATES, type ParityState };

/**
 * Memprediksi atribut makro paito berdasarkan DINAMIKA POLA PERGERAKAN:
 * 1. Biji 2D (Step modular aritmatika delta + Resonansi cermin)
 * 2. Pola Ganjil-Genap (Osilasi kutub partikel Kepala/Ekor + 2-step n-gram trajectory)
 * 3. Kategori Besar-Kecil (Deteksi ritme Zig-Zag vs Runtutan Jenuh Reversal)
 * 4. Shio & Jalur (Rotasi siklis orbit Z3 dan ritme harmonik Z12)
 */
export function predictPaitoMacro(
  history2D: [number, number][],
  lookback = 50,
  rawHistory4D?: string[]
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

  // 1. Eksekusi Analisis Pola Pergerakan Menyeluruh
  const movement = analyzeMovementDynamics(history2D, rawHistory4D);

  // 2. Besar vs Kecil (Berdasarkan Pola Pergerakan Zig-Zag / Reversal Breakout)
  const primaryMagnitude: 'Besar' | 'Kecil' = movement.magnitude.prediction;
  const magConf = movement.magnitude.confidence / 100;
  const magnitudeProbabilities = {
    Besar: primaryMagnitude === 'Besar' ? magConf : Number((1 - magConf).toFixed(3)),
    Kecil: primaryMagnitude === 'Kecil' ? magConf : Number((1 - magConf).toFixed(3))
  };

  // 3. Genap vs Ganjil (Berdasarkan Osilasi Kutub Kepala/Ekor & Trajektori N-Gram)
  const primaryParity = movement.parity.primaryParity;
  const parityConf = movement.parity.confidence / 100;
  const remainingParityProb = (1 - parityConf) / 3;
  const parityProbabilities: Record<string, number> = {};
  PARITY_STATES.forEach((p) => {
    parityProbabilities[p] = p === primaryParity ? parityConf : Number(remainingParityProb.toFixed(3));
  });

  // 4. Jalur & Shio 2026 (Berdasarkan Rotasi Orbit Z3 & Ritme Harmonik Z12)
  const primaryJalur = movement.jalur.predictedJalur;
  const topShios = movement.jalur.predictedShios;

  const jalurConf = movement.jalur.confidence / 100;
  const remainingJalurProb = (1 - jalurConf) / 2;
  const jalurProbabilities: Record<number, number> = {
    1: primaryJalur === 1 ? jalurConf : Number(remainingJalurProb.toFixed(3)),
    2: primaryJalur === 2 ? jalurConf : Number(remainingJalurProb.toFixed(3)),
    3: primaryJalur === 3 ? jalurConf : Number(remainingJalurProb.toFixed(3))
  };

  // Shio Probabilities
  const shioProbabilities: Record<number, number> = {};
  for (let s = 1; s <= 12; s++) {
    if (topShios.includes(s)) {
      shioProbabilities[s] = 0.18;
    } else if (JALUR_SHIO_MAP[primaryJalur].includes(s)) {
      shioProbabilities[s] = 0.10;
    } else {
      shioProbabilities[s] = 0.04;
    }
  }

  // 5. Biji 2D (Berdasarkan Step Modular Delta & Cermin Sumbu 9)
  const topBiji = movement.biji.targetBiji;
  const bijiProbabilities: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    if (topBiji.includes(d)) {
      bijiProbabilities[d] = 0.22;
    } else {
      bijiProbabilities[d] = 0.048;
    }
  }

  // 6. Overdue Gap Analysis (Untuk Sistem Peringatan Anomali)
  const parityHistory = sub.map(([k, e]) => getParity(k, e));
  const bijiHistory = sub.map(([k, e]) => computeBiji(k, e));
  const shioHistory = sub.map(([k, e]) => getShioFor2D(k * 10 + e).no);

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

  const overdueShios: OverdueShioInfo[] = [];
  SHIO_2026_LIST.forEach((sInfo) => {
    const g = shioGap[sInfo.no];
    if (g >= 14) {
      const alertLevel = g >= 24 ? 'EKSTREM' : 'WASPADA';
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
        label: `Shio ${sInfo.emoji} ${sInfo.name} (${sInfo.no.toString().padStart(2, '0')})`,
        gap: g,
        alertLevel
      });
    }
  });

  overdueAlerts.sort((a, b) => b.gap - a.gap);
  overdueShios.sort((a, b) => b.gap - a.gap);

  const confidenceScore = Math.round(
    (movement.magnitude.confidence + movement.parity.confidence + movement.jalur.confidence + movement.biji.confidence) / 4
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
    confidenceScore,
    movement
  };
}
