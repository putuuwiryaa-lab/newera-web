import type {
  MovementMagnitudeDetail,
  MovementParityDetail,
  MovementJalurDetail,
  MovementBijiDetail,
  MovementDynamics,
  MovementHistoryPoint,
  PolaTarungPrediction
} from './types';
import { getShioFor2D, JALUR_SHIO_MAP } from './shio';

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

// ============================================================================
// 1. POLA PERGERAKAN BESAR VS KECIL (OSCILLATION & STREAK REVERSAL DYNAMICS)
// ============================================================================

export function analyzeMagnitudeMovement(
  history2D: [number, number][],
  lookback = 30
): MovementMagnitudeDetail {
  if (history2D.length < 5) {
    return {
      rhythm: 'TREND_FOLLOW',
      rhythmLabel: 'Inisialisasi Momentum',
      flipRate: 0.5,
      currentStreak: 1,
      currentStreakState: 'Besar',
      historicalMaxStreak: 3,
      velocitySlope: 0,
      prediction: 'Besar',
      confidence: 50,
      rationale: 'Data historis terbatas; sinyal belum cukup kuat.'
    };
  }

  const sub = history2D.slice(-lookback);
  const states = sub.map(([k, e]) => (k * 10 + e >= 50 ? 'Besar' : 'Kecil'));
  const n = states.length;

  let flips = 0;
  for (let i = 1; i < n; i++) {
    if (states[i] !== states[i - 1]) flips++;
  }
  const flipRate = Number((flips / (n - 1)).toFixed(2));

  let currentStreak = 1;
  const lastState = states[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    if (states[i] === lastState) currentStreak++;
    else break;
  }

  let maxStreak = 1;
  let tempStreak = 1;
  const streakLengths: number[] = [];
  for (let i = 1; i < n; i++) {
    if (states[i] === states[i - 1]) {
      tempStreak++;
    } else {
      streakLengths.push(tempStreak);
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 1;
    }
  }
  streakLengths.push(tempStreak);
  maxStreak = Math.max(maxStreak, tempStreak);

  const avgStreak = streakLengths.length > 0
    ? streakLengths.reduce((a, b) => a + b, 0) / streakLengths.length
    : 2;

  const recentValues = sub.slice(-4).map(([k, e]) => k * 10 + e);
  let velocitySlope = 0;
  if (recentValues.length >= 2) {
    const intervals = recentValues.length - 1;
    velocitySlope = Number(
      ((recentValues[recentValues.length - 1] - recentValues[0]) / intervals).toFixed(1)
    );
  }

  const oppositeState = lastState === 'Besar' ? 'Kecil' : 'Besar';

  if (flipRate >= 0.58) {
    const flipStrength = Math.min(1, Math.max(0, (flipRate - 0.5) / 0.5));
    return {
      rhythm: 'ZIG_ZAG',
      rhythmLabel: `Osilasi Zig-Zag (${Math.round(flipRate * 100)}% Flip)`,
      flipRate,
      currentStreak,
      currentStreakState: lastState,
      historicalMaxStreak: maxStreak,
      velocitySlope,
      prediction: oppositeState,
      confidence: Math.round(50 + flipStrength * 35),
      rationale: `Flip historis ${Math.round(flipRate * 100)}%; kekuatan sinyal dihitung dari jaraknya terhadap kondisi acak 50%.`
    };
  }

  if (currentStreak >= maxStreak || (currentStreak >= 3 && currentStreak >= Math.round(avgStreak + 1))) {
    const excess = Math.max(0, currentStreak - avgStreak);
    return {
      rhythm: 'STREAK_REVERSAL',
      rhythmLabel: `Titik Jenuh Runtutan (${currentStreak}x ${lastState})`,
      flipRate,
      currentStreak,
      currentStreakState: lastState,
      historicalMaxStreak: maxStreak,
      velocitySlope,
      prediction: oppositeState,
      confidence: Math.min(88, Math.round(55 + excess * 8)),
      rationale: `Runtutan ${lastState} ${currentStreak}x dibanding rata-rata historis ${avgStreak.toFixed(1)}x.`
    };
  }

  const trendPrediction = velocitySlope > 15 ? 'Besar' : velocitySlope < -15 ? 'Kecil' : lastState;
  return {
    rhythm: 'TREND_FOLLOW',
    rhythmLabel: `Aliran Tren (${lastState} Aktif)`,
    flipRate,
    currentStreak,
    currentStreakState: lastState,
    historicalMaxStreak: maxStreak,
    velocitySlope,
    prediction: trendPrediction,
    confidence: Math.min(80, Math.round(50 + Math.min(30, Math.abs(velocitySlope)) * 0.8)),
    rationale: `Slope dihitung per interval aktual (${recentValues.length - 1} interval) sebesar ${velocitySlope > 0 ? '+' : ''}${velocitySlope}.`
  };
}

// ============================================================================
// 2. POLA PERGERAKAN GENAP VS GANJIL (POLARITY OSCILLATION & 2-STEP N-GRAM)
// ============================================================================

export function analyzeParityMovement(
  history2D: [number, number][],
  lookback = 40
): MovementParityDetail {
  if (history2D.length < 5) {
    return {
      kepalaPolarity: 'Genap',
      kepalaOscillation: 'FLIP',
      ekorPolarity: 'Ganjil',
      ekorOscillation: 'FLIP',
      trajectoryFlow: 'Genap-Ganjil -> Genap-Ganjil',
      primaryParity: 'Genap-Ganjil',
      confidence: 50,
      rationale: 'Data terbatas; menggunakan default dengan confidence netral.'
    };
  }

  const sub = history2D.slice(-lookback);
  const parityHistory = sub.map(([k, e]) => getParity(k, e));
  const n = parityHistory.length;

  let kFlips = 0;
  let eFlips = 0;
  for (let i = 1; i < n; i++) {
    if ((sub[i - 1][0] % 2) !== (sub[i][0] % 2)) kFlips++;
    if ((sub[i - 1][1] % 2) !== (sub[i][1] % 2)) eFlips++;
  }

  const kFlipRate = kFlips / (n - 1);
  const eFlipRate = eFlips / (n - 1);

  const lastK = sub[n - 1][0];
  const lastE = sub[n - 1][1];
  const lastKPolar = lastK % 2 === 0 ? 'Genap' : 'Ganjil';
  const lastEPolar = lastE % 2 === 0 ? 'Genap' : 'Ganjil';

  const predKPolar = kFlipRate >= 0.52
    ? (lastKPolar === 'Genap' ? 'Ganjil' : 'Genap')
    : lastKPolar;
  const kOsc: 'FLIP' | 'STICKY' = kFlipRate >= 0.52 ? 'FLIP' : 'STICKY';

  const predEPolar = eFlipRate >= 0.52
    ? (lastEPolar === 'Genap' ? 'Ganjil' : 'Genap')
    : lastEPolar;
  const eOsc: 'FLIP' | 'STICKY' = eFlipRate >= 0.52 ? 'FLIP' : 'STICKY';

  const particlePredictedParity = `${predKPolar}-${predEPolar}` as ParityState;

  const nGramTransitions: Record<string, Record<ParityState, number>> = {};
  for (let i = 0; i < n - 2; i++) {
    const pairKey = `${parityHistory[i]}__${parityHistory[i + 1]}`;
    if (!nGramTransitions[pairKey]) {
      nGramTransitions[pairKey] = {
        'Genap-Genap': 0,
        'Genap-Ganjil': 0,
        'Ganjil-Genap': 0,
        'Ganjil-Ganjil': 0
      };
    }
    nGramTransitions[pairKey][parityHistory[i + 2]]++;
  }

  const currentPairKey = `${parityHistory[n - 2]}__${parityHistory[n - 1]}`;
  const candidates = nGramTransitions[currentPairKey];

  let nGramTopParity: ParityState = particlePredictedParity;
  let topNGramCount = 0;
  let nGramTotal = 0;
  if (candidates) {
    PARITY_STATES.forEach((p) => {
      nGramTotal += candidates[p];
      if (candidates[p] > topNGramCount) {
        topNGramCount = candidates[p];
        nGramTopParity = p;
      }
    });
  }

  const primaryParity = topNGramCount >= 2 ? nGramTopParity : particlePredictedParity;
  const trajectoryFlow = `${parityHistory[n - 2]} ➔ ${parityHistory[n - 1]} ➔ Target: ${primaryParity}`;

  // 50% flip adalah kondisi paling tidak informatif. Makin jauh dari 50%,
  // perilaku flip/sticky makin konsisten. N-gram menambah evidence jika berulang.
  const kConsistency = Math.abs(kFlipRate - 0.5) * 2;
  const eConsistency = Math.abs(eFlipRate - 0.5) * 2;
  const oscillationConsistency = Math.min(1, (kConsistency + eConsistency) / 2);
  const nGramDominance = nGramTotal > 0 ? topNGramCount / nGramTotal : 0;
  const confidence = Math.min(88, Math.round(45 + oscillationConsistency * 25 + nGramDominance * 18));

  return {
    kepalaPolarity: predKPolar,
    kepalaOscillation: kOsc,
    ekorPolarity: predEPolar,
    ekorOscillation: eOsc,
    trajectoryFlow,
    primaryParity,
    confidence,
    rationale: `Konsistensi flip/sticky ${(oscillationConsistency * 100).toFixed(0)}%; dominasi n-gram ${(nGramDominance * 100).toFixed(0)}%.`
  };
}

// ============================================================================
// 3. POLA PERGERAKAN ROTASI ORBIT JALUR & SHIO (ORBITAL & HARMONIC CYCLE)
// ============================================================================

export function analyzeJalurMovement(
  history2D: [number, number][],
  lookback = 35
): MovementJalurDetail {
  if (history2D.length < 5) {
    return {
      orbitDirection: 'PUTARAN_MAJU',
      orbitLabel: 'Siklus Maju (J1 -> J2 -> J3)',
      lastTransitions: [[1, 2], [2, 3]],
      predictedJalur: 1,
      predictedShios: [1, 4, 7],
      shioStepRhythm: 'TRIAD_HARMONIC',
      confidence: 50,
      rationale: 'Data terbatas; orbit default dengan confidence netral.'
    };
  }

  const sub = history2D.slice(-lookback);
  const shioHistory = sub.map(([k, e]) => getShioFor2D(k * 10 + e));
  const jalurHistory = shioHistory.map((s) => s.jalur);
  const n = jalurHistory.length;

  const deltaCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  const lastTransitions: [1 | 2 | 3, 1 | 2 | 3][] = [];

  for (let i = 1; i < n; i++) {
    const prevJ = jalurHistory[i - 1];
    const currJ = jalurHistory[i];
    const d = (currJ - prevJ + 3) % 3;
    deltaCounts[d]++;
    if (i >= n - 3) lastTransitions.push([prevJ, currJ]);
  }

  const lastJalur = jalurHistory[n - 1];
  const prevJalur = jalurHistory[n - 2];
  const lastDelta = (lastJalur - prevJalur + 3) % 3;
  const prevDelta = (prevJalur - jalurHistory[n - 3] + 3) % 3;

  let orbitDirection: 'PUTARAN_MAJU' | 'PUTARAN_MUNDUR' | 'PANTULAN' | 'BERTAHAN';
  let orbitLabel: string;
  let predictedJalur: 1 | 2 | 3;

  if (jalurHistory[n - 1] === jalurHistory[n - 3] && jalurHistory[n - 1] !== jalurHistory[n - 2]) {
    orbitDirection = 'PANTULAN';
    predictedJalur = jalurHistory[n - 2];
    orbitLabel = `Pantulan Rebound (J${lastJalur} ➔ J${predictedJalur} ➔ J${lastJalur})`;
  } else if ((lastDelta === 1 && prevDelta === 1) || deltaCounts[1] > deltaCounts[2] * 1.3) {
    orbitDirection = 'PUTARAN_MAJU';
    const nextJ = ((lastJalur % 3) + 1) as 1 | 2 | 3;
    predictedJalur = nextJ;
    orbitLabel = `Putaran Maju Orbit (+1: J${lastJalur} ➔ J${nextJ})`;
  } else if ((lastDelta === 2 && prevDelta === 2) || deltaCounts[2] > deltaCounts[1] * 1.3) {
    orbitDirection = 'PUTARAN_MUNDUR';
    const nextJ = (((lastJalur - 2 + 3) % 3) + 1) as 1 | 2 | 3;
    predictedJalur = nextJ;
    orbitLabel = `Putaran Mundur Orbit (-1: J${lastJalur} ➔ J${nextJ})`;
  } else if (lastDelta === 0) {
    orbitDirection = 'BERTAHAN';
    predictedJalur = lastJalur;
    orbitLabel = `Orbit Bertahan di J${lastJalur}`;
  } else {
    orbitDirection = deltaCounts[1] >= deltaCounts[2] ? 'PUTARAN_MAJU' : 'PUTARAN_MUNDUR';
    const step = orbitDirection === 'PUTARAN_MAJU' ? 1 : 2;
    predictedJalur = (((lastJalur + step - 1) % 3) + 1) as 1 | 2 | 3;
    orbitLabel = `Rotasi Terkuat (Menuju J${predictedJalur})`;
  }

  const lastShioNo = shioHistory[n - 1].no;
  const prevShioNo = shioHistory[n - 2].no;
  const shioStep = (lastShioNo - prevShioNo + 12) % 12;

  let shioStepRhythm: 'TRIAD_HARMONIC' | 'CIONG_OPPOSITE' | 'STEP_CREEP' | 'STABLE';
  if (shioStep === 4 || shioStep === 8) shioStepRhythm = 'TRIAD_HARMONIC';
  else if (shioStep === 6) shioStepRhythm = 'CIONG_OPPOSITE';
  else if (shioStep === 1 || shioStep === 11 || shioStep === 2 || shioStep === 10) shioStepRhythm = 'STEP_CREEP';
  else shioStepRhythm = 'STABLE';

  const candidateShios = JALUR_SHIO_MAP[predictedJalur];
  const scoredShios = candidateShios.map((sno) => {
    let score = 1.0;
    const step = (sno - lastShioNo + 12) % 12;
    if (step === 4 || step === 8) score += 2.0;
    if (step === 6) score += 1.5;
    if (step === 1 || step === 11) score += 1.2;
    return { sno, score };
  });

  scoredShios.sort((a, b) => b.score - a.score);
  const predictedShios = scoredShios.map((x) => x.sno).slice(0, 3);

  const transitionTotal = Math.max(1, n - 1);
  const dominantTransitions = Math.max(deltaCounts[0], deltaCounts[1], deltaCounts[2]);
  const dominance = dominantTransitions / transitionTotal;
  const normalizedDominance = Math.max(0, Math.min(1, (dominance - 1 / 3) / (2 / 3)));
  const confidence = Math.round(45 + normalizedDominance * 43);

  return {
    orbitDirection,
    orbitLabel,
    lastTransitions,
    predictedJalur,
    predictedShios,
    shioStepRhythm,
    confidence,
    rationale: `Dominasi pola transisi Jalur ${(dominance * 100).toFixed(0)}%; confidence tidak lagi naik hanya karena frekuensi perpindahan tinggi.`
  };
}

// ============================================================================
// 4. POLA PERGERAKAN BIJI 2D (MODULAR ARITHMETIC STEP DRIFT)
// ============================================================================

export function analyzeBijiMovement(
  history2D: [number, number][],
  lookback = 30
): MovementBijiDetail {
  if (history2D.length < 5) {
    return {
      dominantStepDelta: 0,
      stepLabel: 'Step Modular 0',
      isMirrorReflection: false,
      targetBiji: [0, 1, 2],
      confidence: 40,
      rationale: 'Data terbatas; belum ada step dominan yang dapat dipercaya.'
    };
  }

  const sub = history2D.slice(-lookback);
  const bijiSeq = sub.map(([k, e]) => computeBiji(k, e));
  const n = bijiSeq.length;

  const stepFreq: Record<number, number> = {};
  const bijiFreq: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    stepFreq[d] = 0;
    bijiFreq[d] = 0;
  }
  bijiSeq.forEach((b) => bijiFreq[b]++);

  for (let i = 1; i < n; i++) {
    const delta = (bijiSeq[i] - bijiSeq[i - 1] + 10) % 10;
    stepFreq[delta]++;
  }

  let bestStep = 0;
  let maxStepCount = -1;
  for (let d = 0; d < 10; d++) {
    if (stepFreq[d] > maxStepCount) {
      maxStepCount = stepFreq[d];
      bestStep = d;
    }
  }

  const lastBiji = bijiSeq[n - 1];
  const projectedBiji1 = (lastBiji + bestStep) % 10;
  const projectedBiji2 = (lastBiji - bestStep + 10) % 10;
  const mirrorBiji = (9 - lastBiji + 10) % 10;
  const isMirrorReflection = bijiSeq.length >= 3 && bijiSeq[n - 2] === mirrorBiji;

  const targetSet = new Set<number>([projectedBiji1, projectedBiji2, mirrorBiji]);
  const historicalRank = Array.from({ length: 10 }, (_, d) => d)
    .sort((a, b) => bijiFreq[b] - bijiFreq[a] || a - b);
  for (const d of historicalRank) {
    if (targetSet.size >= 3) break;
    targetSet.add(d);
  }
  const targetBiji = Array.from(targetSet).slice(0, 3);

  const stepDominance = maxStepCount / Math.max(1, n - 1);
  const confidence = Math.min(88, Math.round(40 + stepDominance * 48));
  const stepLabel = bestStep === 0 ? 'Step Modular 0 (Stagnan)' : `Step Modular (+${bestStep} / -${bestStep})`;

  return {
    dominantStepDelta: bestStep,
    stepLabel,
    isMirrorReflection,
    targetBiji,
    confidence,
    rationale: `Step Δ${bestStep} mendominasi ${(stepDominance * 100).toFixed(0)}% transisi; target dijaga tetap 3 biji unik.`
  };
}

// ============================================================================
// 5. POLA TARUNG 2D (KEPALA VS EKOR BERBASIS POLA PERGERAKAN)
// ============================================================================

function circularSignedDelta(prev: number, curr: number): number {
  let delta = (curr - prev + 10) % 10;
  if (delta > 5) delta -= 10;
  // Jarak 5 sama kuat ke dua arah; perlakukan netral agar tidak bias.
  if (delta === 5) return 0;
  return delta;
}

export function analyzePolaTarungMovement(
  history2D: [number, number][],
  lookback = 30
): PolaTarungPrediction {
  const sub = history2D.slice(-lookback);
  const n = sub.length;

  const kepalaScores: Record<number, number> = {};
  const ekorScores: Record<number, number> = {};
  for (let d = 0; d < 10; d++) {
    kepalaScores[d] = 0;
    ekorScores[d] = 0;
  }

  if (n < 5) {
    const defaultRank = [2, 7, 4, 9, 1, 6, 3, 8, 0, 5];
    return {
      rankedKepala: defaultRank,
      rankedEkor: defaultRank,
      kepalaScores,
      ekorScores,
      kepalaDirection: 'STABIL',
      ekorDirection: 'STABIL',
      tarung3x3: generatePolaTarungLines(defaultRank.slice(0, 3), defaultRank.slice(0, 3)),
      tarung4x4: generatePolaTarungLines(defaultRank.slice(0, 4), defaultRank.slice(0, 4)),
      tarung5x5: generatePolaTarungLines(defaultRank.slice(0, 5), defaultRank.slice(0, 5))
    };
  }

  const lastK = sub[n - 1][0];
  const lastE = sub[n - 1][1];

  let kDriftWeighted = 0;
  let eDriftWeighted = 0;
  let driftWeightTotal = 0;

  for (let i = 1; i < n; i++) {
    const recencyWeight = Math.exp(0.08 * (i - n + 1));
    const dk = circularSignedDelta(sub[i - 1][0], sub[i][0]);
    const de = circularSignedDelta(sub[i - 1][1], sub[i][1]);
    kDriftWeighted += dk * recencyWeight;
    eDriftWeighted += de * recencyWeight;
    driftWeightTotal += recencyWeight;

    if (sub[i - 1][0] === lastK) kepalaScores[sub[i][0]] += 3.5;
    if (sub[i - 1][1] === lastE) ekorScores[sub[i][1]] += 3.5;
  }

  sub.forEach(([k, e], idx) => {
    const weight = Math.exp(0.08 * (idx - n + 1));
    kepalaScores[k] += weight * 2.0;
    ekorScores[e] += weight * 2.0;
  });

  const kStep = (sub[n - 1][0] - sub[n - 2][0] + 10) % 10;
  const eStep = (sub[n - 1][1] - sub[n - 2][1] + 10) % 10;
  kepalaScores[(lastK + kStep) % 10] += 2.5;
  ekorScores[(lastE + eStep) % 10] += 2.5;

  const kDriftAvg = driftWeightTotal > 0 ? kDriftWeighted / driftWeightTotal : 0;
  const eDriftAvg = driftWeightTotal > 0 ? eDriftWeighted / driftWeightTotal : 0;

  const kepalaDirection: 'NAIK' | 'TURUN' | 'STABIL' =
    kDriftAvg > 0.6 ? 'NAIK' : kDriftAvg < -0.6 ? 'TURUN' : 'STABIL';
  const ekorDirection: 'NAIK' | 'TURUN' | 'STABIL' =
    eDriftAvg > 0.6 ? 'NAIK' : eDriftAvg < -0.6 ? 'TURUN' : 'STABIL';

  const rankedKepala = Array.from({ length: 10 }, (_, i) => i)
    .sort((a, b) => kepalaScores[b] - kepalaScores[a]);
  const rankedEkor = Array.from({ length: 10 }, (_, i) => i)
    .sort((a, b) => ekorScores[b] - ekorScores[a]);

  const tarung3x3 = generatePolaTarungLines(rankedKepala.slice(0, 3), rankedEkor.slice(0, 3));
  const tarung4x4 = generatePolaTarungLines(rankedKepala.slice(0, 4), rankedEkor.slice(0, 4));
  const tarung5x5 = generatePolaTarungLines(rankedKepala.slice(0, 5), rankedEkor.slice(0, 5));

  return {
    rankedKepala,
    rankedEkor,
    kepalaScores,
    ekorScores,
    kepalaDirection,
    ekorDirection,
    tarung3x3,
    tarung4x4,
    tarung5x5
  };
}

/** Menghasilkan pasangan line 2D perkalian kartesian (Kepala x Ekor). */
export function generatePolaTarungLines(
  kepalaDigits: number[],
  ekorDigits: number[],
  includeTwins = true
): string[] {
  const result: string[] = [];
  for (const k of kepalaDigits) {
    for (const e of ekorDigits) {
      if (!includeTwins && k === e) continue;
      result.push(`${k}${e}`);
    }
  }
  return result;
}

// ============================================================================
// 6. SINTESIS DINAMIKA POLA PERGERAKAN LENGKAP
// ============================================================================

export function analyzeMovementDynamics(
  history2D: [number, number][],
  rawHistory4D?: string[]
): MovementDynamics {
  const magnitude = analyzeMagnitudeMovement(history2D);
  const parity = analyzeParityMovement(history2D);
  const jalur = analyzeJalurMovement(history2D);
  const biji = analyzeBijiMovement(history2D);

  const last5 = history2D.slice(-5);
  const rawLast5 = rawHistory4D ? rawHistory4D.slice(-5) : [];

  const last5Draws: MovementHistoryPoint[] = last5.map(([k, e], idx) => {
    const comb2D = `${k}${e}`;
    const full = rawLast5[idx] || `**${comb2D}`;
    const shio = getShioFor2D(k * 10 + e);
    return {
      period: idx + 1,
      full,
      comb2D,
      kepala: k,
      ekor: e,
      magnitude: k * 10 + e >= 50 ? 'Besar' : 'Kecil',
      parity: getParity(k, e),
      biji: computeBiji(k, e),
      jalur: shio.jalur,
      shioNumber: shio.no,
      shioName: shio.name
    };
  });

  return {
    magnitude,
    parity,
    jalur,
    biji,
    last5Draws
  };
}
