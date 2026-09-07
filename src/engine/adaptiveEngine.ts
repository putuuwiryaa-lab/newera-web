import type { PredictionResult } from './types';

// Tabel Transformasi Komunitas Tradisional
export const INDEX_MAP: Record<number, number> = {
  0: 5, 1: 6, 2: 7, 3: 8, 4: 9,
  5: 0, 6: 1, 7: 2, 8: 3, 9: 4
};

export const MISTIK_LAMA: Record<number, number> = {
  0: 1, 1: 0, 2: 5, 3: 8, 4: 7,
  5: 2, 6: 9, 7: 4, 8: 3, 9: 6
};

export const MISTIK_BARU: Record<number, number> = {
  0: 8, 1: 7, 2: 6, 3: 9, 4: 5,
  5: 4, 6: 2, 7: 1, 8: 0, 9: 3
};

// ============================================================================
// 4 METODE KANDIDAT ADAPTIF
// ============================================================================

/** Metode A: Recency Momentum & Decay */
export function getMomentumScores(
  history2D: [number, number][],
  windowSize = 20,
  decay = 0.08
): Record<number, number> {
  const scores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) scores[d] = 0;

  const subHist = history2D.slice(-windowSize);
  const n = subHist.length;

  subHist.forEach(([k, e], idx) => {
    const weight = Math.exp(decay * (idx - n + 1));
    scores[k] += weight;
    scores[e] += weight;
  });

  return scores;
}

/** Metode B: First-Order Markov Transition Matrix */
export function getMarkovScores(
  history2D: [number, number][],
  lookback = 150
): Record<number, number> {
  const scores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) scores[d] = 0;

  if (history2D.length < 2) return scores;

  const subHist = history2D.slice(-lookback);
  const [lastK, lastE] = subHist[subHist.length - 1];

  const transK: Record<number, number> = {};
  const transE: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    transK[d] = 0;
    transE[d] = 0;
  }

  for (let i = 0; i < subHist.length - 1; i++) {
    const [pk, pe] = subHist[i];
    const [nk, ne] = subHist[i + 1];

    if (pk === lastK) transK[nk]++;
    if (pe === lastE) transE[ne]++;
  }

  for (let d = 0; d < 10; d++) {
    scores[d] = transK[d] + transE[d];
  }

  return scores;
}

/** Metode C: Delta Step & Modulo 10 (Analisis Siklus Jarak Selisih) */
export function getDeltaScores(
  history2D: [number, number][],
  windowSize = 15
): Record<number, number> {
  const scores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) scores[d] = 0;

  if (history2D.length < 2) return scores;

  const subHist = history2D.slice(-windowSize);
  const [lastK, lastE] = subHist[subHist.length - 1];

  const deltaCounts: Record<number, number> = {};
  for (let d = 0; d < 10; d++) deltaCounts[d] = 0;

  for (let i = 0; i < subHist.length - 1; i++) {
    const [pk, pe] = subHist[i];
    const [nk, ne] = subHist[i + 1];

    const dk = (((nk - pk) % 10) + 10) % 10;
    const de = (((ne - pe) % 10) + 10) % 10;
    deltaCounts[dk]++;
    deltaCounts[de]++;
  }

  for (let delta = 0; delta < 10; delta++) {
    const count = deltaCounts[delta];
    if (count > 0) {
      const projK = (lastK + delta) % 10;
      const projE = (lastE + delta) % 10;
      scores[projK] += count;
      scores[projE] += count;
    }
  }

  return scores;
}

/** Metode D: Dynamic Heuristic Transformation (Mistik/Indeks Adaptif) */
export function getAdaptiveMistikScores(
  history2D: [number, number][],
  evalWindow = 15
): Record<number, number> {
  const scores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) scores[d] = 0;

  if (history2D.length < 3) return scores;

  const subHist = history2D.slice(-evalWindow);
  const branchHits = { asli: 1, indeks: 1, mistik_lama: 1, mistik_baru: 1 };

  for (let i = 0; i < subHist.length - 1; i++) {
    const [pk, pe] = subHist[i];
    const [nk, ne] = subHist[i + 1];
    const actualSet = new Set([nk, ne]);

    [pk, pe].forEach((d) => {
      if (actualSet.has(d)) branchHits.asli++;
      if (actualSet.has(INDEX_MAP[d])) branchHits.indeks++;
      if (actualSet.has(MISTIK_LAMA[d])) branchHits.mistik_lama++;
      if (actualSet.has(MISTIK_BARU[d])) branchHits.mistik_baru++;
    });
  }

  const [lastK, lastE] = subHist[subHist.length - 1];
  [lastK, lastE].forEach((d) => {
    scores[d] += branchHits.asli;
    scores[INDEX_MAP[d]] += branchHits.indeks;
    scores[MISTIK_LAMA[d]] += branchHits.mistik_lama;
    scores[MISTIK_BARU[d]] += branchHits.mistik_baru;
  });

  return scores;
}

// ============================================================================
// CONTROLLER ENSEMBLE ADAPTIF
// ============================================================================

export class AdaptiveEnsemble {
  rollingWindow: number;

  constructor(rollingWindow = 20) {
    this.rollingWindow = rollingWindow;
  }

  rankDigitsForTier(
    history2D: [number, number][],
    tierSize = 4,
    customWeights?: Record<string, number>
  ): {
    ranked: number[];
    weights: Record<string, number>;
  } {
    const methods: Record<
      string,
      (h: [number, number][]) => Record<number, number>
    > = {
      Momentum: (h) => getMomentumScores(h),
      Markov: (h) => getMarkovScores(h),
      Delta: (h) => getDeltaScores(h),
      Mistik: (h) => getAdaptiveMistikScores(h)
    };

    let weights: Record<string, number>;

    // ATURAN ENGINE: Jika prediksi masuk (FREEZE) atau sudah dikalibrasi,
    // TIDAK PERLU hitung bobot dari awal! Langsung pertahankan bobot pemenang.
    if (customWeights && Object.keys(customWeights).length > 0) {
      weights = { ...customWeights };
    } else {
      // HANYA 1x dihitung saat inisialisasi awal (cold-start / pertama kali)
      weights = {
        Momentum: 1.0,
        Markov: 1.0,
        Delta: 1.0,
        Mistik: 1.0
      };

      if (history2D.length > this.rollingWindow + 5) {
        const evalSlice = history2D.slice(-this.rollingWindow);
        for (const [mName, mFunc] of Object.entries(methods)) {
          let hitCount = 0;
        for (let step = 0; step < evalSlice.length - 1; step++) {
          const histUntilStep = history2D.slice(
            0,
            -(this.rollingWindow - step)
          );
          const [nk, ne] = evalSlice[step + 1];
          const actualNext = new Set([nk, ne]);

          const mScores = mFunc(histUntilStep);
          // Evaluasi spesifik untuk ukuran parameter tierSize
          const topCandidates = Object.keys(mScores)
            .map(Number)
            .sort((a, b) => mScores[b] - mScores[a])
            .slice(0, tierSize);

          if (topCandidates.some((d) => actualNext.has(d))) {
            hitCount++;
          }
        }
        weights[mName] = Math.max(0.5, hitCount + 1);
        }
      }
    }

    // Gabungkan skor terbobot dengan bobot spesifik tierSize
    const combinedScores: Record<number, number> = {};
    for (let d = 0; d < 10; d++) combinedScores[d] = 0;

    for (const [mName, mFunc] of Object.entries(methods)) {
      const w = weights[mName];
      const rawScores = mFunc(history2D);
      const values = Object.values(rawScores);
      const maxS = Math.max(...values, 1.0);

      for (let d = 0; d < 10; d++) {
        combinedScores[d] += w * (rawScores[d] / maxS);
      }
    }

    // Urutkan digit 0-9 untuk tier ini
    const ranked = Object.keys(combinedScores)
      .map(Number)
      .sort((a, b) => combinedScores[b] - combinedScores[a]);

    return { ranked, weights };
  }

  // Compatibility helper (default AI-4)
  rankDigits(history2D: [number, number][]): {
    ranked: number[];
    weights: Record<string, number>;
  } {
    return this.rankDigitsForTier(history2D, 4);
  }
}

/**
 * Helper untuk kombinasi C(n, k)
 */
function getCombinations(arr: number[], size: number): number[][] {
  const result: number[][] = [];
  function backtrack(start: number, combo: number[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }
  backtrack(0, []);
  return result;
}

export interface DedicatedBBFSResult {
  tiers: { 6: number[]; 7: number[]; 8: number[]; 9: number[] };
  deadDigits: number[];
  bbfsRanked: number[];
  tierFactorWeights: Record<number, Record<string, number>>; // Bobot spesifik 4 faktor per parameter BBFS (6, 7, 8, 9)
}

/**
 * Menghitung bobot adaptif 4 komponen BBFS secara spesifik per-tier (6, 7, 8, 9):
 * 1. Densitas Pasangan (Direct Pair Density)
 * 2. Transisi Markov 2D (Transition Flow)
 * 3. Momentum Posisi (Positional Decay)
 * 4. Coverage Proteksi (Anti-Dead Digits & Pair Breadth)
 */
export function computeBBFSTierFactorWeights(
  history2D: [number, number][],
  evalWindow = 15
): Record<number, Record<string, number>> {
  const sub = history2D.slice(-evalWindow);

  // Basis prior struktural sesuai karakteristik ukuran tier
  const basePriors: Record<number, Record<string, number>> = {
    6: { 'Densitas Pasangan': 10.0, 'Transisi Markov': 8.0, 'Momentum Posisi': 6.0, 'Coverage Proteksi': 4.0 },
    7: { 'Densitas Pasangan': 8.0, 'Transisi Markov': 8.0, 'Momentum Posisi': 7.0, 'Coverage Proteksi': 7.0 },
    8: { 'Densitas Pasangan': 7.0, 'Transisi Markov': 6.0, 'Momentum Posisi': 8.0, 'Coverage Proteksi': 9.0 },
    9: { 'Densitas Pasangan': 5.0, 'Transisi Markov': 5.0, 'Momentum Posisi': 8.0, 'Coverage Proteksi': 12.0 }
  };

  const tierWeights: Record<number, Record<string, number>> = {
    6: { ...basePriors[6] },
    7: { ...basePriors[7] },
    8: { ...basePriors[8] },
    9: { ...basePriors[9] }
  };

  if (sub.length < 3) return tierWeights;

  for (let i = 0; i < sub.length - 1; i++) {
    const [prevK, prevE] = sub[i];
    const [actK, actE] = sub[i + 1];

    // Evaluasi empiris 4 komponen pada putaran historis:
    const hadDirectPair = sub.slice(0, i + 1).some(([k, e]) => (k === actK && e === actE) || (k === actE && e === actK));
    const hadMarkovTrans = sub.slice(0, i).some(([k, e], idx) => (k === prevK && sub[idx + 1][0] === actK) || (e === prevE && sub[idx + 1][1] === actE));
    const recent5 = sub.slice(Math.max(0, i - 4), i + 1);
    const hadPosMomentum = recent5.some(([k, e]) => k === actK || e === actK || k === actE || e === actE);

    [6, 7, 8, 9].forEach((sz) => {
      if (hadDirectPair) tierWeights[sz]['Densitas Pasangan'] += (sz === 6 ? 1.0 : sz === 7 ? 0.8 : 0.6);
      if (hadMarkovTrans) tierWeights[sz]['Transisi Markov'] += (sz === 6 ? 0.9 : sz === 7 ? 0.8 : 0.5);
      if (hadPosMomentum) tierWeights[sz]['Momentum Posisi'] += (sz >= 8 ? 1.0 : 0.7);
      tierWeights[sz]['Coverage Proteksi'] += (sz === 9 ? 1.2 : sz === 8 ? 0.9 : 0.4);
    });
  }

  [6, 7, 8, 9].forEach((sz) => {
    Object.keys(tierWeights[sz]).forEach((f) => {
      tierWeights[sz][f] = Number(tierWeights[sz][f].toFixed(1));
    });
  });

  return tierWeights;
}

/**
 * ENGINE KHUSUS BBFS:
 * Berbeda dari AI yang menghitung probabilitas 1 digit (marginal),
 * BBFS menghitung optimasi cakupan pasangan 2D (Joint Pair Coverage)
 * dengan evaluasi & pembobotan 4 faktor yang BERBEDA untuk setiap tier (6, 7, 8, 9).
 */
export function computeDedicatedBBFSTiers(
  history2D: [number, number][],
  lookback = 50,
  customTierFactorWeights?: Record<number, Record<string, number>>
): DedicatedBBFSResult {
  // ATURAN ENGINE: Jika tier BBFS tembus (FREEZE), jangan hitung ulang faktor dari awal!
  const baseWeights = computeBBFSTierFactorWeights(history2D);
  const tierFactorWeights: Record<number, Record<string, number>> = customTierFactorWeights
    ? { ...baseWeights, ...customTierFactorWeights }
    : baseWeights;

  const sub = history2D.slice(-lookback);
  const n = sub.length;
  if (n < 2) {
    return {
      tiers: {
        6: [0, 1, 2, 3, 4, 5],
        7: [0, 1, 2, 3, 4, 5, 6],
        8: [0, 1, 2, 3, 4, 5, 6, 7],
        9: [0, 1, 2, 3, 4, 5, 6, 7, 8]
      },
      deadDigits: [8, 9],
      bbfsRanked: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      tierFactorWeights
    };
  }

  const kScores: Record<number, number> = {};
  const eScores: Record<number, number> = {};
  const pairMatrix: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let d = 0; d < 10; d++) {
    kScores[d] = 0;
    eScores[d] = 0;
  }

  const [lastK, lastE] = sub[sub.length - 1];
  const kTrans: Record<number, number> = {};
  const eTrans: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    kTrans[d] = 0;
    eTrans[d] = 0;
  }

  for (let i = 0; i < n - 1; i++) {
    const [pk, pe] = sub[i];
    const [nk, ne] = sub[i + 1];
    if (pk === lastK) kTrans[nk] += 1;
    if (pe === lastE) eTrans[ne] += 1;
  }

  for (let idx = 0; idx < n; idx++) {
    const [k, e] = sub[idx];
    const decay = Math.exp(0.05 * (idx - n + 1));
    kScores[k] += decay;
    eScores[e] += decay;
    pairMatrix[k][e] += 2.0 * decay;
    pairMatrix[e][k] += 1.2 * decay;
  }

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const result: { 6: number[]; 7: number[]; 8: number[]; 9: number[] } = {
    6: [],
    7: [],
    8: [],
    9: []
  };

  const sizes: (6 | 7 | 8 | 9)[] = [6, 7, 8, 9];
  for (const size of sizes) {
    const w = tierFactorWeights[size];
    const totalW = w['Densitas Pasangan'] + w['Transisi Markov'] + w['Momentum Posisi'] + w['Coverage Proteksi'];
    const normW = {
      pair: (w['Densitas Pasangan'] / totalW) * 4,
      trans: (w['Transisi Markov'] / totalW) * 4,
      pos: (w['Momentum Posisi'] / totalW) * 4,
      cov: (w['Coverage Proteksi'] / totalW) * 4
    };

    // Matriks densitas gabungan spesifik yang terbobot untuk parameter tier ukuran ini
    const joint_size: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
    for (let k = 0; k < 10; k++) {
      for (let e = 0; e < 10; e++) {
        const posPot = (kScores[k] + kTrans[k] * 1.5) * (eScores[e] + eTrans[e] * 1.5);
        const pairPot = pairMatrix[k][e] * 3.0;
        const covPot = (kScores[k] + eScores[e]) * 0.8;
        joint_size[k][e] = normW.pair * pairPot + normW.trans * (kTrans[k] * eTrans[e] * 2.0) + normW.pos * posPot + normW.cov * covPot;
      }
    }

    const combinations = getCombinations(digits, size);
    let bestScore = -1;
    let bestComb: number[] = combinations[0];

    for (const comb of combinations) {
      let score = 0;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          score += joint_size[comb[i]][comb[j]];
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestComb = comb;
      }
    }

    // Urutkan digit di dalam kombinasi berdasarkan kontribusi internal terhadap joint_size
    const digitContrib: Record<number, number> = {};
    for (const d of bestComb) {
      let c = 0;
      for (const other of bestComb) {
        c += joint_size[d][other] + joint_size[other][d];
      }
      digitContrib[d] = c;
    }

    result[size] = [...bestComb].sort((a, b) => digitContrib[b] - digitContrib[a]);
  }

  // Hitung Skor Afinitas Total 2D per Digit (0-9) untuk mendeteksi Dead Digits
  const baseJoint: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let k = 0; k < 10; k++) {
    for (let e = 0; e < 10; e++) {
      baseJoint[k][e] = (kScores[k] + kTrans[k] * 1.5) * (eScores[e] + eTrans[e] * 1.5) + pairMatrix[k][e] * 3.0;
    }
  }

  const bbfsDigitScores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    let s = 0;
    for (let x = 0; x < 10; x++) {
      s += baseJoint[d][x] + baseJoint[x][d];
    }
    bbfsDigitScores[d] = s;
  }

  const bbfsRanked = [...digits].sort((a, b) => bbfsDigitScores[b] - bbfsDigitScores[a]);
  const deadDigits = bbfsRanked.slice(-2); // 2 Digit terlemah versi skor konektivitas 2D BBFS

  return {
    tiers: result,
    deadDigits,
    bbfsRanked,
    tierFactorWeights
  };
}

/**
 * Hasilkan Prediksi AI (3-6) & BBFS (6-9) untuk Periode Mendatang
 */
export function generatePrediction(
  results4D: string[],
  auditContext?: {
    aiAudit?: {
      tierAudits?: Record<number, { action: string }>;
      calibratedWeights?: Record<string, number>;
      tierMethodWeights?: Record<number, Record<string, number>>;
    };
    bbfsAudit?: {
      tierAudits?: Record<number, { action: string }>;
      tierFactorWeights?: Record<number, Record<string, number>>;
    };
  } | null
): PredictionResult | null {
  const valid4D = results4D.filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  if (valid4D.length < 5) return null;

  const history2D: [number, number][] = valid4D.map((r) => [
    parseInt(r[2], 10),
    parseInt(r[3], 10)
  ]);

  const ensemble = new AdaptiveEnsemble(20);
  
  // ATURAN ENGINE: Jika prediksi sebelumnya masuk (FREEZE), pertahankan bobot pemenang.
  // JANGAN hitung ulang bobot dari awal jika sudah menang!
  // Hanya hitung dari awal jika ini pertama kali (cold start).
  const getAIWeightsForTier = (sz: number): Record<string, number> | undefined => {
    if (!auditContext?.aiAudit) return undefined;
    const audit = auditContext.aiAudit.tierAudits?.[sz];
    if (audit?.action === 'FREEZE') {
      return auditContext.aiAudit.tierMethodWeights?.[sz] || auditContext.aiAudit.calibratedWeights;
    } else if (audit?.action === 'CALIBRATED') {
      return auditContext.aiAudit.calibratedWeights;
    }
    return undefined;
  };

  const res3 = ensemble.rankDigitsForTier(history2D, 3, getAIWeightsForTier(3));
  const res4 = ensemble.rankDigitsForTier(history2D, 4, getAIWeightsForTier(4));
  const res5 = ensemble.rankDigitsForTier(history2D, 5, getAIWeightsForTier(5));
  const res6 = ensemble.rankDigitsForTier(history2D, 6, getAIWeightsForTier(6));

  const tierMethodWeights: Record<number, Record<string, number>> = {
    3: res3.weights,
    4: res4.weights,
    5: res5.weights,
    6: res6.weights
  };

  const aiResults = {
    3: res3.ranked.slice(0, 3),
    4: res4.ranked.slice(0, 4),
    5: res5.ranked.slice(0, 5),
    6: res6.ranked.slice(0, 6)
  };

  // Tentukan bobot faktor BBFS (6, 7, 8, 9): jika FREEZE, pertahankan tanpa hitung ulang dari awal
  let customBBFSTierWeights: Record<number, Record<string, number>> | undefined = undefined;
  if (auditContext?.bbfsAudit?.tierFactorWeights) {
    customBBFSTierWeights = {};
    for (const sz of [6, 7, 8, 9] as const) {
      const bbfsAudit = auditContext.bbfsAudit.tierAudits?.[sz];
      if (bbfsAudit?.action === 'FREEZE' && auditContext.bbfsAudit.tierFactorWeights[sz]) {
        customBBFSTierWeights[sz] = { ...auditContext.bbfsAudit.tierFactorWeights[sz] };
      }
    }
    if (Object.keys(customBBFSTierWeights).length === 0) {
      customBBFSTierWeights = undefined;
    }
  }

  // Kalkulasi independen untuk BBFS berbasis optimasi cakupan pasangan 2D & Dead Digits
  const dedicatedBBFS = computeDedicatedBBFSTiers(history2D, 50, customBBFSTierWeights);

  const lastFull = valid4D[valid4D.length - 1];

  // Hitung Skor Konvergensi & Keyakinan Model (Confidence Score)
  const methods = [
    getMomentumScores(history2D),
    getMarkovScores(history2D),
    getDeltaScores(history2D),
    getAdaptiveMistikScores(history2D)
  ];

  const top3Lists = methods.map((scores) =>
    Object.keys(scores)
      .map(Number)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, 3)
  );

  // Hitung berapa banyak digit teratas yang disepakati bersama oleh metode
  let agreements = 0;
  const leadDigit = res4.ranked[0];
  const secondDigit = res4.ranked[1];

  top3Lists.forEach((list) => {
    if (list.includes(leadDigit)) agreements += 1;
    if (list.includes(secondDigit)) agreements += 0.5;
  });

  // Skala keyakinan 55% s.d. 94%
  let confidenceScore = Math.min(94, Math.max(55, Math.round(55 + agreements * 6.5)));
  let convergenceStatus: 'TINGGI' | 'SEDANG' | 'RENDAH' = 'SEDANG';
  if (confidenceScore >= 80) convergenceStatus = 'TINGGI';
  else if (confidenceScore < 68) convergenceStatus = 'RENDAH';

  return {
    rankedDigits: res4.ranked,
    ai: aiResults,
    bbfs: dedicatedBBFS.tiers,
    methodWeights: res4.weights,
    tierMethodWeights,
    bbfsTierWeights: dedicatedBBFS.tierFactorWeights,
    confidenceScore,
    convergenceStatus,
    deadDigits: dedicatedBBFS.deadDigits, // 2 Digit terlemah berbasis skor BBFS 2D!
    lastDraw: {
      full: lastFull,
      as: parseInt(lastFull[0], 10),
      kop: parseInt(lastFull[1], 10),
      kepala: parseInt(lastFull[2], 10),
      ekor: parseInt(lastFull[3], 10)
    }
  };
}
