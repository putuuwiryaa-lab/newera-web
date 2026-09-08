import React, { useState } from 'react';
import type { PredictionResult, EvaluationMetrics } from '../engine/types';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import { SmartCalibrationCard } from './SmartCalibrationCard';
import { generateSmartTrim, formatLines } from '../engine/generator';
import {
  Layers,
  AlertTriangle,
  Skull,
  Scissors,
  Bomb,
  Shield,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
  Layers2,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';

interface BBFSDashboardProps {
  prediction: PredictionResult | null;
  audit: CalibrationAudit | null;
  evaluation: EvaluationMetrics | null;
  marketName: string;
  onOpenGenerator: (digits: number[], tierName: string, mode?: 'full' | 'trimmer') => void;
}

export const BBFSDashboard: React.FC<BBFSDashboardProps> = ({
  prediction,
  audit,
  evaluation,
  marketName,
  onOpenGenerator
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedBBFSTier, setSelectedBBFSTier] = useState<6 | 7 | 8 | 9>(7);
  const [showMobileAudit, setShowMobileAudit] = useState<boolean>(false);
  const [showMobileDeadDigits, setShowMobileDeadDigits] = useState<boolean>(false);
  const [showMobileWeights, setShowMobileWeights] = useState<boolean>(false);
  const [showMobileEval, setShowMobileEval] = useState<boolean>(false);


  const [betPerLine, setBetPerLine] = useState<number>(1000);

  if (!prediction) {
    return (
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-8 text-center text-slate-400 text-sm">
        Memuat kalkulasi Engine BBFS...
      </div>
    );
  }

  const { lastDraw, bbfs, deadDigits } = prediction;
  const twinGap = audit ? audit.twinGap : 0;
  const twinAnomaly = audit ? audit.twinAnomalyLevel : 'NORMAL';

  // Smart Trimmer dari BBFS-7 rekomendasi utama
  const bbfs7Digits = bbfs[7];
  const trimmed = generateSmartTrim(bbfs7Digits);
  const top10Text = formatLines(trimmed.top10, 'space');
  const medium15Text = formatLines(trimmed.medium15, 'space');
  const cadanganText = formatLines(trimmed.cadangan, 'space');
  const allLinesText = formatLines([...trimmed.top10, ...trimmed.medium15, ...trimmed.cadangan], 'space');

  // Kalkulasi Investasi Finansial 2D
  const discountRate = 0.29; // Diskon standar 2D pasaran (29%)
  const payoutRate = 70; // Hadiah 2D umum x70 (Rp 70.000 per Rp 1.000)
  const costTop10 = Math.round(10 * betPerLine * (1 - discountRate));
  const costAll42 = Math.round(42 * betPerLine * (1 - discountRate));
  const profitTop10 = (betPerLine * payoutRate) - costTop10;
  const profitAll42 = (betPerLine * payoutRate) - costAll42;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero BBFS: Target Result 2D, Dead Digits, & Twin Anomaly */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Result 2D Belakang & Twin Indicator */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 tracking-wide uppercase">
                <Layers className="w-3.5 h-3.5 mr-1 text-purple-400" />
                Target BBFS 2D Belakang
              </span>
              <span className="text-xs text-slate-400">
                2 Digit harus tembus di 2D; Twin lolos bila ada di formasi BBFS
              </span>
            </div>

            <div className="mt-3.5 flex items-center space-x-3">
              <div className="flex items-center space-x-2 font-mono">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-purple-300 font-semibold uppercase font-sans">
                    Kepala
                  </span>
                  <span className="w-11 h-12 bg-purple-500/10 border-2 border-purple-500/40 rounded-xl flex items-center justify-center text-xl font-extrabold text-purple-200 shadow-sm ring-2 ring-purple-500/20">
                    {lastDraw.kepala}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-purple-300 font-semibold uppercase font-sans">
                    Ekor
                  </span>
                  <span className="w-11 h-12 bg-purple-500/10 border-2 border-purple-500/40 rounded-xl flex items-center justify-center text-xl font-extrabold text-purple-200 shadow-sm ring-2 ring-purple-500/20">
                    {lastDraw.ekor}
                  </span>
                </div>
              </div>

              <div className="pl-3.5 border-l border-white/[0.08] space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Result 2D:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 font-mono font-bold text-purple-300 text-sm tracking-wider">
                    [{lastDraw.kepala}{lastDraw.ekor}]
                  </span>
                </div>
                <div>
                  {lastDraw.kepala === lastDraw.ekor ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                      Angka Kembar (TWIN)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-white/[0.06]">
                      Non-Twin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Quick Info Bar */}
            <div className="flex lg:hidden flex-wrap items-center gap-2 mt-3.5 pt-2.5 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/25">
                ★ Rekomendasi: BBFS-7
              </span>
              <span className="text-[10px] font-mono bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20">
                Mati: {deadDigits.join(', ')}
              </span>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                Gap Kembar: {twinGap}x ({twinAnomaly})
              </span>
            </div>
          </div>

          {/* 2 Widget: 2 Digit Terlemah (Dead Digits) & Indeks Twin Anomaly (Desktop View) */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto">
            {/* Dead Digits Card (Elimination Chamber) */}
            <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>2 Digit Terlemah</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300">
                  ELIMINASI
                </span>
              </div>

              <div className="flex items-center space-x-2.5 my-2">
                {deadDigits.map((d, i) => (
                  <span
                    key={i}
                    className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-center font-mono font-bold text-rose-300 text-lg line-through shadow-sm"
                    title={`Digit ${d} direkomendasikan untuk dieliminasi dari BBFS`}
                  >
                    {d}
                  </span>
                ))}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">Konektivitas Terendah</span>
                  <span className="text-[10px] text-slate-400">Matriks Densitas 14 Putaran</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Diisolasi otomatis oleh Engine. Sangat disarankan dibuang pada peracikan line.
              </p>
            </div>

            {/* Twin Anomaly Index Card with Visual Gauge */}
            <div className="bg-slate-950/80 border border-white/[0.08] rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Anomali Kembar 2D</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    twinAnomaly === 'EKSTREM'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : twinAnomaly === 'MENINGKAT'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {twinAnomaly}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {twinGap}
                </span>
                <span className="text-[11px] text-slate-400">Putaran Tanpa Kembar</span>
              </div>

              {/* Progress gauge vs theoretical threshold (10 draws cycle) */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/[0.04] mt-1 mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    twinGap >= 15
                      ? 'bg-rose-500'
                      : twinGap >= 9
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (twinGap / 20) * 100)}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                {twinAnomaly === 'EKSTREM'
                  ? 'Kemarau twin ekstrem (>15x)! Pertimbangkan opsi +Twin pada BBFS.'
                  : twinAnomaly === 'MENINGKAT'
                  ? 'Peluang twin mulai naik. Siapkan proteksi twin.'
                  : 'Distribusi twin dalam ambang batas normal (10%).'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Smart Audit Khusus BBFS (Desktop View) */}
      <div className="hidden lg:block">
        <SmartCalibrationCard audit={audit} marketName={marketName} mode="bbfs" />
      </div>

      {/* 2.5. Bobot 4 Komponen Evaluasi BBFS (Desktop View) */}
      <div className="hidden lg:block bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-4 relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Bobot 4 Komponen Evaluasi BBFS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-mono font-medium border border-purple-500/25">
                  Independen per Tier
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Setiap parameter BBFS dihitung dengan bobot komponen yang berbeda sesuai tuntutan efisiensi line.
              </p>
            </div>
          </div>

          {/* Selector Parameter Tier BBFS */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-white/[0.08]">
            {[6, 7, 8, 9].map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedBBFSTier(sz as 6 | 7 | 8 | 9)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors ${
                  selectedBBFSTier === sz
                    ? 'bg-slate-800 text-purple-300 shadow-sm border border-white/[0.1]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BBFS-{sz}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-300 font-sans mb-3 bg-slate-950/60 p-3 rounded-xl border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            Parameter Aktif: <strong className="text-purple-300 font-mono">BBFS-{selectedBBFSTier}</strong> ({selectedBBFSTier === 6 ? '30 Line Ekonomis' : selectedBBFSTier === 7 ? '42 Line Keseimbangan Utama' : selectedBBFSTier === 8 ? '56 Line Cakupan Luas' : '72 Line Proteksi Penuh'})
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-300 font-mono font-medium bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
              Anti-Osilasi
            </span>
            <span className="text-[10px] text-emerald-300 font-mono font-medium bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
              Evaluasi Khusus {selectedBBFSTier} Digit
            </span>
          </div>
        </div>

        {(() => {
          const activeWeights = prediction.bbfsTierWeights?.[selectedBBFSTier] || {
            'Densitas Pasangan': selectedBBFSTier === 6 ? 12 : (selectedBBFSTier === 7 ? 10 : 8),
            'Transisi Markov': selectedBBFSTier === 6 ? 9 : 8,
            'Momentum Posisi': selectedBBFSTier >= 8 ? 10 : 7,
            'Coverage Proteksi': selectedBBFSTier === 9 ? 14 : (selectedBBFSTier === 8 ? 10 : 6)
          };
          const totalWeight = Object.values(activeWeights).reduce((a, b) => a + b, 0) || 1;
          const factorColors: Record<string, { bar: string; text: string }> = {
            'Densitas Pasangan': { bar: 'bg-purple-400', text: 'text-purple-300' },
            'Transisi Markov': { bar: 'bg-cyan-400', text: 'text-cyan-300' },
            'Momentum Posisi': { bar: 'bg-emerald-400', text: 'text-emerald-300' },
            'Coverage Proteksi': { bar: 'bg-amber-400', text: 'text-amber-300' }
          };
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(activeWeights).map(([name, w]) => {
                const pct = Math.round((w / totalWeight) * 100);
                const style = factorColors[name] || { bar: 'bg-purple-400', text: 'text-purple-300' };
                return (
                  <div key={name} className="bg-slate-950/70 p-3 rounded-xl border border-white/[0.06] space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300 font-medium">{name}</span>
                      <span className={`font-semibold tabular-nums ${style.text}`}>{w.toFixed(1)}x ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/[0.04]">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {name === 'Densitas Pasangan' ? 'Frekuensi kemunculan pasangan 2D langsung' :
                       name === 'Transisi Markov' ? 'Aliran transisi kepala-ekor sebelumnya' :
                       name === 'Momentum Posisi' ? 'Peluruhan frekuensi kepala & ekor terkini' :
                       'Proteksi eliminasi dead digits & perluasan'}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 3. Kartu Prediksi BBFS (6 - 9 Digit) */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Prediksi BBFS 2D (Bolak Balik Full Set)
              </h3>
              <p className="text-xs text-slate-400">
                Optimasi Joint-Density Pasangan 2D independen. Buka generator untuk memangkas line secara cerdas.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              size: 6,
              label: 'BBFS-6 (Hemat)',
              lines: 30,
              baseline: '30%',
              desc: '30 Line Non-Twin / 36 Line Twin — Modal Minimal Efisiensi Maksimal',
              badge: 'Ekonomis'
            },
            {
              size: 7,
              label: 'BBFS-7 (Utama)',
              lines: 42,
              baseline: '42%',
              desc: '42 Line Non-Twin / 49 Line Twin — Rekomendasi Utama Joint-Density',
              badge: '★ Rekomendasi Utama',
              star: true
            },
            {
              size: 8,
              label: 'BBFS-8 (Moderat)',
              lines: 56,
              baseline: '56%',
              desc: '56 Line Non-Twin / 64 Line Twin — Cakupan Luas Probabilitas Tinggi',
              badge: 'Cakupan Luas'
            },
            {
              size: 9,
              label: 'BBFS-9 (Proteksi)',
              lines: 72,
              baseline: '72%',
              desc: '72 Line Non-Twin / 81 Line Twin — Proteksi Penuh Toleransi Tinggi',
              badge: 'Proteksi Penuh'
            }
          ].map(({ size, label, lines, baseline, desc, badge, star }) => {
            const digits = bbfs[size as keyof typeof bbfs];
            const digitStr = digits.join('');
            const isCopied = copiedKey === `bbfs-${size}`;

            return (
              <div
                key={size}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                  star
                    ? 'bg-slate-900/90 border-purple-500/40 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/20'
                    : 'bg-slate-950/60 border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        star ? 'text-purple-300 font-extrabold' : 'text-slate-100'
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                        star
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border border-white/[0.06]'
                      }`}
                    >
                      {badge}
                    </span>
                    {audit?.bbfsAudit?.tierAudits?.[size] && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium tracking-wider ${
                          audit.bbfsAudit.tierAudits[size].action === 'FREEZE'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                        }`}
                        title={audit.bbfsAudit.tierAudits[size].marginalNote}
                      >
                        {audit.bbfsAudit.tierAudits[size].action === 'FREEZE'
                          ? `FREEZE (HIT)`
                          : `KALIBRASI`}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/[0.06] font-mono text-slate-400">
                    Baseline: <strong className="text-slate-200">{baseline}</strong> ({lines} Line)
                  </span>
                </div>

                {audit?.bbfsAudit?.tierAudits?.[size] && (
                  <div className="mb-3 text-[10px] font-mono flex items-center justify-between bg-slate-900/50 px-2.5 py-1 rounded border border-white/[0.04]">
                    <span className={audit.bbfsAudit.tierAudits[size].action === 'FREEZE' ? 'text-purple-300 font-medium' : 'text-rose-400 font-medium'}>
                      {audit.bbfsAudit.tierAudits[size].action === 'FREEZE'
                        ? `✓ Parameter BBFS-${size} Terkunci (Hit Kemarin)`
                        : `Penyesuaian Adaptif Terkendali`}
                    </span>
                    <span className="text-slate-400 truncate ml-2">
                      {audit.bbfsAudit.tierAudits[size].marginalNote}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-1">
                  <div className="flex items-center space-x-1.5">
                    {digits.map((d, i) => (
                      <span
                        key={i}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-mono font-bold text-base transition-all duration-150 hover:-translate-y-0.5 shadow-sm ${
                          star
                            ? 'bg-purple-500/15 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                            : 'bg-slate-900 text-white border border-white/[0.1] hover:border-white/[0.2]'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenGenerator(digits, label, 'full')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm ${
                        star
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/[0.08]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Line</span>
                    </button>

                    <button
                      onClick={() => handleCopy(digitStr, `bbfs-${size}`)}
                      className={`p-2 rounded-xl border transition-all active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800 hover:bg-slate-700/90 border-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                      title="Salin Angka BBFS"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Visualisasi Bobot Spesifik Parameter Tier BBFS Ini */}
                {prediction.bbfsTierWeights?.[size] && (() => {
                  const tWeights = prediction.bbfsTierWeights[size];
                  const tTotal = Object.values(tWeights).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <div className="mt-3.5 pt-2.5 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
                        <span className="text-slate-300 font-medium">Bobot Parameter BBFS-{size}:</span>
                        <span className="text-purple-300 font-medium">{lines} Line</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono">
                        {Object.entries(tWeights).map(([fName, fW]) => {
                          const pct = Math.round((fW / tTotal) * 100);
                          const shortName = fName.replace(' Pasangan', '').replace(' Posisi', '').replace(' Proteksi', '');
                          return (
                            <div key={fName} className="bg-slate-900/90 px-1.5 py-1 rounded border border-white/[0.06] flex flex-col items-center">
                              <span className="text-slate-400 truncate max-w-full">{shortName}</span>
                              <span className="font-bold text-white tabular-nums">{fW.toFixed(1)}x</span>
                              <span className="text-[8px] text-purple-300 font-semibold tabular-nums">({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-white/[0.06] leading-relaxed">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Pemangkas Cerdas 2D (Smart Trimmer) & Kalkulator Investasi */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Pemangkas Cerdas 2D & Kalkulator Investasi (BBFS-7)
              </h4>
              <p className="text-[11px] text-slate-400">
                Kombinasi dipartisi otomatis menjadi Top 10 Line Bom, 15 Line Medium, dan Cadangan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(allLinesText, 'trim-all')}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-medium border border-white/[0.1] transition-all flex items-center space-x-1.5"
            >
              {copiedKey === 'trim-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin Semua (42L)</span>
            </button>
            <button
              onClick={() => onOpenGenerator(bbfs7Digits, 'BBFS-7', 'trimmer')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buka Generator</span>
            </button>
          </div>
        </div>

        {/* Kalkulator Investasi 2D */}
        <div className="bg-slate-950/80 border border-white/[0.08] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-medium text-slate-300">Nilai Bet / Line:</span>
            <div className="flex items-center bg-slate-900 border border-white/[0.1] rounded-lg px-2.5 py-1">
              <span className="text-xs text-slate-500 mr-1 font-mono">Rp</span>
              <input
                type="number"
                min="100"
                step="100"
                value={betPerLine}
                onChange={(e) => setBetPerLine(Math.max(100, Number(e.target.value) || 100))}
                className="w-20 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">Diskon Pasaran 29%</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <span className="text-slate-400 mr-1.5">Modal Top 10:</span>
              <span className="text-amber-300 font-bold">Rp {costTop10.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-emerald-400 ml-1.5">Net JP: +Rp {profitTop10.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <span className="text-slate-400 mr-1.5">Modal Semua 42L:</span>
              <span className="text-purple-300 font-bold">Rp {costAll42.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-emerald-400 ml-1.5">Net JP: +Rp {profitAll42.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Top 10 Line Bom */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Bomb className="w-4 h-4 text-amber-400" />
                  <span>Top 10 Line Bom (Utama)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono font-semibold border border-amber-500/30">
                  10 Line
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/90 rounded-xl border border-white/[0.06] min-h-[72px]">
                {trimmed.top10.map((line) => (
                  <span
                    key={line}
                    className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs shadow-sm hover:scale-105 transition-transform cursor-default"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleCopy(top10Text, 'trim-top10')}
              className="mt-3.5 w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all border border-amber-500/30 active:scale-95"
            >
              {copiedKey === 'trim-top10' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin 10 Line Bom</span>
                </>
              )}
            </button>
          </div>

          {/* 15 Line Medium */}
          <div className="bg-slate-950/80 border border-cyan-500/25 rounded-xl p-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-cyan-300 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>15 Line Medium</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
                  15 Line
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/90 rounded-xl border border-white/[0.06] min-h-[72px]">
                {trimmed.medium15.map((line) => (
                  <span
                    key={line}
                    className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-mono font-bold text-xs shadow-sm hover:scale-105 transition-transform cursor-default"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleCopy(medium15Text, 'trim-medium15')}
              className="mt-3.5 w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all border border-cyan-500/30 active:scale-95"
            >
              {copiedKey === 'trim-medium15' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin 15 Line Medium</span>
                </>
              )}
            </button>
          </div>

          {/* Line Cadangan */}
          <div className="bg-slate-950/80 border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-slate-300">
                  Line Cadangan (Pengaman)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-white/[0.06]">
                  {trimmed.cadangan.length} Line
                </span>
              </div>
              <div className="flex flex-wrap gap-1 p-2 bg-slate-900/90 rounded-xl border border-white/[0.06] max-h-[92px] overflow-y-auto scrollbar-thin">
                {trimmed.cadangan.map((line) => (
                  <span
                    key={line}
                    className="px-2 py-0.5 rounded bg-slate-800/80 border border-white/[0.06] text-slate-300 font-mono text-[11px]"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleCopy(cadanganText, 'trim-cadangan')}
              className="mt-3.5 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all active:scale-95 border border-white/[0.08]"
            >
              {copiedKey === 'trim-cadangan' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Cadangan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Only Collapsible Dropdowns Section */}
      <div className="lg:hidden space-y-3">
        {/* Accordion 1: 2 Digit Mati & Anomali Twin */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMobileDeadDigits(!showMobileDeadDigits)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Skull className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white tracking-wide">Digit Mati & Anomali Twin</div>
                <div className="text-[10px] text-slate-400">Eliminasi 2 digit terlemah & status kembar</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-medium bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20">
                Mati: {deadDigits.join(', ')}
              </span>
              {showMobileDeadDigits ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {showMobileDeadDigits && (
            <div className="p-4 pt-0 border-t border-white/[0.08] mt-2 space-y-3">
              {/* Dead Digits Card */}
              <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-3 shadow-inner">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>2 Digit Terlemah (Eliminasi)</span>
                  </div>
                  <span className="text-[9px] font-mono font-medium px-2 py-0.2 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300">
                    DIISOLASI
                  </span>
                </div>
                <div className="flex items-center space-x-2 my-1">
                  {deadDigits.map((d, i) => (
                    <span
                      key={i}
                      className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/40 flex items-center justify-center font-mono font-bold text-rose-300 text-sm line-through"
                    >
                      {d}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-400">Konektivitas terendah 14 putaran</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Digit ini direkomendasikan untuk dimatikan pada racikan line.
                </p>
              </div>

              {/* Twin Anomaly Card */}
              <div className="bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 shadow-inner">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Anomali Kembar 2D</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-medium px-2 py-0.2 rounded-full uppercase ${
                      twinAnomaly === 'EKSTREM'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : twinAnomaly === 'MENINGKAT'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {twinAnomaly}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2 my-1">
                  <span className="text-xl font-bold font-mono text-white tabular-nums">{twinGap}</span>
                  <span className="text-[10px] text-slate-400">Putaran tanpa kembar</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-white/[0.04] mb-1">
                  <div
                    className={`h-full rounded-full ${
                      twinGap >= 15 ? 'bg-rose-500' : twinGap >= 9 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (twinGap / 20) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {twinAnomaly === 'EKSTREM'
                    ? 'Kemarau twin ekstrem (>15x)! Wajib proteksi +Twin.'
                    : twinAnomaly === 'MENINGKAT'
                    ? 'Peluang twin mulai meningkat.'
                    : 'Probabilitas twin dalam ambang batas normal.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Audit & Kalibrasi BBFS */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMobileAudit(!showMobileAudit)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white tracking-wide">Audit & Kalibrasi BBFS</div>
                <div className="text-[10px] text-slate-400">Status kalibrasi 4 tier BBFS</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                audit?.bbfsAudit?.tierAudits?.[7]?.action === 'FREEZE'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
              }`}>
                {audit?.bbfsAudit?.tierAudits?.[7]?.action === 'FREEZE' ? 'FREEZE' : 'TUNE'}
              </span>
              {showMobileAudit ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {showMobileAudit && (
            <div className="p-3 pt-0 border-t border-white/[0.08] mt-1">
              <SmartCalibrationCard audit={audit} marketName={marketName} mode="bbfs" />
            </div>
          )}
        </div>

        {/* Accordion 3: Bobot 4 Komponen BBFS (Multi-Tier) */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMobileWeights(!showMobileWeights)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white tracking-wide">Bobot 4 Komponen BBFS</div>
                <div className="text-[10px] text-slate-400">Densitas, Markov, Momentum, Coverage</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-medium bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                BBFS-{selectedBBFSTier}
              </span>
              {showMobileWeights ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {showMobileWeights && (
            <div className="p-4 pt-0 border-t border-white/[0.08] mt-2 space-y-3">
              {/* Selector Tier */}
              <div className="flex items-center justify-between gap-1 bg-slate-950/80 p-1.5 rounded-lg border border-white/[0.08]">
                <span className="text-[10px] text-slate-400 font-sans pl-1">Tier BBFS:</span>
                <div className="flex space-x-1 font-mono text-[10px]">
                  {([6, 7, 8, 9] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedBBFSTier(sz)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        selectedBBFSTier === sz
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      BBFS-{sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bars */}
              {(() => {
                const activeWeights = prediction.bbfsTierWeights?.[selectedBBFSTier] || {
                  'Densitas Pasangan': selectedBBFSTier === 6 ? 12 : (selectedBBFSTier === 7 ? 10 : 8),
                  'Transisi Markov': selectedBBFSTier === 6 ? 9 : 8,
                  'Momentum Posisi': selectedBBFSTier >= 8 ? 10 : 7,
                  'Coverage Proteksi': selectedBBFSTier === 9 ? 14 : (selectedBBFSTier === 8 ? 10 : 6)
                };
                const totalWeight = Object.values(activeWeights).reduce((a, b) => a + b, 0) || 1;
                const factorColors: Record<string, { bar: string; text: string }> = {
                  'Densitas Pasangan': { bar: 'bg-purple-400', text: 'text-purple-300' },
                  'Transisi Markov': { bar: 'bg-cyan-400', text: 'text-cyan-300' },
                  'Momentum Posisi': { bar: 'bg-emerald-400', text: 'text-emerald-300' },
                  'Coverage Proteksi': { bar: 'bg-amber-400', text: 'text-amber-300' }
                };
                return (
                  <div className="space-y-2">
                    {Object.entries(activeWeights).map(([name, w]) => {
                      const pct = Math.round((w / totalWeight) * 100);
                      const style = factorColors[name] || { bar: 'bg-purple-400', text: 'text-purple-300' };
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span className="text-slate-300">{name}</span>
                            <span className={`font-semibold tabular-nums ${style.text}`}>{w.toFixed(1)}x ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/[0.04]">
                            <div
                              className={`h-full rounded-full ${style.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Accordion 4: Performa & Evaluasi BBFS */}
        {evaluation && (
          <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
            <button
              onClick={() => setShowMobileEval(!showMobileEval)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white tracking-wide">Performa & Evaluasi BBFS</div>
                  <div className="text-[10px] text-slate-400">Walk-forward {evaluation.testDraws} putaran</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-medium bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/25">
                  BBFS-7: {evaluation.bbfsStats[7]?.actualRate}%
                </span>
                {showMobileEval ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {showMobileEval && (
              <div className="p-4 pt-0 border-t border-white/[0.08] mt-2">
                <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-white/[0.08] text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Tier</th>
                        <th className="p-2">Line</th>
                        <th className="p-2">Hit</th>
                        <th className="p-2">Miss</th>
                        <th className="p-2">Akurasi</th>
                        <th className="p-2">Edge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-xs">
                      {[6, 7, 8, 9].map((size) => {
                        const stat = evaluation.bbfsStats[size];
                        if (!stat) return null;
                        const misses = evaluation.testDraws - stat.hitCount;
                        const edge = stat.diff;
                        const isPositive = edge >= 0;
                        return (
                          <tr key={size} className={size === 7 ? 'bg-purple-950/20 font-bold' : ''}>
                            <td className="p-2 text-purple-300 font-bold">BBFS-{size}</td>
                            <td className="p-2 text-slate-400">{stat.lines}L</td>
                            <td className="p-2 text-emerald-400 tabular-nums">{stat.hitCount}x</td>
                            <td className="p-2 text-rose-400 tabular-nums">{misses}x</td>
                            <td className="p-2 text-purple-300 tabular-nums">{stat.actualRate}%</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${
                                isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                {isPositive ? `+${edge}%` : `${edge}%`}
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
        )}
      </div>

      {/* 5. Mini Evaluasi Khusus BBFS (Desktop Only) */}
      {evaluation && (
        <div className="hidden lg:block bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Performa Walk-Forward BBFS ({evaluation.testDraws} Putaran Terakhir)</span>
            </div>
            <span className="text-xs text-purple-300 font-mono">
              Aturan Evaluasi: <strong className="text-purple-400">2 Digit Masuk / Twin Lolos</strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3">Tier BBFS</th>
                  <th className="p-3">Jumlah Line (Non-Twin)</th>
                  <th className="p-3">Tembus 2D</th>
                  <th className="p-3">Gagal</th>
                  <th className="p-3">Akurasi Empiris</th>
                  <th className="p-3">Baseline Teori</th>
                  <th className="p-3 text-right">Edge (Keunggulan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono text-slate-300">
                {[6, 7, 8, 9].map((size) => {
                  const stat = evaluation.bbfsStats[size];
                  if (!stat) return null;
                  const misses = evaluation.testDraws - stat.hitCount;
                  const edge = stat.diff;
                  const isPositive = edge >= 0;
                  return (
                    <tr
                      key={size}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        size === 7 ? 'bg-purple-950/20 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 text-purple-300 font-bold flex items-center space-x-1.5">
                        <span>BBFS-{size}</span>
                        {size === 7 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            Utama
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{stat.lines} Line</td>
                      <td className="p-3 text-emerald-400 tabular-nums">{stat.hitCount}x</td>
                      <td className="p-3 text-rose-400 tabular-nums">{misses}x</td>
                      <td className="p-3 font-bold text-white">
                        <span className="text-purple-300 font-mono text-sm tabular-nums">{stat.actualRate}%</span>
                      </td>
                      <td className="p-3 text-slate-400 tabular-nums">{stat.baselineRate}%</td>
                      <td className="p-3 text-right font-bold">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] tabular-nums ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          }`}
                        >
                          {isPositive ? `+${edge}%` : `${edge}%`}
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
  );
};
