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

/** Decode generic Firestore REST Value recursively. */
function decodeFirestoreValue(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue?.values || []).map((v: any) => decodeFirestoreValue(v));
  }
  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, child]) => [key, decodeFirestoreValue(child)])
    );
  }
  return undefined;
}

async function fetchAllFirestoreDocuments(): Promise<any[]> {
  const documents: any[] = [];
  let pageToken = '';

  // pageSize besar mengurangi round-trip, tetapi nextPageToken tetap diikuti
  // karena Firestore boleh mengembalikan lebih sedikit dari pageSize.
  for (let page = 0; page < 20; page++) {
    const url = new URL(FIRESTORE_REST_BASE);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Firestore REST ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data.documents)) documents.push(...data.documents);

    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
    if (!pageToken) return documents;
  }

  throw new Error('Firestore pagination incomplete');
}

export async function fetchAllMarkets(): Promise<MarketServiceResult> {
  const localMap: Record<string, Market> = initialMarketsData as unknown as Record<string, Market>;
  const marketsList: Market[] = Object.values(localMap).sort((a, b) => a.order - b.order);

  try {
    const documents = await fetchAllFirestoreDocuments();
    if (documents.length > 0) {
      const liveMarkets: Market[] = documents.map((doc: any) => {
        const f = doc.fields || {};
        const id = f.id?.stringValue || doc.name.split('/').pop();
        const decodedDays = decodeFirestoreValue(f.history_days);
        const historyDaysVal = Array.isArray(decodedDays)
          ? decodedDays.map(String)
          : typeof decodedDays === 'string'
            ? decodedDays
            : '';

        const nextPrediction = decodeFirestoreValue(f.next_prediction);
        const legacyPrediction = decodeFirestoreValue(f.latest_prediction);
        const lastAudit = decodeFirestoreValue(f.last_audit);
        const productionEvaluation = decodeFirestoreValue(f.production_evaluation);

        return {
          id,
          name: f.name?.stringValue || id,
          history_data: f.history_data?.stringValue || '',
          history_days: historyDaysVal,
          order: Number(f.order?.integerValue || 99),
          updated_at: f.updated_at?.stringValue || '',
          next_prediction: nextPrediction || undefined,
          latest_prediction: legacyPrediction || undefined,
          last_audit: lastAudit || undefined,
          production_evaluation: productionEvaluation || undefined,
          production_health: decodeFirestoreValue(f.production_health),
          last_checked_at: decodeFirestoreValue(f.last_checked_at),
          health_error: decodeFirestoreValue(f.health_error),
          evaluation_blocked_reason: decodeFirestoreValue(f.evaluation_blocked_reason),
          data_source: 'live'
        };
      });

      liveMarkets.sort((a, b) => a.order - b.order);
      return { markets: liveMarkets, source: 'live' };
    }
  } catch (error) {
    return { markets: marketsList.map(m => ({ ...m, data_source: 'cached' })), source: 'cached', error: error instanceof Error ? error.message : 'Firestore unavailable' };
  }

  return { markets: marketsList.map(m => ({ ...m, data_source: 'cached' })), source: 'cached', error: 'Firestore returned no markets' };
}

/** Helper default pola urutan hari per minggu jika history_days belum tersedia. */
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

/** Parsing history_data string ke HistoryItem array untuk tabel paito & analisis. */
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
