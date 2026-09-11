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

/** Normalisasi bobot menjadi distribusi probabilitas yang totalnya tepat 1. */
function normalizeProbabilities<T extends string | number>(raw: Record<T, number>): Record<T, number> {
  const keys = Object.keys(raw) as T[];
  const total = keys.reduce((sum, key) => sum + Math.max(0, raw[key]), 0);
  const out = {} as Record<T, number>;

  if (keys.length === 0) return out;
  if (total <= 0) {
    const p = 1 / keys.length;
    keys.forEach((key) => { out[key] = p; });
    return out;
  }

  keys.forEach((key) => {
    out[key] = Math.max(0, raw[key]) / total;
  });
  return out;
}

/**
 * Memprediksi atribut makro paito berdasarkan dinamika pola pergerakan.
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
    for (let s = 1; s <= 12; s++) defaultShioProbs[s] = 1 / 12;
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
      jalurProbabilities: { 1: 1 / 3, 2: 1 / 3, 3: 1 / 3 },
      overdueShios: [],
      overdueAlerts: [],
      confidenceScore: 50
    };
  }

  const sub = history2D.slice(-lookback);
  const movement = analyzeMovementDynamics(history2D, rawHistory4D);

  // 1. Besar vs Kecil
  const primaryMagnitude: 'Besar' | 'Kecil' = movement.magnitude.prediction;
  const magConf = Math.min(0.99, Math.max(0.5, movement.magnitude.confidence / 100));
  const magnitudeProbabilities = normalizeProbabilities({
    Besar: primaryMagnitude === 'Besar' ? magConf : 1 - magConf,
    Kecil: primaryMagnitude === 'Kecil' ? magConf : 1 - magConf
  });

  // 2. Genap vs Ganjil
  const primaryParity = movement.parity.primaryParity;
  const parityConf = Math.min(0.97, Math.max(0.25, movement.parity.confidence / 100));
  const parityRaw: Record<string, number> = {};
  const remainingParityProb = (1 - parityConf) / 3;
  PARITY_STATES.forEach((p) => {
    parityRaw[p] = p === primaryParity ? parityConf : remainingParityProb;
  });
  const parityProbabilities = normalizeProbabilities(parityRaw);

  // 3. Jalur & Shio 2026
  const primaryJalur = movement.jalur.predictedJalur;
  const topShios = movement.jalur.predictedShios;
  const jalurConf = Math.min(0.97, Math.max(1 / 3, movement.jalur.confidence / 100));
  const remainingJalurProb = (1 - jalurConf) / 2;
  const jalurProbabilities = normalizeProbabilities<number>({
    1: primaryJalur === 1 ? jalurConf : remainingJalurProb,
    2: primaryJalur === 2 ? jalurConf : remainingJalurProb,
    3: primaryJalur === 3 ? jalurConf : remainingJalurProb
  });

  const shioRaw: Record<number, number> = {};
  for (let s = 1; s <= 12; s++) {
    if (topShios.includes(s)) shioRaw[s] = 0.18;
    else if (JALUR_SHIO_MAP[primaryJalur].includes(s)) shioRaw[s] = 0.10;
    else shioRaw[s] = 0.04;
  }
  const shioProbabilities = normalizeProbabilities(shioRaw);

  // 4. Biji 2D. Gunakan prior ruang sampel 00-99:
  // Biji 0 = 1/100, Biji 1..9 = 11/100. Target diberi boost lalu dinormalisasi.
  const topBiji = movement.biji.targetBiji;
  const bijiRaw: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    const base = d === 0 ? 0.01 : 0.11;
    bijiRaw[d] = base * (topBiji.includes(d) ? 2.0 : 1.0);
  }
  const bijiProbabilities = normalizeProbabilities(bijiRaw);

  // 5. Overdue Gap Analysis
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
