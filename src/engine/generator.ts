import type { PaitoMacroPrediction, WheelingResult } from './types';
import { computeBiji, getParity } from './paitoPredictor';
import { getShioFor2D } from './shio';

/**
 * Menghasilkan daftar pasangan 2D dari digit-digit BBFS terpilih.
 */
export function generate2DLines(
  digits: number[],
  includeTwins = false
): string[] {
  const lines: string[] = [];
  const uniqueDigits = Array.from(new Set(digits));

  for (let i = 0; i < uniqueDigits.length; i++) {
    for (let j = 0; j < uniqueDigits.length; j++) {
      if (i === j) {
        if (includeTwins) {
          lines.push(`${uniqueDigits[i]}${uniqueDigits[j]}`);
        }
      } else {
        lines.push(`${uniqueDigits[i]}${uniqueDigits[j]}`);
      }
    }
  }

  return lines;
}

/**
 * Format baris 2D ke format string siap pasang (spasi / koma / baris baru)
 */
export function formatLines(
  lines: string[],
  delimiter: 'space' | 'comma' | 'newline' = 'space'
): string {
  if (delimiter === 'comma') return lines.join(', ');
  if (delimiter === 'newline') return lines.join('\n');
  return lines.join(' ');
}

export interface SmartTrimResult {
  top10: string[];
  medium15: string[];
  cadangan: string[];
  bom12: string[];
  invest20: string[];
  full42: string[];
}

/**
 * Pemangkas Cerdas 2D (Smart Trimmer)
 * Memilah baris BBFS menjadi:
 * - BOM 12 Line: P(4, 2) dari 4 digit teratas
 * - Investasi 20 Line: P(5, 2) dari 5 digit teratas
 * - Proteksi Penuh 42 Line: P(7, 2) dari 7 digit
 */
export function generateSmartTrim(rankedDigits: number[]): SmartTrimResult {
  const top4 = rankedDigits.slice(0, 4);
  const bom12 = generate2DLines(top4, false); // P(4, 2) = 12 lines
  const top10 = bom12.slice(0, 10);

  const top5 = rankedDigits.slice(0, 5);
  const invest20 = generate2DLines(top5, false); // P(5, 2) = 20 lines
  const top10Set = new Set(top10);
  const medium15 = invest20.filter((l) => !top10Set.has(l)).slice(0, 15);

  const top7 = rankedDigits.slice(0, 7);
  const full42 = generate2DLines(top7, false); // P(7, 2) = 42 lines
  const usedSet = new Set([...top10, ...medium15]);
  const cadangan = full42.filter((l) => !usedSet.has(l));

  return { top10, medium15, cadangan, bom12, invest20, full42 };
}

export interface SniperTrimResult {
  sniperTop: string[];
  sniperSecondary: string[];
  superSniperShio?: string[];
  cadangan: string[];
  efficiencyPct: number;
}

/**
 * Pemangkas Sniper 2D Berbasis Paito & Shio:
 * Menyaring baris BBFS menggunakan irisan Top 3 Biji, Pola Paritas Utama, dan Top 3 Shio 2026.
 */
export function generateSniperTrim(
  digits: number[],
  paitoPred: PaitoMacroPrediction,
  includeTwins = false
): SniperTrimResult {
  const allLines = generate2DLines(digits, includeTwins);
  const topBijiSet = new Set(paitoPred.topBiji);
  const topShioSet = new Set(paitoPred.topShios || []);

  const sniperTop: string[] = [];
  const sniperSecondary: string[] = [];
  const superSniperShio: string[] = [];
  const cadangan: string[] = [];

  for (const line of allLines) {
    const k = parseInt(line[0], 10);
    const e = parseInt(line[1], 10);
    const biji = computeBiji(k, e);
    const parity = getParity(k, e);
    const shio = getShioFor2D(k * 10 + e);

    const hitBiji = topBijiSet.has(biji);
    const hitParity = parity === paitoPred.primaryParity;
    const hitShio = topShioSet.has(shio.no);

    if (hitBiji && hitParity) {
      sniperTop.push(line);
      if (hitShio) {
        superSniperShio.push(line);
      }
    } else if (hitBiji) {
      sniperSecondary.push(line);
    } else {
      cadangan.push(line);
    }
  }

  const keptCount = sniperTop.length || sniperSecondary.length;
  const efficiencyPct =
    allLines.length > 0
      ? Math.round(((allLines.length - keptCount) / allLines.length) * 100)
      : 0;

  return {
    sniperTop,
    sniperSecondary,
    superSniperShio,
    cadangan,
    efficiencyPct
  };
}

/**
 * Wheeling System (Covering Design) untuk 3D & 4D BBFS 7 Digit:
 * Mengompresi ratusan baris permutasi menjadi kumpulan tiket tercover secara matematis.
 */
export function generateWheelingSystem(digits: number[]): WheelingResult {
  const unique = Array.from(new Set(digits));
  const d = unique.slice(0, 7);
  while (d.length < 7) {
    for (let i = 0; i <= 9; i++) {
      if (!d.includes(i)) {
        d.push(i);
        if (d.length === 7) break;
      }
    }
  }

  // 1. Wheel 3D Covering Design C(7, 3, 2) - 15 Line (100% pairs covered)
  const WHEEL_3D_INDICES = [
    [0, 1, 2], [0, 3, 4], [0, 5, 6],
    [1, 3, 5], [1, 4, 6], [2, 3, 6], [2, 4, 5],
    [0, 1, 4], [0, 2, 5], [0, 3, 6],
    [1, 2, 3], [1, 5, 6], [2, 4, 6], [3, 4, 5],
    [0, 1, 3]
  ];
  const wheel3D = WHEEL_3D_INDICES.map(
    (idx) => `${d[idx[0]]}${d[idx[1]]}${d[idx[2]]}`
  );

  // 2. Wheel 3D Full Combinations C(7, 3) - 35 Line
  const wheel3DFull: string[] = [];
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      for (let k = j + 1; k < 7; k++) {
        wheel3DFull.push(`${d[i]}${d[j]}${d[k]}`);
      }
    }
  }

  // 3. Wheel 4D Covering Design C(7, 4, 3) - 14 Line (100% triplets covered)
  const WHEEL_4D_INDICES = [
    [0, 1, 2, 3], [0, 1, 4, 5], [0, 2, 4, 6], [0, 3, 5, 6],
    [1, 2, 5, 6], [1, 3, 4, 6], [2, 3, 4, 5], [0, 1, 2, 4],
    [0, 1, 2, 5], [0, 1, 2, 6], [0, 1, 3, 4], [0, 1, 3, 5],
    [0, 2, 3, 6], [0, 4, 5, 6]
  ];
  const wheel4D = WHEEL_4D_INDICES.map(
    (idx) => `${d[idx[0]]}${d[idx[1]]}${d[idx[2]]}${d[idx[3]]}`
  );

  // 4. Wheel 4D Full Combinations C(7, 4) - 35 Line
  const wheel4DFull: string[] = [];
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      for (let k = j + 1; k < 7; k++) {
        for (let m = k + 1; m < 7; m++) {
          wheel4DFull.push(`${d[i]}${d[j]}${d[k]}${d[m]}`);
        }
      }
    }
  }

  return {
    wheel3D,
    wheel3DFull,
    wheel4D,
    wheel4DFull,
    guarantee3D: 'Jaminan 100% Pasangan 2D Tercover (Hemat 93% Modal)',
    guarantee4D: 'Jaminan 100% Triplet 3-in-4 Tercover (Hemat 96% Modal)'
  };
}

/**
 * Filter dinamis untuk Live Dynamic Filter Bar di UI
 */
export function filterLinesCustom(
  lines: string[],
  filters: {
    activeBiji?: number[];
    activeParity?: string[];
    activeMagnitude?: ('Besar' | 'Kecil')[];
  }
): string[] {
  return lines.filter((line) => {
    const k = parseInt(line[0], 10);
    const e = parseInt(line[1], 10);
    const b = computeBiji(k, e);
    const par = getParity(k, e);
    const mag = (k * 10 + e) >= 50 ? 'Besar' : 'Kecil';

    if (filters.activeBiji && filters.activeBiji.length > 0) {
      if (!filters.activeBiji.includes(b)) return false;
    }
    if (filters.activeParity && filters.activeParity.length > 0) {
      if (!filters.activeParity.includes(par)) return false;
    }
    if (filters.activeMagnitude && filters.activeMagnitude.length > 0) {
      if (!filters.activeMagnitude.includes(mag)) return false;
    }
    return true;
  });
}
