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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
        Sedang menghitung evaluasi walk-forward...
      </div>
    );
  }

  const { totalDraws, testDraws, twinCount, twinRate, aiStats, bbfsStats, ai4Streak } = metrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info Evaluasi */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                EVALUASI WALK-FORWARD OTOMATIS: {marketName}
              </h3>
              <p className="text-xs text-gray-400">
                Pengujian simulasi ketat tanpa bocoran masa depan (*out-of-sample backtesting*)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 font-mono">
              Total: <strong className="text-gray-200">{totalDraws}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 font-mono">
              Warm-up: <strong className="text-gray-200">50</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
              Diuji: <strong>{testDraws} Putaran</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 font-mono">
              Twin 2D: <strong>{twinCount}x ({twinRate}%)</strong>
            </span>
          </div>
        </div>

        {/* Streak Stat Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Win-Streak Maksimal AI-4</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {ai4Streak.maxWin}x <span className="text-xs font-normal text-gray-500">berturut</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Lose-Streak Maksimal AI-4</div>
              <div className="text-lg font-bold font-mono text-rose-400">
                {ai4Streak.maxLose}x <span className="text-xs font-normal text-gray-500">berturut</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Status Streak Terkini</div>
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
      <div className="flex items-center justify-between bg-gray-900/90 border border-gray-800 p-2.5 rounded-2xl">
        <div className="text-xs font-bold text-gray-300 ml-2">
          Pilih Domain Evaluasi:
        </div>
        <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Semua (AI & BBFS)
          </button>
          <button
            onClick={() => setFilterMode('ai')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'ai'
                ? 'bg-cyan-500 text-gray-950 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Angka Ikut AI</span>
          </button>
          <button
            onClick={() => setFilterMode('bbfs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'bbfs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
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
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                <span>Akurasi Riil Angka Ikut (AI)</span>
              </h4>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                Target: Min 1 Digit di 2D
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-mono uppercase text-[10px]">
                    <th className="pb-2.5">Tier</th>
                    <th className="pb-2.5">Hit</th>
                    <th className="pb-2.5">Miss</th>
                    <th className="pb-2.5">Akurasi Riil</th>
                    <th className="pb-2.5">Teoretis Acak</th>
                    <th className="pb-2.5 text-right">Edge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 font-mono">
                  {[3, 4, 5, 6].map((size) => {
                    const s = aiStats[size];
                    if (!s) return null;
                    const misses = testDraws - s.hitCount;
                    const isPositive = s.diff >= 0;

                    return (
                      <tr
                        key={size}
                        className={`hover:bg-gray-800/30 transition-colors ${
                          size === 4 ? 'bg-cyan-950/20 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 font-bold text-gray-200 flex items-center space-x-1.5">
                          <span>AI-{size}</span>
                          {size === 4 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-sans">
                              Utama
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-emerald-400 font-bold">
                          {s.hitCount}x
                        </td>
                        <td className="py-3 text-rose-400">
                          {misses}x
                        </td>
                        <td className="py-3 font-bold text-white">
                          <span className="text-cyan-300 font-mono text-sm">{s.actualRate}%</span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {s.baselineRate}%
                        </td>
                        <td className="py-3 text-right font-bold">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ${
                              isPositive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
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
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                <span>Akurasi Riil BBFS 2D Belakang</span>
              </h4>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                Aturan: Non-Twin Only
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-mono uppercase text-[10px]">
                    <th className="pb-2.5">Tier</th>
                    <th className="pb-2.5">Line</th>
                    <th className="pb-2.5">Akurasi Riil</th>
                    <th className="pb-2.5">Teoretis</th>
                    <th className="pb-2.5">Edge</th>
                    <th className="pb-2.5 text-right">PnL Sim.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 font-mono">
                  {[6, 7, 8, 9].map((size) => {
                    const s = bbfsStats[size];
                    if (!s) return null;
                    const isPositive = s.diff >= 0;

                    return (
                      <tr
                        key={size}
                        className={`hover:bg-gray-800/30 transition-colors ${
                          size === 7 ? 'bg-purple-950/20 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 font-bold text-purple-300 flex items-center space-x-1.5">
                          <span>BBFS-{size}</span>
                          {size === 7 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 font-sans">
                              Utama
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-400">
                          {s.lines} line
                        </td>
                        <td className="py-3 font-bold text-white">
                          <span className="text-purple-300 font-mono text-sm">{s.actualRate}%</span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {s.baselineRate}%
                        </td>
                        <td className="py-3 font-bold">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                              isPositive
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${s.diff}%` : `${s.diff}%`}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold">
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
      <div className="bg-gray-950/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 text-xs text-gray-400 shadow-inner">
        <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-gray-200 text-sm block mb-1">Wawasan Probabilitas Evaluasi Finansial:</strong>
          Meskipun akurasi mentah BBFS-8 atau BBFS-9 mencapai 55%–75%, simulasi finansial menunjukkan akumulasi kerugian yang jauh lebih besar karena biaya modal (56–72 line per pasang) memakan margin kemenangan. Gunakan <strong>BBFS-7</strong> dipadu dengan <strong>Smart Trimmer (Top 10 Line Bom)</strong> untuk memaksimalkan Expected Value (EV) positif dan meminimalkan resiko drawdown.
        </div>
      </div>
    </div>
  );
};

