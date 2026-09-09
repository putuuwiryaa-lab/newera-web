import type { PaitoMacroPrediction } from './types';
import { computeBiji, getParity } from './paitoPredictor';

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
}

/**
 * Pemangkas Cerdas 2D (Smart Trimmer)
 * Memilah 42 line BBFS menjadi:
 * - Top 10 Line (Bom Utama): Kombinasi 4 digit teratas
 * - 15 Line Medium: Kombinasi digit 1 s.d. 5
 * - Cadangan: Sisa baris pengaman
 */
export function generateSmartTrim(rankedDigits: number[]): SmartTrimResult {
  const top4 = rankedDigits.slice(0, 4);
  const top10 = generate2DLines(top4, false).slice(0, 10);

  const top5 = rankedDigits.slice(0, 5);
  const allTop5 = generate2DLines(top5, false);
  const top10Set = new Set(top10);
  const medium15 = allTop5.filter((l) => !top10Set.has(l)).slice(0, 15);

  const top7 = rankedDigits.slice(0, 7);
  const allTop7 = generate2DLines(top7, false);
  const usedSet = new Set([...top10, ...medium15]);
  const cadangan = allTop7.filter((l) => !usedSet.has(l));

  return { top10, medium15, cadangan };
}

export interface SniperTrimResult {
  sniperTop: string[];
  sniperSecondary: string[];
  cadangan: string[];
  efficiencyPct: number;
}

/**
 * Pemangkas Sniper 2D Berbasis Paito:
 * Menyaring baris BBFS menggunakan irisan Top 3 Biji dan Pola Paritas Utama.
 */
export function generateSniperTrim(
  digits: number[],
  paitoPred: PaitoMacroPrediction,
  includeTwins = false
): SniperTrimResult {
  const allLines = generate2DLines(digits, includeTwins);
  const topBijiSet = new Set(paitoPred.topBiji);

  const sniperTop: string[] = [];
  const sniperSecondary: string[] = [];
  const cadangan: string[] = [];

  for (const line of allLines) {
    const k = parseInt(line[0], 10);
    const e = parseInt(line[1], 10);
    const biji = computeBiji(k, e);
    const parity = getParity(k, e);

    const hitBiji = topBijiSet.has(biji);
    const hitParity = parity === paitoPred.primaryParity;

    if (hitBiji && hitParity) {
      sniperTop.push(line);
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
    cadangan,
    efficiencyPct
  };
}
