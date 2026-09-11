import React from 'react';
import { Activity, BarChart3, ShieldCheck, Target } from 'lucide-react';

interface RateMetric {
  hits: number;
  tested: number;
  hit_rate_pct: number;
  baseline_pct: number;
  lift_pp: number;
  ci95_pct: [number, number];
  brier_score?: number;
}

interface ProductionEvaluation {
  evaluator_version: string;
  engine_version: string;
  basis_draw_count: number;
  basis_last_draw: string;
  tested_draws: number;
  replay_draws: number;
  live_draws: number;
  twin_count: number;
  twin_rate_pct: number;
  ai_stats: Record<string, RateMetric>;
  bbfs_stats: Record<string, RateMetric>;
  paito_stats: Record<string, RateMetric>;
  sniper_stats?: RateMetric & {
    active_draws?: number;
    participation_rate_pct?: number;
    top_hits?: number;
    secondary_hits?: number;
    super_hits?: number;
  };
}

interface Props {
  metrics: ProductionEvaluation | null;
  marketName: string;
}

const MetricRow: React.FC<{ label: string; metric?: RateMetric; showBrier?: boolean }> = ({
  label,
  metric,
  showBrier = false
}) => {
  if (!metric) return null;
  const positive = metric.lift_pp >= 0;
  const [ciLow = 0, ciHigh = 0] = metric.ci95_pct || [0, 0];
  const evidence = ciLow > metric.baseline_pct
    ? 'POSITIVE'
    : ciHigh < metric.baseline_pct
      ? 'NEGATIVE'
      : 'INCONCLUSIVE';
  const evidenceClass = evidence === 'POSITIVE'
    ? 'text-emerald-400'
    : evidence === 'NEGATIVE'
      ? 'text-rose-400'
      : 'text-slate-500';
  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="py-2.5 text-slate-200 font-medium">{label}</td>
      <td className="py-2.5 text-right font-mono text-slate-300">{metric.hits}/{metric.tested}</td>
      <td className="py-2.5 text-right font-mono text-white font-semibold">{metric.hit_rate_pct}%</td>
      <td className="py-2.5 text-right font-mono text-slate-400">{metric.baseline_pct}%</td>
      <td className={`py-2.5 text-right font-mono font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {positive ? '+' : ''}{metric.lift_pp} pp
      </td>
      <td className="py-2.5 text-right font-mono text-slate-500">
        {metric.ci95_pct?.[0] ?? 0}–{metric.ci95_pct?.[1] ?? 0}%
      </td>
      <td className={`py-2.5 text-right font-mono text-[10px] ${evidenceClass}`}>
        {evidence === 'POSITIVE' ? 'Positive' : evidence === 'NEGATIVE' ? 'Negative' : 'Inconclusive'}
      </td>
      {showBrier && (
        <td className="py-2.5 text-right font-mono text-amber-300">
          {typeof metric.brier_score === 'number' ? metric.brier_score.toFixed(4) : '—'}
        </td>
      )}
    </tr>
  );
};

export const ProductionEvaluationPanel: React.FC<Props> = ({ metrics, marketName }) => {
  if (!metrics) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-sm text-slate-400">
        Evaluasi production backend belum tersedia untuk basis history aktif. Diagnostik lokal tetap ditampilkan di bawah.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-white">Evaluasi Production Backend Python</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  {marketName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lifecycle engine production yang sama; replay historis dipisahkan dari draw production live.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-slate-300">
              Tested {metrics.tested_draws}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-slate-400">
              Replay {metrics.replay_draws} • Live {metrics.live_draws}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
              Twin {metrics.twin_count} ({metrics.twin_rate_pct}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">AI Production</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500 font-mono text-[10px] uppercase">
                <tr><th className="text-left pb-2">Tier</th><th className="text-right pb-2">Hit</th><th className="text-right pb-2">Rate</th><th className="text-right pb-2">Baseline</th><th className="text-right pb-2">Lift</th><th className="text-right pb-2">95% CI</th><th className="text-right pb-2">Evidence</th></tr>
              </thead>
              <tbody>
                {[3,4,5,6].map((tier) => <MetricRow key={tier} label={`AI-${tier}`} metric={metrics.ai_stats?.[String(tier)]} />)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">BBFS Production</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500 font-mono text-[10px] uppercase">
                <tr><th className="text-left pb-2">Tier</th><th className="text-right pb-2">Hit</th><th className="text-right pb-2">Rate</th><th className="text-right pb-2">Baseline</th><th className="text-right pb-2">Lift</th><th className="text-right pb-2">95% CI</th><th className="text-right pb-2">Evidence</th></tr>
              </thead>
              <tbody>
                {[6,7,8,9].map((tier) => <MetricRow key={tier} label={`BBFS-${tier}`} metric={metrics.bbfs_stats?.[String(tier)]} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <div>
            <h4 className="text-sm font-semibold text-white">Paito Calibration Quality</h4>
            <p className="text-[11px] text-slate-500">Brier lebih kecil lebih baik; Evidence baru dianggap Positive/Negative jika baseline berada di luar Wilson 95% CI. Selain itu = Inconclusive.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-500 font-mono text-[10px] uppercase">
              <tr><th className="text-left pb-2">Domain</th><th className="text-right pb-2">Hit</th><th className="text-right pb-2">Rate</th><th className="text-right pb-2">Baseline</th><th className="text-right pb-2">Lift</th><th className="text-right pb-2">95% CI</th><th className="text-right pb-2">Evidence</th><th className="text-right pb-2">Brier</th></tr>
            </thead>
            <tbody>
              <MetricRow label="Biji Top" metric={metrics.paito_stats?.biji} showBrier />
              <MetricRow label="Parity" metric={metrics.paito_stats?.parity} showBrier />
              <MetricRow label="Besar/Kecil" metric={metrics.paito_stats?.magnitude} showBrier />
              <MetricRow label="Shio Top" metric={metrics.paito_stats?.shio} showBrier />
              <MetricRow label="Jalur" metric={metrics.paito_stats?.jalur} showBrier />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
