import type { Market } from './types';
import type { ParityResult } from './engineParity';
import { AI_SIZES, BBFS_SIZES, HEALTH_VERSION, MAX_CHECK_AGE_MS, PRODUCTION_ENGINE_VERSION, PRODUCTION_EVALUATOR_VERSION, isRecord, isCount, isFiniteNumber, predictionIntegrityErrors } from './productionContract';

export type HealthStatus = 'HEALTHY' | 'STALE' | 'DRIFT' | 'ERROR';
export interface HealthCheck { code: string; status: HealthStatus; detail: string }
export interface MarketHealth { status: HealthStatus; checks: HealthCheck[]; productionSource: 'python'; parity?: ParityResult }
const severity: Record<HealthStatus, number> = { HEALTHY: 0, STALE: 1, DRIFT: 2, ERROR: 3 };
const PAITO = ['biji', 'parity', 'magnitude', 'shio', 'jalur'];

/** Verify live/replay isolation and every public metric against its raw counters. */
export function evaluationIntegrityErrors(state: any, allowLegacyEmptyLive = false): string[] {
  if (!isRecord(state?.accumulators)) return ['evaluation.accumulators.missing'];
  if (allowLegacyEmptyLive && state.live_draws === 0 && state.accumulators.live_draws === 0 && state.accumulators.live_only === undefined && state.prospective === undefined) {
    const live = {
      tested: 0, twins: 0, replay_draws: 0, live_draws: 0,
      ai: Object.fromEntries(AI_SIZES.map(n => [n, { hits: 0 }])),
      bbfs: Object.fromEntries(BBFS_SIZES.map(n => [n, { hits: 0 }])),
      paito: Object.fromEntries(PAITO.map(k => [k, { hits: 0, baseline_sum: 0, brier_sum: 0 }])),
      trimmer: { bom10: 0, medium15: 0, cadangan: 0, missed: 0 },
      sniper: { active_draws: 0, any_hits: 0, top_hits: 0, secondary_hits: 0, super_hits: 0, baseline_sum: 0 }
    };
    return evaluationIntegrityErrors({ ...state, accumulators: { ...state.accumulators, live_only: live }, prospective: {
      tested_draws: 0, twin_count: 0, minimum_draws: 30, ready: false,
      ai_stats: {}, bbfs_stats: {}, paito_stats: {}, trimmer_stats: {}, sniper_stats: {}
    } });
  }
  const errors: string[] = [];
  const acc = state.accumulators;
  function bucket(raw: any, path: string, isolated: boolean): boolean {
    const start = errors.length;
    if (!isRecord(raw)) { errors.push(path); return false; }
    const n = raw.tested;
    if (!['tested', 'twins', 'replay_draws', 'live_draws'].every(k => isCount(raw[k])) || raw.twins > n
      || (isolated ? raw.replay_draws !== 0 || raw.live_draws !== 0 || raw.live_only !== undefined : n !== raw.replay_draws + raw.live_draws)) errors.push(`${path}.counts`);
    for (const [family, keys] of [['ai', AI_SIZES], ['bbfs', BBFS_SIZES], ['paito', PAITO]] as const) {
      if (!isRecord(raw[family]) || Object.keys(raw[family]).length !== keys.length) errors.push(`${path}.${family}.schema`);
      for (const key of keys) {
        const row = raw[family]?.[key];
        if (!isRecord(row) || !isCount(row.hits) || row.hits > n || (family === 'bbfs' && row.hits > n - raw.twins)) errors.push(`${path}.${family}.${key}.hits`);
        if (family === 'paito' && (!isFiniteNumber(row?.baseline_sum) || row.baseline_sum < 0 || row.baseline_sum > n + 1e-8
          || !isFiniteNumber(row?.brier_sum) || row.brier_sum < 0 || row.brier_sum > 2 * n + 1e-8)) errors.push(`${path}.paito.${key}.sums`);
      }
    }
    const trim = raw.trimmer;
    const trimKeys = ['bom10', 'medium15', 'cadangan', 'missed'];
    if (!isRecord(trim) || !trimKeys.every(k => isCount(trim[k])) || trimKeys.reduce((s, k) => s + trim[k], 0) !== n) errors.push(`${path}.trimmer.total`);
    const sn = raw.sniper;
    if (!isRecord(sn) || !['active_draws', 'any_hits', 'top_hits', 'secondary_hits', 'super_hits'].every(k => isCount(sn[k]))
      || !(sn.super_hits <= sn.top_hits && sn.top_hits <= sn.any_hits && sn.any_hits <= sn.active_draws && sn.active_draws <= n)
      || sn.top_hits + sn.secondary_hits !== sn.any_hits || !isFiniteNumber(sn.baseline_sum) || sn.baseline_sum < 0 || sn.baseline_sum > sn.active_draws + 1e-8) errors.push(`${path}.sniper.counts`);
    return errors.length === start;
  }
  const good = bucket(acc, 'evaluation.accumulators', false);
  const live = acc.live_only;
  const liveGood = bucket(live, 'evaluation.prospective', true);
  if (!isCount(state.basis_draw_count) || !isCount(state.replay_window_draws) || !/^\d{4}$/.test(state.basis_last_draw ?? '')) errors.push('evaluation.basis');
  if (!isCount(state.unscored_draws ?? 0) || acc.tested > state.basis_draw_count) errors.push('evaluation.count_bounds');
  if (!good || !liveGood) return errors;
  if (live.tested !== acc.live_draws) errors.push('evaluation.prospective.live_count');
  function subset(child: any, parent: any) {
    for (const [key, value] of Object.entries(child)) {
      if (['tested', 'replay_draws', 'live_draws'].includes(key)) continue;
      if (isRecord(value)) subset(value, parent[key] ?? {});
      else if (!isFiniteNumber(parent[key]) || !isFiniteNumber(value) || value > parent[key] + 1e-8) errors.push('evaluation.prospective.subset');
    }
  }
  subset(live, acc);
  const close = (a: any, b: number, tolerance = 0.005001) => isFiniteNumber(a) && Math.abs(a - b) <= tolerance;
  function metric(m: any, hits: number, n: number, baselineSum: number, path: string) {
    const rate = n ? hits / n : 0;
    const base = n ? baselineSum / n : 0;
    let low = 0, high = 0;
    if (n) {
      const z2 = 1.96 ** 2, den = 1 + z2 / n;
      const center = (rate + z2 / (2 * n)) / den;
      const margin = 1.96 * Math.sqrt((rate * (1 - rate) + z2 / (4 * n)) / n) / den;
      low = Math.max(0, center - margin) * 100; high = Math.min(1, center + margin) * 100;
    }
    if (!isRecord(m) || m.hits !== hits || m.tested !== n || !close(m.hit_rate_pct, rate * 100) || !close(m.baseline_pct, base * 100)
      || !close(m.lift_pp, (rate - base) * 100) || !Array.isArray(m.ci95_pct) || m.ci95_pct.length !== 2
      || !close(m.ci95_pct[0], low) || !close(m.ci95_pct[1], high)) errors.push(`${path}.projection`);
  }
  function projection(output: any, raw: any, path: string) {
    if (!isRecord(output)) { errors.push(`${path}.missing`); return; }
    const n = raw.tested;
    if (output.tested_draws !== n || output.twin_count !== raw.twins) errors.push(`${path}.counts`);
    for (const tier of AI_SIZES) metric(output.ai_stats?.[tier], raw.ai[tier].hits, n, (1 - ((10 - tier) / 10) ** 2) * n, `${path}.ai.${tier}`);
    for (const tier of BBFS_SIZES) metric(output.bbfs_stats?.[tier], raw.bbfs[tier].hits, n, tier * (tier - 1) / 100 * n, `${path}.bbfs.${tier}`);
    for (const key of PAITO) {
      metric(output.paito_stats?.[key], raw.paito[key].hits, n, raw.paito[key].baseline_sum, `${path}.paito.${key}`);
      if (!close(output.paito_stats?.[key]?.brier_score, n ? raw.paito[key].brier_sum / n : 0, 0.000000501)) errors.push(`${path}.paito.${key}.brier`);
    }
    if (!['bom10', 'medium15', 'cadangan', 'missed'].every(k => output.trimmer_stats?.[k] === raw.trimmer[k])) errors.push(`${path}.trimmer.projection`);
    const sn = raw.sniper;
    metric(output.sniper_stats, sn.any_hits, sn.active_draws, sn.baseline_sum, `${path}.sniper`);
    if (!['active_draws', 'top_hits', 'secondary_hits', 'super_hits'].every(k => output.sniper_stats?.[k] === sn[k])
      || !close(output.sniper_stats?.participation_rate_pct, n ? sn.active_draws / n * 100 : 0)) errors.push(`${path}.sniper.projection`);
  }
  projection(state, acc, 'evaluation');
  if (state.replay_draws !== acc.replay_draws || state.live_draws !== acc.live_draws
    || !close(state.twin_rate_pct, acc.tested ? acc.twins / acc.tested * 100 : 0)) errors.push('evaluation.counts');
  if (state.prospective?.tested_draws !== live.tested || state.prospective?.twin_count !== live.twins
    || state.prospective?.minimum_draws !== 30 || state.prospective?.ready !== (live.tested >= 30)) errors.push('evaluation.prospective.readiness');
  if (live.tested) projection(state.prospective, live, 'evaluation.prospective');
  else if (!['ai_stats', 'bbfs_stats', 'paito_stats', 'trimmer_stats', 'sniper_stats'].every(k => isRecord(state.prospective?.[k]) && Object.keys(state.prospective[k]).length === 0)) errors.push('evaluation.prospective.empty');
  return [...new Set(errors)];
}

export function assessMarketHealth(market: Market, now = Date.now(), parity?: ParityResult): MarketHealth {
  const checks: HealthCheck[] = [];
  const add = (code: string, status: HealthStatus, detail: string) => checks.push({ code, status, detail });
  const history = market.history_data.trim().split(/\s+/).filter(Boolean);
  const valid = history.length > 0 && history.every(r => /^\d{4}$/.test(r));
  add('history', valid ? 'HEALTHY' : 'ERROR', `${history.length} draws`);
  if (market.data_source === 'cached') add('source', 'STALE', 'Cache/offline; production live tidak tersedia');
  for (const [name, obj] of [['prediction', market.next_prediction], ['evaluation', market.production_evaluation]] as const) {
    if (!isRecord(obj)) { add(`${name}.persisted_state`, 'STALE', 'State belum tersedia'); continue; }
    add(`${name}.engine_version`, obj.engine_version === PRODUCTION_ENGINE_VERSION ? 'HEALTHY' : 'DRIFT', String(obj.engine_version ?? 'missing'));
    if (name === 'evaluation') add('evaluation.evaluator_version', obj.evaluator_version === PRODUCTION_EVALUATOR_VERSION ? 'HEALTHY' : 'DRIFT', String(obj.evaluator_version ?? 'missing'));
    const n = obj.basis_draw_count;
    add(`${name}.basis_draw_count`, !isCount(n) ? 'ERROR' : n === history.length ? 'HEALTHY' : n < history.length ? 'STALE' : 'DRIFT', `${n}/${history.length}`);
    add(`${name}.basis_last_draw`, valid && obj.basis_last_draw === history.at(-1) ? 'HEALTHY' : isCount(n) && n < history.length ? 'STALE' : 'DRIFT', String(obj.basis_last_draw ?? 'missing'));
    const errors = name === 'prediction' ? predictionIntegrityErrors(obj) : evaluationIntegrityErrors(obj);
    const legacyEmpty = name === 'evaluation' && errors.length > 0 && evaluationIntegrityErrors(obj, true).length === 0;
    const integrityStatus = legacyEmpty ? 'STALE' : errors.length ? 'ERROR' : 'HEALTHY';
    add(`${name}.integrity`, integrityStatus, legacyEmpty ? 'Zero-live legacy state: migrasi holdout kosong menunggu scraper' : errors.join(', ') || 'Valid');
    if (name === 'evaluation') add('prospective.accumulator_integrity', integrityStatus, 'Counter live-only dan proyeksi evaluator diperiksa');
  }
  if (market.evaluation_blocked_reason) add('evaluation.quarantine', 'DRIFT', market.evaluation_blocked_reason);
  if (market.health_error) add('pipeline', 'ERROR', market.health_error);
  const age = now - Date.parse(market.last_checked_at || market.updated_at || '');
  add('pipeline.last_check', !Number.isFinite(age) || age > MAX_CHECK_AGE_MS ? 'STALE' : age < -300000 ? 'DRIFT' : 'HEALTHY', `Batas pemeriksaan scraper: ${MAX_CHECK_AGE_MS / 3600000} jam`);
  const saved = market.production_health;
  if (saved && saved.health_version !== HEALTH_VERSION) add('health.version', 'DRIFT', 'Versi health backend tidak dikenali');
  // Raw fields are revalidated; a saved HEALTHY badge never overrides fresher checks.
  if (saved?.status === 'ERROR') add('backend.health', 'ERROR', 'Backend melaporkan error');
  if (parity) add('engine.parity', parity.status === 'DRIFT' ? 'DRIFT' : parity.status === 'MATCH' ? 'HEALTHY' : 'STALE', `${parity.differingFields}/${parity.comparedFields} field berbeda`);
  return { status: checks.reduce((s, c) => severity[c.status] > severity[s] ? c.status : s, 'HEALTHY' as HealthStatus), checks, productionSource: 'python', parity };
}
