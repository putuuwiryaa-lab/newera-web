import React, { useState } from 'react';
import type { EvaluationMetrics } from '../engine/types';
import { TrendingUp, Award, Zap, AlertTriangle, HelpCircle, Sparkles, Layers } from 'lucide-react';

interface EvaluationPanelProps {
  metrics: EvaluationMetrics | null;
  marketName: string;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  metrics,
  marketName
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'ai' | 'bbfs'>('all');

  if (!metrics) {
    return (
      <div className="glass-panel border border-white/[0.08] rounded-2xl p-8 text-center text-slate-400 text-sm">
        Sedang menghitung evaluasi walk-forward out-of-sample...
      </div>
    );
  }

  const { totalDraws, testDraws, twinCount, twinRate, aiStats, bbfsStats, ai4Streak } = metrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info Evaluasi */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Evaluasi Walk-Forward Out-of-Sample
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-mono border border-white/[0.08]">
                  {marketName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulasi backtesting ketat bergulir 1 putaran demi 1 putaran tanpa kebocoran data masa depan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-slate-400 font-mono">
              Total: <strong className="text-slate-200">{totalDraws}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-slate-400 font-mono">
              Warm-up: <strong className="text-slate-200">50</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono font-semibold">
              Diuji: {testDraws} Putaran
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 font-mono">
              Twin 2D: <strong className="text-rose-200">{twinCount}x ({twinRate}%)</strong>
            </span>
          </div>
        </div>

        {/* Streak Stat Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-3.5 flex items-center space-x-3 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Win-Streak Tertinggi AI-4</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {ai4Streak.maxWin}x <span className="text-xs font-normal text-slate-500">berturut</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl p-3.5 flex items-center space-x-3 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Lose-Streak Tertinggi AI-4</div>
              <div className="text-lg font-bold font-mono text-rose-400">
                {ai4Streak.maxLose}x <span className="text-xs font-normal text-slate-500">berturut</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-3.5 flex items-center space-x-3 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Status Streak Terkini</div>
              <div className="text-lg font-bold font-mono text-cyan-400">
                {ai4Streak.current > 0
                  ? `+${ai4Streak.current}x Menang`
                  : `${ai4Streak.current}x Kalah`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Filter Switcher Bar */}
      <div className="flex items-center justify-between bg-slate-900/70 border border-white/[0.08] p-2.5 rounded-2xl backdrop-blur-sm">
        <div className="text-xs font-semibold text-slate-300 ml-2">
          Domain Evaluasi:
        </div>
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua (AI & BBFS)
          </button>
          <button
            onClick={() => setFilterMode('ai')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterMode === 'ai'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Angka Ikut AI</span>
          </button>
          <button
            onClick={() => setFilterMode('bbfs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterMode === 'bbfs'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>BBFS 2D</span>
          </button>
        </div>
      </div>

      {/* Tabel Evaluasi AI & BBFS */}
      <div className={`grid gap-6 ${filterMode === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* TABEL AI */}
        {(filterMode === 'all' || filterMode === 'ai') && (
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                <h4 className="text-sm font-semibold text-white">
                  Akurasi Riil Angka Ikut (AI)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/25">
                Target: Min 1 Digit di 2D
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-medium">Tier</th>
                    <th className="pb-2.5 font-medium">Hit</th>
                    <th className="pb-2.5 font-medium">Miss</th>
                    <th className="pb-2.5 font-medium">Akurasi Riil</th>
                    <th className="pb-2.5 font-medium">Teoretis Acak</th>
                    <th className="pb-2.5 text-right font-medium">Edge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono">
                  {[3, 4, 5, 6].map((size) => {
                    const s = aiStats[size];
                    if (!s) return null;
                    const misses = testDraws - s.hitCount;
                    const isPositive = s.diff >= 0;

                    return (
                      <tr
                        key={size}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          size === 4 ? 'bg-cyan-500/[0.06] font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 font-semibold text-slate-200 flex items-center space-x-1.5">
                          <span>AI-{size}</span>
                          {size === 4 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-sans font-medium">
                              Utama
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-emerald-400 font-semibold">
                          {s.hitCount}x
                        </td>
                        <td className="py-3 text-rose-400">
                          {misses}x
                        </td>
                        <td className="py-3 font-semibold text-white">
                          <span className="text-cyan-300 font-mono text-sm">{s.actualRate}%</span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {s.baselineRate}%
                        </td>
                        <td className="py-3 text-right font-semibold">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                            }`}
                          >
                            {isPositive ? `+${s.diff}%` : `${s.diff}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABEL BBFS */}
        {(filterMode === 'all' || filterMode === 'bbfs') && (
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                <h4 className="text-sm font-semibold text-white">
                  Akurasi Riil BBFS 2D Belakang
                </h4>
              </div>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/25">
                Aturan: Non-Twin Only
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-medium">Tier</th>
                    <th className="pb-2.5 font-medium">Line</th>
                    <th className="pb-2.5 font-medium">Akurasi Riil</th>
                    <th className="pb-2.5 font-medium">Teoretis</th>
                    <th className="pb-2.5 font-medium">Edge</th>
                    <th className="pb-2.5 text-right font-medium">PnL Sim.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono">
                  {[6, 7, 8, 9].map((size) => {
                    const s = bbfsStats[size];
                    if (!s) return null;
                    const isPositive = s.diff >= 0;

                    return (
                      <tr
                        key={size}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          size === 7 ? 'bg-purple-500/[0.06] font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 font-semibold text-purple-300 flex items-center space-x-1.5">
                          <span>BBFS-{size}</span>
                          {size === 7 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 font-sans font-medium">
                              Utama
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">
                          {s.lines} line
                        </td>
                        <td className="py-3 font-semibold text-white">
                          <span className="text-purple-300 font-mono text-sm">{s.actualRate}%</span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {s.baselineRate}%
                        </td>
                        <td className="py-3 font-semibold">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                            }`}
                          >
                            {isPositive ? `+${s.diff}%` : `${s.diff}%`}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold">
                          <span className={s.pnlNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            Rp {s.pnlNet.toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Catatan Ilmiah / Alert Edukatif */}
      <div className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 text-xs text-slate-400 shadow-xl backdrop-blur-sm">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <strong className="text-slate-200 text-sm block mb-1 font-semibold">
            Wawasan Probabilitas Evaluasi Finansial:
          </strong>
          Meskipun akurasi mentah BBFS-8 atau BBFS-9 mencapai 55%–75%, simulasi finansial menunjukkan akumulasi kerugian yang jauh lebih besar karena biaya modal (56–72 line per pasang) memakan margin kemenangan. Gunakan <strong className="text-slate-200">BBFS-7</strong> dipadu dengan <strong className="text-slate-200">Smart Trimmer (Top 10 Line Bom)</strong> untuk memaksimalkan Expected Value (EV) positif dan meminimalkan risiko drawdown.
        </div>
      </div>
    </div>
  );
};


