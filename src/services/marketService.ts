import type { Market, HistoryItem } from '../engine/types';
import { getShioFor2D } from '../engine/shio';
import initialMarketsData from './initialMarkets.json';

const FIRESTORE_REST_BASE =
  'https://firestore.googleapis.com/v1/projects/newera-94be7/databases/(default)/documents/markets';

export interface MarketServiceResult {
  markets: Market[];
  source: 'live' | 'cached';
  error?: string;
}

export async function fetchAllMarkets(): Promise<MarketServiceResult> {
  const localMap: Record<string, Market> = initialMarketsData as unknown as Record<string, Market>;
  let marketsList: Market[] = Object.values(localMap).sort(
    (a, b) => a.order - b.order
  );

  try {
    const res = await fetch(FIRESTORE_REST_BASE, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        const liveMarkets: Market[] = data.documents.map((doc: any) => {
          const f = doc.fields || {};
          const id = f.id?.stringValue || doc.name.split('/').pop();
          const historyDaysVal = f.history_days?.stringValue ||
            (f.history_days?.arrayValue ? f.history_days.arrayValue.values?.map((v: any) => v.stringValue).join(' ') : '') || '';

          return {
            id,
            name: f.name?.stringValue || id,
            history_data: f.history_data?.stringValue || '',
            history_days: historyDaysVal,
            order: parseInt(f.order?.integerValue || '99', 10),
            updated_at: f.updated_at?.stringValue || ''
          };
        });

        if (liveMarkets.length > 0) {
          liveMarkets.sort((a, b) => a.order - b.order);
          return { markets: liveMarkets, source: 'live' };
        }
      }
    }
  } catch {
    // Fallback silent ke cached data
  }

  return { markets: marketsList, source: 'cached' };
}

/**
 * Helper default pola urutan hari per minggu jika pasaran belum memiliki history_days tersimpan
 */
export function getDefaultDaysForMarket(marketName: string = ''): string[] {
  const m = marketName.toLowerCase();
  if (m.includes('sgp') || m.includes('singapore')) {
    return ['Senin', 'Rabu', 'Kamis', 'Sabtu', 'Minggu'];
  }
  if (m.includes('pcso')) {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  }
  return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
}

/**
 * Parsing history_data string ke HistoryItem array untuk tabel paito & analisis
 */
export function parseHistoryItems(
  historyStr: string,
  historyDays?: string | string[],
  marketName: string = ''
): HistoryItem[] {
  const tokens = historyStr.trim().split(/\s+/).filter((t) => t.length === 4 && /^\d{4}$/.test(t));

  let daysList: string[] = [];
  if (Array.isArray(historyDays)) {
    daysList = historyDays;
  } else if (typeof historyDays === 'string' && historyDays.trim()) {
    daysList = historyDays.trim().split(/\s+/);
  }

  const defaultSchema = getDefaultDaysForMarket(marketName);

  return tokens.map((full, idx) => {
    const as = parseInt(full[0], 10);
    const kop = parseInt(full[1], 10);
    const kepala = parseInt(full[2], 10);
    const ekor = parseInt(full[3], 10);
    const isTwin = kepala === ekor;

    // Hitung Biji / Jumlah 2D: (Kepala + Ekor) disederhanakan ke 1 digit
    let sum = kepala + ekor;
    while (sum >= 10) {
      sum = Math.floor(sum / 10) + (sum % 10);
    }

    const val2D = kepala * 10 + ekor;
    const besarKecil = val2D >= 50 ? 'Besar' : 'Kecil';

    const kGenap = kepala % 2 === 0;
    const eGenap = ekor % 2 === 0;
    const ganjilGenap = `${kGenap ? 'Genap' : 'Ganjil'}-${eGenap ? 'Genap' : 'Ganjil'}`;

    const shio = getShioFor2D(val2D);

    // Gunakan hari riil dari scraper jika ada, atau fallback ke default pola pasar
    const day = daysList[idx] || defaultSchema[idx % defaultSchema.length];

    return {
      index: idx + 1,
      full,
      as,
      kop,
      kepala,
      ekor,
      isTwin,
      biji: sum,
      besarKecil,
      ganjilGenap,
      shio,
      shioName: shio.name,
      shioNumber: shio.no,
      shioEmoji: shio.emoji,
      shioJalur: shio.jalur,
      day
    };
  });
}
