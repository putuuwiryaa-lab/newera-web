import type {
  PaitoMacroPrediction,
  PaitoBBFS7Result,
  DeadDigitDetail,
  Heatmap2DStats
} from './types';
import { computeBiji, getParity } from './movementPredictor';
import { getShioFor2D } from './shio';
import { computeHeatmap2DStats } from './heatmapStats';
import { predictPaitoMacro } from './paitoPredictor';

/**
 * Menghasilkan semua kombinasi C(n, k)
 */
function getCombinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  function backtrack(start: number, current: number[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Menghasilkan permutasi P(k, 2) untuk membentuk pasangan 2D (tanpa twin)
 */
function get2DPairPermutations(digits: number[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < digits.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      if (i !== j) {
        lines.push(`${digits[i]}${digits[j]}`);
      }
    }
  }
  return lines;
}

/**
 * Mesin Sintesis BBFS-7 Paito Pro (Generasi Baru)
 *
 * Menggabungkan seluruh dimensi Paito 2D:
 * 1. Resonansi Biji Top 3 & Modular Step Delta
 * 2. Polaritas Kinetik Kepala & Ekor (Osilasi Ganjil/Genap)
 * 3. Harmoni Shio 2026 & Trinitas Jalur Orbit Z3
 * 4. Heatmap 10x10 Frekuensi & Status Hot/Warm/Cold
 * 5. Entropy Balance Regularizer (Mencegah ketimpangan 4B/3K & 4G/3G)
 * 6. Isolasi Teruji 3 Triad Kumat / Dead Digits (10 - 7 = 3)
 */
export function synthesizePaitoBBFS7(
  history2D: [number, number][],
  valid4D: string[],
  existingPaitoPred?: PaitoMacroPrediction,
  existingHeatmap?: Heatmap2DStats
): PaitoBBFS7Result {
  const paitoPred = existingPaitoPred || predictPaitoMacro(history2D, 50, valid4D);
  const heatmap = existingHeatmap || computeHeatmap2DStats(history2D, 50);

  const lookback = Math.min(50, history2D.length);
  const subHistory = history2D.slice(-lookback);

  // 1. Matriks Ko-okurensi Pasangan 2D (10x10)
  const pairMatrix: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (const [k, e] of subHistory) {
    pairMatrix[k][e] += 1;
    pairMatrix[e][k] += 0.5; // afinitas mutual
  }

  // 2. Skor Partikel & Posisi Tunggal per Digit (0-9)
  const singleScores: Record<number, number> = {};
  const bijiScores: Record<number, number> = {};
  const parityScores: Record<number, number> = {};
  const shioScores: Record<number, number> = {};
  const heatmapScores: Record<number, number> = {};

  const topBijiSet = new Set(paitoPred.topBiji);
  const topShioSet = new Set(paitoPred.topShios || []);
  const primaryJalur = paitoPred.primaryJalur;

  const kepalaPolarity = paitoPred.movement?.parity.kepalaPolarity || (paitoPred.primaryParity.startsWith('Genap') ? 'Genap' : 'Ganjil');
  const ekorPolarity = paitoPred.movement?.parity.ekorPolarity || (paitoPred.primaryParity.endsWith('Genap') ? 'Genap' : 'Ganjil');

  for (let d = 0; d < 10; d++) {
    // a) Momentum & Exponential Decay
    let mom = 0;
    for (let i = 0; i < subHistory.length; i++) {
      const [k, e] = subHistory[i];
      const decayWeight = Math.exp(0.06 * (i - subHistory.length + 1));
      if (k === d) mom += decayWeight * 1.2;
      if (e === d) mom += decayWeight * 1.0;
    }

    // b) Paritas Kinetik
    let par = 0;
    const isEven = d % 2 === 0;
    if ((isEven && kepalaPolarity === 'Genap') || (!isEven && kepalaPolarity === 'Ganjil')) {
      par += 2.0;
    }
    if ((isEven && ekorPolarity === 'Genap') || (!isEven && ekorPolarity === 'Ganjil')) {
      par += 1.8;
    }

    // c) Kompatibilitas Biji saat dipasangkan dengan digit lain
    let bijiCompat = 0;
    for (let other = 0; other < 10; other++) {
      if (other !== d) {
        const b = computeBiji(d, other);
        if (topBijiSet.has(b)) bijiCompat += 1.2;
      }
    }

    // d) Resonansi Shio & Jalur
    let shioCompat = 0;
    for (let other = 0; other < 10; other++) {
      const shioKE = getShioFor2D(d * 10 + other);
      if (topShioSet.has(shioKE.no)) shioCompat += 1.0;
      if (shioKE.jalur === primaryJalur) shioCompat += 0.5;

      const shioEK = getShioFor2D(other * 10 + d);
      if (topShioSet.has(shioEK.no)) shioCompat += 0.8;
      if (shioEK.jalur === primaryJalur) shioCompat += 0.4;
    }

    // e) Heatmap 10x10 Signal (Hot/Cold & Gap)
    const kStat = heatmap.kepalaStats[d];
    const eStat = heatmap.ekorStats[d];
    let heat = 0;
    if (kStat.status === 'HOT') heat += 2.5;
    else if (kStat.status === 'WARM') heat += 1.0;
    else if (kStat.status === 'COLD') heat -= 1.5;

    if (eStat.status === 'HOT') heat += 2.2;
    else if (eStat.status === 'WARM') heat += 0.9;
    else if (eStat.status === 'COLD') heat -= 1.3;

    // Bonus kinetic trace (jika muncul di 5 result terakhir)
    const inTrace = heatmap.kineticTrace.some((t) => t.kepala === d || t.ekor === d);
    if (inTrace) heat += 1.5;

    bijiScores[d] = bijiCompat;
    parityScores[d] = par;
    shioScores[d] = shioCompat;
    heatmapScores[d] = heat;

    singleScores[d] = mom * 1.5 + par * 1.8 + bijiCompat * 1.4 + shioCompat * 1.2 + heat * 1.3;
  }

  // 3. Evaluasi Semua 120 Kombinasi C(10, 7) dengan Regularizer Entropi
  const allComb7 = getCombinations([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
  let bestComb: number[] = allComb7[0];
  let bestScore = -Infinity;

  for (const comb of allComb7) {
    // Skor Gabungan Internal
    let combScore = 0;
    for (const d of comb) {
      combScore += singleScores[d];
    }
    // Skor Konektivitas Pasangan Antar Digit
    for (let i = 0; i < comb.length; i++) {
      for (let j = i + 1; j < comb.length; j++) {
        combScore += (pairMatrix[comb[i]][comb[j]] + pairMatrix[comb[j]][comb[i]]) * 0.8;
      }
    }

    // Regularizer Keseimbangan Spektrum (Entropy Balance Regularizer)
    // Target ideal BBFS-7: 4 Besar/3 Kecil (atau 3/4) & 4 Genap/3 Ganjil (atau 3/4)
    const besarCount = comb.filter((d) => d >= 5).length;
    const genapCount = comb.filter((d) => d % 2 === 0).length;

    const penaltyBesar = Math.max(0, Math.abs(besarCount - 3.5) - 0.5) * 4.0;
    const penaltyGenap = Math.max(0, Math.abs(genapCount - 3.5) - 0.5) * 4.0;

    const totalCombScore = combScore - penaltyBesar - penaltyGenap;

    if (totalCombScore > bestScore) {
      bestScore = totalCombScore;
      bestComb = comb;
    }
  }

  // 4. Urutkan Digit di dalam Best 7 Berdasarkan Kontribusi Konektivitas
  const digitInternalScore: Record<number, number> = {};
  for (const d of bestComb) {
    let internalScore = singleScores[d];
    for (const other of bestComb) {
      if (other !== d) {
        internalScore += pairMatrix[d][other] + pairMatrix[other][d];
      }
    }
    digitInternalScore[d] = internalScore;
  }

  const ranked7 = [...bestComb].sort((a, b) => digitInternalScore[b] - digitInternalScore[a]);
  const digits = [...ranked7];

  // 5. Analisis Teruji 3 Triad Kumat / Dead Digits (10 - 7 = 3)
  const deadDigitSet = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !bestComb.includes(d)));
  const triadKumat: DeadDigitDetail[] = Array.from(deadDigitSet).map((d) => {
    const kStat = heatmap.kepalaStats[d];
    const eStat = heatmap.ekorStats[d];
    const avgGap = (kStat.lastSeenGap + eStat.lastSeenGap) / 2;
    const isCold = kStat.status === 'COLD' && eStat.status === 'COLD';

    // Hitung safety score eliminasi (makin tinggi score = makin aman dibuang)
    let safety = 65;
    if (isCold) safety += 18;
    if (singleScores[d] < 0) safety += 12;
    if (avgGap > 12) safety += 10;
    if (kStat.status === 'HOT' || eStat.status === 'HOT') safety -= 30;

    const finalSafety = Math.min(99, Math.max(30, Math.round(safety)));

    let status: 'AMAN' | 'WASPADA' | 'NETRAL' = 'NETRAL';
    if (finalSafety >= 75) status = 'AMAN';
    else if (finalSafety < 55) status = 'WASPADA';

    const reasons: string[] = [];
    if (isCold) reasons.push('Cold Momentum');
    if (avgGap > 10) reasons.push(`Gap ${Math.round(avgGap)} Draw`);
    if (status === 'AMAN') reasons.push('Konektivitas Rendah');
    if (status === 'WASPADA') reasons.push('Potensi Pantulan Rebound');

    return {
      digit: d,
      safetyScore: finalSafety,
      status,
      reason: reasons.length > 0 ? reasons.join(' + ') : 'Skor Probabilitas Rendah',
      gap: Math.round(avgGap)
    };
  }).sort((a, b) => b.safetyScore - a.safetyScore);

  // 6. Pembagian Baris Hierarkis 2D:
  // - BOM 12 Line: P(4, 2) dari 4 digit terkuat (ranked7[0..3])
  const top4 = ranked7.slice(0, 4);
  const bom12 = get2DPairPermutations(top4);

  // - Investasi 20 Line: P(5, 2) dari 5 digit terkuat (ranked7[0..4]) -> 12 BOM + 8 Investasi
  const top5 = ranked7.slice(0, 5);
  const invest20 = get2DPairPermutations(top5);

  // - Proteksi Penuh 42 Line: P(7, 2) dari 7 digit terpilih
  const full42 = get2DPairPermutations(ranked7);

  // - Twin Guard 7 Line
  const twin7 = ranked7.map((d) => `${d}${d}`);

  // - Super Nuklir 6 Line: Irisan sempurna Biji Top 3 + Pola Paritas + Shio
  const primaryParity = paitoPred.primaryParity;
  const scoredLines = full42.map((line) => {
    const k = parseInt(line[0], 10);
    const e = parseInt(line[1], 10);
    const b = computeBiji(k, e);
    const par = getParity(k, e);
    const shio = getShioFor2D(k * 10 + e);

    let matchScore = 0;
    if (topBijiSet.has(b)) matchScore += 4;
    if (par === primaryParity) matchScore += 3;
    if (topShioSet.has(shio.no)) matchScore += 2;
    if (shio.jalur === primaryJalur) matchScore += 1;

    // Tambahkan bobot afinitas digit
    matchScore += (singleScores[k] + singleScores[e]) * 0.1;

    return { line, matchScore, hitBiji: topBijiSet.has(b), hitPar: par === primaryParity, hitShio: topShioSet.has(shio.no) };
  });

  scoredLines.sort((a, b) => b.matchScore - a.matchScore);
  const nuklir6 = scoredLines.slice(0, 6).map((item) => item.line);

  // 7. Data Entropi Spektrum
  const finalBesar = digits.filter((d) => d >= 5).length;
  const finalKecil = 7 - finalBesar;
  const finalGenap = digits.filter((d) => d % 2 === 0).length;
  const finalGanjil = 7 - finalGenap;

  return {
    digits,
    ranked7,
    nuklir6,
    bom12,
    invest20,
    full42,
    twin7,
    triadKumat,
    spectrumBalance: {
      besarCount: finalBesar,
      kecilCount: finalKecil,
      genapCount: finalGenap,
      ganjilCount: finalGanjil,
      entropyScore: 100 - (Math.abs(finalBesar - 3.5) - 0.5) * 20 - (Math.abs(finalGenap - 3.5) - 0.5) * 20,
      isBalanced: (finalBesar === 4 || finalBesar === 3) && (finalGenap === 4 || finalGenap === 3)
    },
    synthesisDetails: {
      bijiContribution: bijiScores,
      parityContribution: parityScores,
      shioContribution: shioScores,
      heatmapContribution: heatmapScores
    }
  };
}
