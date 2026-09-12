export const PRODUCTION_ENGINE_VERSION = '2026.09.11-v2';
export const PRODUCTION_EVALUATOR_VERSION = '2026.09.11-v2-prod-eval-v1';
export const HEALTH_VERSION = '2026.09.11-health-v1';
export const MAX_CHECK_AGE_MS = 26 * 60 * 60 * 1000;
export const AI_SIZES = [3, 4, 5, 6] as const;
export const BBFS_SIZES = [6, 7, 8, 9] as const;
export const METHODS = ['Momentum', 'Markov', 'Delta', 'Mistik'];
export const FACTORS = ['Densitas Pasangan', 'Transisi Markov', 'Momentum Posisi', 'Coverage Proteksi'];
export const PARITIES = ['Genap-Genap', 'Genap-Ganjil', 'Ganjil-Genap', 'Ganjil-Ganjil'];
export const isRecord = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
export const isCount = (v: any): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
export const isFiniteNumber = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);
export const validDigits = (v: any, n: number, low = 0, high = 9): v is number[] =>
  Array.isArray(v) && v.length === n && new Set(v).size === n && v.every(d => isCount(d) && d >= low && d <= high);

export function predictionIntegrityErrors(p: any): string[] {
  if (!isRecord(p)) return ['prediction.missing'];
  const errors: string[] = [];
  for (const [family, sizes] of [['ai', AI_SIZES], ['bbfs', BBFS_SIZES]] as const) {
    for (const n of sizes) if (!validDigits(p[`${family}${n}`], n)) errors.push(`prediction.${family}${n}`);
  }
  if (!validDigits(p.dead_digits, 2)) errors.push('prediction.dead_digits');
  for (const [name, sizes, keys] of [['tier_method_weights', AI_SIZES, METHODS], ['bbfs_tier_weights', BBFS_SIZES, FACTORS]] as const) {
    for (const n of sizes) {
      const row = p[name]?.[n];
      if (!isRecord(row) || Object.keys(row).length !== keys.length || !keys.every(k => isFiniteNumber(row[k]) && row[k] >= 0)
        || Object.values(row).reduce((a, b) => a + b, 0) <= 0) errors.push(`prediction.${name}.${n}`);
    }
  }
  const sp = p.paito;
  if (!isRecord(sp)) errors.push('prediction.paito');
  else {
    if (!validDigits(sp.top_biji, 3)) errors.push('prediction.paito.top_biji');
    if (!validDigits(sp.top_shios, 3, 1, 12)) errors.push('prediction.paito.top_shios');
    for (const [key, choices] of [['primary_parity', PARITIES], ['primary_magnitude', ['Besar', 'Kecil']], ['primary_jalur', [1, 2, 3]]] as const) {
      if (!(choices as readonly unknown[]).includes(sp[key])) errors.push(`prediction.paito.${key}`);
    }
    for (const [name, keys] of [
      ['biji', Array.from({ length: 10 }, (_, i) => String(i))], ['parity', PARITIES],
      ['magnitude', ['Besar', 'Kecil']], ['shio', Array.from({ length: 12 }, (_, i) => String(i + 1))], ['jalur', ['1', '2', '3']]
    ] as const) {
      const row = sp[`${name}_probabilities`];
      if (!isRecord(row) || Object.keys(row).length !== keys.length || !keys.every(k => isFiniteNumber(row[k]) && row[k] >= 0 && row[k] <= 1)
        || Math.abs(Object.values(row).reduce((a, b) => a + b, 0) - 1) > 1e-8) errors.push(`prediction.paito.${name}_probabilities`);
    }
    if (!isFiniteNumber(sp.confidence_score) || sp.confidence_score < 0 || sp.confidence_score > 100) errors.push('prediction.paito.confidence_score');
  }
  if (p.tier_ranked_digits !== undefined) for (const n of AI_SIZES) {
    const row = p.tier_ranked_digits?.[n];
    if (!validDigits(row, 10) || JSON.stringify(row.slice(0, n)) !== JSON.stringify(p[`ai${n}`])) errors.push(`prediction.tier_ranked_digits.${n}`);
  }
  const lines = (container: any, key: string, n: number, width = 2) => {
    const row = container?.[key];
    if (!Array.isArray(row) || row.length !== n || new Set(row).size !== n || !row.every(v => typeof v === 'string' && v.length === width && /^\d+$/.test(v))) errors.push(`prediction.lines.${key}`);
  };
  for (const name of ['ranked_kepala', 'ranked_ekor']) if (!validDigits(p.pola_tarung?.[name], 10)) errors.push(`prediction.pola_tarung.${name}`);
  for (const n of [3, 4, 5]) lines(p.pola_tarung, `tarung_${n}x${n}`, n * n);
  if (!validDigits(p.paito_bbfs7?.digits, 7)) errors.push('prediction.paito_bbfs7.digits');
  for (const [key, n] of [['nuklir6', 6], ['bom12', 12], ['invest20', 20], ['full42', 42], ['twin7', 7]] as const) lines(p.paito_bbfs7, key, n);
  for (const [key, n, width] of [['wheel_3d', 15, 3], ['wheel_3d_full', 35, 3], ['wheel_4d', 14, 4], ['wheel_4d_full', 35, 4]] as const) lines(p.wheeling7, key, n, width);
  return errors;
}

export function matchesBasis(p: any, history: string[]): boolean {
  return isRecord(p) && history.length > 0 && p.engine_version === PRODUCTION_ENGINE_VERSION
    && isCount(p.basis_draw_count) && p.basis_draw_count === history.length && p.basis_last_draw === history.at(-1);
}
