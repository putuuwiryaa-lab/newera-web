/**
 * SHIO 2026 (TAHUN KUDA API / FIRE HORSE)
 * 
 * Aturan Shio Togel:
 * 1. Shio tahun berjalan (Kuda) = Shio 01
 * 2. Urutan berputar mundur: Kuda, Ular, Naga, Kelinci, Harimau, Kerbau, Tikus, Babi, Anjing, Ayam, Monyet, Kambing
 * 3. Aritmatika modulo 12: Nilai 2D 01-99 & 00 (00 dihitung 100).
 *    100 mod 12 = 4 -> Shio 04 (Kelinci)
 * 4. Pembagian 3 Jalur:
 *    - Jalur 1: Shio 01, 04, 07, 10 (34 nomor)
 *    - Jalur 2: Shio 02, 05, 08, 11 (33 nomor)
 *    - Jalur 3: Shio 03, 06, 09, 12 (33 nomor)
 */

export interface ShioInfo {
  no: number; // 1..12
  name: string;
  emoji: string;
  jalur: 1 | 2 | 3;
  numbers: string[];
}

export const SHIO_2026_LIST: ShioInfo[] = [
  {
    no: 1,
    name: 'Kuda',
    emoji: '🐴',
    jalur: 1,
    numbers: ['01', '13', '25', '37', '49', '61', '73', '85', '97']
  },
  {
    no: 2,
    name: 'Ular',
    emoji: '🐍',
    jalur: 2,
    numbers: ['02', '14', '26', '38', '50', '62', '74', '86', '98']
  },
  {
    no: 3,
    name: 'Naga',
    emoji: '🐲',
    jalur: 3,
    numbers: ['03', '15', '27', '39', '51', '63', '75', '87', '99']
  },
  {
    no: 4,
    name: 'Kelinci',
    emoji: '🐇',
    jalur: 1,
    numbers: ['00', '04', '16', '28', '40', '52', '64', '76', '88']
  },
  {
    no: 5,
    name: 'Harimau',
    emoji: '🐯',
    jalur: 2,
    numbers: ['05', '17', '29', '41', '53', '65', '77', '89']
  },
  {
    no: 6,
    name: 'Kerbau',
    emoji: '🐂',
    jalur: 3,
    numbers: ['06', '18', '30', '42', '54', '66', '78', '90']
  },
  {
    no: 7,
    name: 'Tikus',
    emoji: '🐀',
    jalur: 1,
    numbers: ['07', '19', '31', '43', '55', '67', '79', '91']
  },
  {
    no: 8,
    name: 'Babi',
    emoji: '🐷',
    jalur: 2,
    numbers: ['08', '20', '32', '44', '56', '68', '80', '92']
  },
  {
    no: 9,
    name: 'Anjing',
    emoji: '🐶',
    jalur: 3,
    numbers: ['09', '21', '33', '45', '57', '69', '81', '93']
  },
  {
    no: 10,
    name: 'Ayam',
    emoji: '🐔',
    jalur: 1,
    numbers: ['10', '22', '34', '46', '58', '70', '82', '94']
  },
  {
    no: 11,
    name: 'Monyet',
    emoji: '🐵',
    jalur: 2,
    numbers: ['11', '23', '35', '47', '59', '71', '83', '95']
  },
  {
    no: 12,
    name: 'Kambing',
    emoji: '🐐',
    jalur: 3,
    numbers: ['12', '24', '36', '48', '60', '72', '84', '96']
  }
];

export const JALUR_SHIO_MAP: Record<1 | 2 | 3, number[]> = {
  1: [1, 4, 7, 10],
  2: [2, 5, 8, 11],
  3: [3, 6, 9, 12]
};

// Pemetaan cepat O(1) dari 2D string ('00'..'99') ke ShioInfo
const NUM_TO_SHIO_CACHE: Record<string, ShioInfo> = {};
SHIO_2026_LIST.forEach((s) => {
  s.numbers.forEach((numStr) => {
    NUM_TO_SHIO_CACHE[numStr] = s;
  });
});

/**
 * Mendapatkan informasi Shio 2026 dari nilai 2D (angka number atau string format '00'-'99')
 */
export function getShioFor2D(val2D: number | string): ShioInfo {
  let numStr = typeof val2D === 'number' ? val2D.toString().padStart(2, '0') : val2D;
  if (numStr.length === 1) numStr = '0' + numStr;
  
  if (NUM_TO_SHIO_CACHE[numStr]) {
    return NUM_TO_SHIO_CACHE[numStr];
  }

  // Fallback formula modulo 12
  let val = parseInt(numStr, 10);
  if (isNaN(val)) return SHIO_2026_LIST[0];
  if (val === 0) val = 100;
  let rem = val % 12;
  if (rem === 0) rem = 12;
  return SHIO_2026_LIST[rem - 1];
}

/**
 * Mendapatkan ShioInfo berdasarkan nomor shio (1..12)
 */
export function getShioByNumber(no: number): ShioInfo {
  const found = SHIO_2026_LIST.find((s) => s.no === no);
  return found || SHIO_2026_LIST[0];
}

/**
 * Mendapatkan Jalur Shio (1, 2, atau 3) dari nomor shio
 */
export function getJalurForShio(no: number): 1 | 2 | 3 {
  const s = getShioByNumber(no);
  return s.jalur;
}
