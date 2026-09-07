import type { Market, HistoryItem } from '../engine/types';
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
          return {
            id,
            name: f.name?.stringValue || id,
            history_data: f.history_data?.stringValue || '',
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
 * Parsing history_data string ke HistoryItem array untuk tabel paito & analisis
 */
export function parseHistoryItems(historyStr: string): HistoryItem[] {
  const tokens = historyStr.trim().split(/\s+/).filter((t) => t.length === 4 && /^\d{4}$/.test(t));
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
      ganjilGenap
    };
  });
}
