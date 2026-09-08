import React, { useState } from 'react';
import type { PredictionResult, EvaluationMetrics } from '../engine/types';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import { SmartCalibrationCard } from './SmartCalibrationCard';
import {
  Sparkles,
  Gauge,
  BarChart2,
  Copy,
  Check,
  Award,
  Zap,
  AlertTriangle,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';

interface AIDashboardProps {
  prediction: PredictionResult | null;
  audit: CalibrationAudit | null;
  evaluation: EvaluationMetrics | null;
  marketName: string;
}

export const AIDashboard: React.FC<AIDashboardProps> = ({
  prediction,
  audit,
  evaluation,
  marketName
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedWeightTier, setSelectedWeightTier] = useState<3 | 4 | 5 | 6>(4);
  const [showMobileAudit, setShowMobileAudit] = useState<boolean>(false);
  const [showMobileWeights, setShowMobileWeights] = useState<boolean>(false);
  const [showMobileEval, setShowMobileEval] = useState<boolean>(false);


  if (!prediction) {
    return (
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-8 text-center text-slate-400 text-sm">
        Memuat kalkulasi Engine AI...
      </div>
    );
  }

  const { lastDraw, ai, methodWeights, confidenceScore, convergenceStatus } = prediction;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero AI: Result 2D Target & Model Confidence */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Result Terakhir dengan Fokus Target Posisi AI (Kepala/Ekor) */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide uppercase">
                <Target className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Target Posisi AI 2D
              </span>
              <span className="text-xs text-slate-400">
                Min. 1 digit prediksi wajib hadir di Kepala atau Ekor
              </span>
            </div>

            <div className="mt-3.5 flex items-center space-x-3">
              <div className="flex items-center space-x-2 font-mono">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-medium">As</span>
                  <span className="w-11 h-12 bg-slate-950/80 border border-white/[0.08] rounded-xl flex items-center justify-center text-lg font-bold text-slate-400">
                    {lastDraw.as}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-medium">Kop</span>
                  <span className="w-11 h-12 bg-slate-950/80 border border-white/[0.08] rounded-xl flex items-center justify-center text-lg font-bold text-slate-400">
                    {lastDraw.kop}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase font-sans flex items-center">
                    Kepala
                  </span>
                  <span className="w-11 h-12 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl flex items-center justify-center text-xl font-extrabold text-emerald-300 shadow-sm ring-2 ring-emerald-500/20">
                    {lastDraw.kepala}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase font-sans flex items-center">
                    Ekor
                  </span>
                  <span className="w-11 h-12 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl flex items-center justify-center text-xl font-extrabold text-emerald-300 shadow-sm ring-2 ring-emerald-500/20">
                    {lastDraw.ekor}
                  </span>
                </div>
              </div>

              {/* 2D Summary Badge */}
              <div className="pl-3.5 border-l border-white/[0.08] flex flex-col justify-center space-y-1">
                <div className="text-[11px] text-slate-400 font-medium">Target 2D:</div>
                <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono font-bold text-emerald-300 text-sm tracking-wider">
                  [{lastDraw.kepala}{lastDraw.ekor}]
                </div>
              </div>
            </div>

            {/* Mobile Quick Info Bar */}
            <div className="flex lg:hidden flex-wrap items-center gap-2 mt-3.5 pt-2.5 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                ★ Rekomendasi: AI-4
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {confidenceScore}% Konsensus
              </span>
            </div>
          </div>

          {/* Model Confidence Meter & Bobot 4 Algoritma (Desktop Only in Header) */}
          <div className="hidden lg:grid grid-cols-2 gap-3.5 w-full lg:w-auto">
            {/* Confidence Meter */}
            <div className="bg-slate-950/80 border border-white/[0.08] rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Keyakinan Model AI</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    convergenceStatus === 'TINGGI'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : convergenceStatus === 'SEDANG'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {convergenceStatus}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {confidenceScore}%
                </span>
                <span className="text-[11px] text-slate-400">Konsensus 4 Metode</span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/[0.06] mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    confidenceScore >= 80
                      ? 'bg-emerald-400'
                      : confidenceScore >= 68
                      ? 'bg-cyan-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </div>

            {/* Bobot Ensemble Rolling Window dengan Visual Progress Bar & Selector Tier Parameter */}
            <div className="bg-slate-950/80 border border-white/[0.08] rounded-xl p-3.5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bobot Metode:</span>
                </span>
                {/* Selector Parameter Tier */}
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-white/[0.08]">
                  {[3, 4, 5, 6].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedWeightTier(sz as 3 | 4 | 5 | 6)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded transition-colors ${
                        selectedWeightTier === sz
                          ? 'bg-slate-800 text-cyan-300 shadow-sm border border-white/[0.1]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      AI-{sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-sans mb-2 bg-slate-900/60 px-2.5 py-1 rounded border border-white/[0.06] flex items-center justify-between">
                <span>Evaluasi Akurasi: <strong className="text-cyan-300 font-mono">AI-{selectedWeightTier} ({selectedWeightTier} Digit)</strong></span>
                <span className="text-[9px] text-cyan-300 font-mono bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">Anti-Osilasi</span>
              </div>

              {(() => {
                const activeWeights = prediction.tierMethodWeights?.[selectedWeightTier] || methodWeights;
                const totalWeight = Object.values(activeWeights).reduce((a, b) => a + b, 0) || 1;
                const colors = {
                  Momentum: 'bg-cyan-400',
                  Markov: 'bg-emerald-400',
                  Delta: 'bg-blue-400',
                  Mistik: 'bg-purple-400'
                };
                return (
                  <div className="space-y-1.5">
                    {Object.entries(activeWeights).map(([name, w]) => {
                      const pct = Math.round((w / totalWeight) * 100);
                      const barColor = colors[name as keyof typeof colors] || 'bg-emerald-400';
                      return (
                        <div key={name} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-mono text-slate-400">
                            <span className="text-slate-300">{name}</span>
                            <span className="font-semibold text-slate-200 tabular-nums">{w.toFixed(1)}x ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-white/[0.04]">
                            <div
                              className={`h-full rounded-full ${barColor}`}
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
          </div>
        </div>
      </div>

      {/* 2. Smart Audit Khusus AI (Desktop View) */}
      <div className="hidden lg:block">
        <SmartCalibrationCard audit={audit} marketName={marketName} mode="ai" />
      </div>

      {/* 3. Kartu Prediksi Angka Ikut (AI 3 - 6 Digit) */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Prediksi Angka Ikut (AI) 2D Terkalibrasi
              </h3>
              <p className="text-xs text-slate-400">
                Pilih formasi sesuai profil risiko: Ketat (AI-3), Utama (AI-4), Seimbang (AI-5), atau Proteksi (AI-6)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              size: 3,
              label: 'AI-3 (Ketat)',
              baseline: '51%',
              desc: '3 Digit Prioritas Tertinggi — Efisiensi Modal Maksimal',
              badge: 'Agresif'
            },
            {
              size: 4,
              label: 'AI-4 (Utama)',
              baseline: '64%',
              desc: 'Rekomendasi Utama Model Ensemble — Rasio Hit/Modal Terbaik',
              badge: '★ Rekomendasi Utama',
              star: true
            },
            {
              size: 5,
              label: 'AI-5 (Moderat)',
              baseline: '75%',
              desc: 'Cakupan Sedang untuk Proteksi — Toleransi Volatilitas',
              badge: 'Seimbang'
            },
            {
              size: 6,
              label: 'AI-6 (Aman)',
              baseline: '84%',
              desc: 'Peluang Tembus Tertinggi — Cocok untuk Akumulasi Stabil',
              badge: 'Konservatif'
            }
          ].map(({ size, label, baseline, desc, badge, star }) => {
            const digits = ai[size as keyof typeof ai];
            const digitStr = digits.join(' ');
            const isCopied = copiedKey === `ai-${size}`;

            return (
              <div
                key={size}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                  star
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/60 border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        star ? 'text-cyan-300 font-extrabold' : 'text-slate-100'
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                        star
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-white/[0.06]'
                      }`}
                    >
                      {badge}
                    </span>
                    {audit?.aiAudit?.tierAudits?.[size] && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium tracking-wider ${
                          audit.aiAudit.tierAudits[size].action === 'FREEZE'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                        }`}
                        title={audit.aiAudit.tierAudits[size].marginalNote}
                      >
                        {audit.aiAudit.tierAudits[size].action === 'FREEZE'
                          ? `FREEZE (HIT)`
                          : `KALIBRASI`}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/[0.06] font-mono text-slate-400">
                    Baseline: <strong className="text-slate-200">{baseline}</strong>
                  </span>
                </div>

                {audit?.aiAudit?.tierAudits?.[size] && (
                  <div className="mb-3 text-[10px] font-mono flex items-center justify-between bg-slate-900/50 px-2.5 py-1 rounded border border-white/[0.04]">
                    <span className={audit.aiAudit.tierAudits[size].action === 'FREEZE' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                      {audit.aiAudit.tierAudits[size].action === 'FREEZE'
                        ? `✓ Parameter AI-${size} Terkunci (Hit Kemarin)`
                        : `Penyesuaian Adaptif Terkendali`}
                    </span>
                    <span className="text-slate-400 truncate ml-2">
                      {audit.aiAudit.tierAudits[size].marginalNote}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-1">
                  <div className="flex items-center space-x-2">
                    {digits.map((d, i) => (
                      <span
                        key={i}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg sm:text-xl transition-all duration-150 hover:-translate-y-0.5 shadow-sm ${
                          star
                            ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                            : 'bg-slate-900 text-white border border-white/[0.1] hover:border-white/[0.2]'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCopy(digitStr, `ai-${size}`)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95 border ${
                      isCopied
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700/90 text-slate-200 hover:text-white border-white/[0.08] shadow-sm'
                    }`}
                    title="Salin Angka AI ke Clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Visualisasi Bobot Spesifik Parameter Tier Ini */}
                {prediction.tierMethodWeights?.[size] && (() => {
                  const tWeights = prediction.tierMethodWeights[size];
                  const tTotal = Object.values(tWeights).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <div className="mt-3.5 pt-2.5 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
                        <span className="text-slate-300 font-medium">Bobot Parameter AI-{size}:</span>
                        <span className="text-cyan-400 font-medium">Evaluasi {size} Digit</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono">
                        {Object.entries(tWeights).map(([mName, mW]) => {
                          const pct = Math.round((mW / tTotal) * 100);
                          return (
                            <div key={mName} className="bg-slate-900/90 px-1.5 py-1 rounded border border-white/[0.06] flex flex-col items-center">
                              <span className="text-slate-400">{mName}</span>
                              <span className="font-bold text-white tabular-nums">{mW.toFixed(1)}x</span>
                              <span className="text-[8px] text-cyan-400 font-semibold tabular-nums">({pct}%)</span>
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

      {/* Mobile-Only Collapsible Dropdowns Section */}
      <div className="lg:hidden space-y-3">
        {/* Accordion 1: Audit & Kalibrasi AI */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMobileAudit(!showMobileAudit)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white tracking-wide">Audit & Kalibrasi AI Engine</div>
                <div className="text-[10px] text-slate-400">Status kalibrasi & proteksi anti-osilasi</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                audit?.aiAudit?.tierAudits?.[4]?.action === 'FREEZE'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' 
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/25'
              }`}>
                {audit?.aiAudit?.tierAudits?.[4]?.action === 'FREEZE' ? 'FREEZE' : 'TUNE'}
              </span>
              {showMobileAudit ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {showMobileAudit && (
            <div className="p-3 pt-0 border-t border-white/[0.08] mt-1">
              <SmartCalibrationCard audit={audit} marketName={marketName} mode="ai" />
            </div>
          )}
        </div>

        {/* Accordion 2: Bobot 4 Algoritma AI (Multi-Tier) */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMobileWeights(!showMobileWeights)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white tracking-wide">Bobot 4 Metode AI (Multi-Tier)</div>
                <div className="text-[10px] text-slate-400">Momentum, Markov, Delta, Mistik per Tier</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-medium bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
                AI-{selectedWeightTier}
              </span>
              {showMobileWeights ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {showMobileWeights && (
            <div className="p-4 pt-0 border-t border-white/[0.08] mt-2 space-y-3">
              {/* Selector Tier */}
              <div className="flex items-center justify-between gap-1 bg-slate-950/80 p-1.5 rounded-lg border border-white/[0.08]">
                <span className="text-[10px] text-slate-400 font-sans pl-1">Tier AI:</span>
                <div className="flex space-x-1 font-mono text-[10px]">
                  {([3, 4, 5, 6] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedWeightTier(t)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        selectedWeightTier === t
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      AI-{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bars */}
              {(() => {
                const activeWeights = prediction.tierMethodWeights?.[selectedWeightTier] || methodWeights;
                const totalWeight = Object.values(activeWeights).reduce((a, b) => a + b, 0) || 1;
                const colors = {
                  Momentum: 'bg-cyan-400',
                  Markov: 'bg-emerald-400',
                  Delta: 'bg-blue-400',
                  Mistik: 'bg-purple-400'
                };
                return (
                  <div className="space-y-2">
                    {Object.entries(activeWeights).map(([name, w]) => {
                      const pct = Math.round((w / totalWeight) * 100);
                      const barColor = colors[name as keyof typeof colors] || 'bg-emerald-400';
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span className="text-slate-300">{name}</span>
                            <span className="font-semibold text-slate-200 tabular-nums">{w.toFixed(1)}x ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                            <div
                              className={`h-full rounded-full ${barColor}`}
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

        {/* Accordion 3: Performa & Evaluasi Streak AI */}
        {evaluation && (
          <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
            <button
              onClick={() => setShowMobileEval(!showMobileEval)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white tracking-wide">Performa & Evaluasi AI</div>
                  <div className="text-[10px] text-slate-400">Walk-forward {evaluation.testDraws} putaran & streak</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/25">
                  Streak {evaluation.ai4Streak.maxWin}x
                </span>
                {showMobileEval ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {showMobileEval && (
              <div className="p-4 pt-0 border-t border-white/[0.08] mt-2 space-y-3">
                {/* Streak Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/80 border border-white/[0.08] rounded-lg p-2.5 flex items-center space-x-2.5">
                    <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400">Win-Streak Max AI-4</div>
                      <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">{evaluation.ai4Streak.maxWin}x berturut</div>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 border border-white/[0.08] rounded-lg p-2.5 flex items-center space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400">Miss Maksimal AI-4</div>
                      <div className="text-sm font-bold font-mono text-rose-400 tabular-nums">{evaluation.ai4Streak.maxLose}x berturut</div>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 border border-white/[0.08] rounded-lg p-2.5 flex items-center space-x-2.5">
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400">Streak Saat Ini AI-4</div>
                      <div className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
                        {evaluation.ai4Streak.current > 0
                          ? `+${evaluation.ai4Streak.current} Menang`
                          : `${evaluation.ai4Streak.current} Kalah`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-white/[0.08] text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Tier</th>
                        <th className="p-2">Hit</th>
                        <th className="p-2">Miss</th>
                        <th className="p-2">Akurasi</th>
                        <th className="p-2">Edge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-xs">
                      {([3, 4, 5, 6] as const).map((size) => {
                        const stat = evaluation.aiStats[size];
                        if (!stat) return null;
                        const misses = evaluation.testDraws - stat.hitCount;
                        const isPositive = stat.diff >= 0;
                        const edge = isPositive ? `+${stat.diff}` : `${stat.diff}`;
                        return (
                          <tr key={size} className={size === 4 ? 'bg-cyan-950/20 font-bold' : ''}>
                            <td className="p-2 text-white font-bold">AI-{size}</td>
                            <td className="p-2 text-emerald-400 tabular-nums">{stat.hitCount}x</td>
                            <td className="p-2 text-rose-400 tabular-nums">{misses}x</td>
                            <td className="p-2 text-emerald-400 tabular-nums">{stat.actualRate}%</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${
                                isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                {edge}%
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

      {/* 4. Mini Evaluasi & Statistik Streak Khusus AI (Desktop Only) */}
      {evaluation && (
        <div className="hidden lg:block bg-slate-900/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Performa Walk-Forward AI ({evaluation.testDraws} Putaran Terakhir)</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Target Evaluasi: <strong className="text-emerald-400">Min 1 Digit Masuk di 2D</strong>
            </span>
          </div>

          {/* Streak Stat Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-white/[0.08] rounded-xl p-3.5 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Win-Streak Maksimal AI-4</div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {evaluation.ai4Streak.maxWin}x{' '}
                  <span className="text-xs font-normal text-slate-500">berturut</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-white/[0.08] rounded-xl p-3.5 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Lose-Streak Maksimal AI-4</div>
                <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                  {evaluation.ai4Streak.maxLose}x{' '}
                  <span className="text-xs font-normal text-slate-500">berturut</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-white/[0.08] rounded-xl p-3.5 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Status Streak Terkini</div>
                <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                  {evaluation.ai4Streak.current > 0
                    ? `+${evaluation.ai4Streak.current}x Menang`
                    : `${evaluation.ai4Streak.current}x Kalah`}
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Akurasi AI */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3">Tier AI</th>
                  <th className="p-3">Tembus (Hits)</th>
                  <th className="p-3">Gagal (Miss)</th>
                  <th className="p-3">Akurasi Empiris</th>
                  <th className="p-3">Baseline Teori</th>
                  <th className="p-3 text-right">Edge (Keunggulan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono text-slate-300">
                {[3, 4, 5, 6].map((size) => {
                  const stat = evaluation.aiStats[size];
                  if (!stat) return null;
                  const misses = evaluation.testDraws - stat.hitCount;
                  const edge = stat.diff;
                  const isPositive = edge >= 0;
                  return (
                    <tr
                      key={size}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        size === 4 ? 'bg-cyan-950/20 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 text-white font-bold flex items-center space-x-1.5">
                        <span>AI-{size}</span>
                        {size === 4 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Utama
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-emerald-400 tabular-nums">{stat.hitCount}x</td>
                      <td className="p-3 text-rose-400 tabular-nums">{misses}x</td>
                      <td className="p-3 font-bold text-white">
                        <span className="text-emerald-400 font-mono text-sm tabular-nums">{stat.actualRate}%</span>
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
