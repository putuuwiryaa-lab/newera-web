import React, { useState } from 'react';
import type { PredictionResult, EvaluationMetrics } from '../engine/types';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import {
  Sparkles,
  Copy,
  Check,
  Target,
  Share2,
  Lock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { SmartCalibrationCard } from './SmartCalibrationCard';

interface AIDashboardProps {
  prediction: PredictionResult | null;
  audit: CalibrationAudit | null;
  evaluation: EvaluationMetrics | null;
  marketName: string;
  onToast?: (message: string) => void;
  onOpenSingleShare?: () => void;
}

export const AIDashboard: React.FC<AIDashboardProps> = ({
  prediction,
  audit,
  marketName,
  onToast,
  onOpenSingleShare
}) => {
  const [selectedTier, setSelectedTier] = useState<3 | 4 | 5 | 6>(4);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!prediction) {
    return (
      <div className="glass-panel border border-white/[0.08] rounded-2xl p-8 text-center text-slate-400 text-sm">
        Memuat kalkulasi Engine AI...
      </div>
    );
  }

  const { lastDraw, ai, methodWeights, confidenceScore, convergenceStatus } = prediction;

  const triggerCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) navigator.vibrate(20);
    setCopiedKey(key);
    if (onToast) {
      onToast(`✓ ${label} disalin ke clipboard`);
    }
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const activeDigits = ai[selectedTier] || ai[4];
  const activeDigitsStr = activeDigits.join(' ');
  const polaTarungStr = prediction.polaTarung
    ? `Kepala: ${prediction.polaTarung.rankedKepala.slice(0, 4).join(',')} | Ekor: ${prediction.polaTarung.rankedEkor.slice(0, 4).join(',')}`
    : `AI-${selectedTier}: ${activeDigits.join(',')}`;

  const shareWA = () => {
    if (onOpenSingleShare) {
      onOpenSingleShare();
      return;
    }
    const text = `🔥 AI-${selectedTier} ${marketName} 🔥\nDigit: ${activeDigits.join(' ')}\n${polaTarungStr}\nvia VORTEX 2D`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isFrozen = audit?.aiAudit?.tierAudits?.[selectedTier]?.action === 'FREEZE';

  const tierMeta: Record<3 | 4 | 5 | 6, { title: string; desc: string; baseRate: string }> = {
    3: { title: 'AI-3 (Hemat)', desc: 'Modal kecil, 3 digit pilihan terkuat', baseRate: '51%' },
    4: { title: 'AI-4 (Rekomendasi)', desc: 'Keseimbangan terbaik hit rate vs modal', baseRate: '64%' },
    5: { title: 'AI-5 (Aman)', desc: 'Cakupan lebih luas untuk safety play', baseRate: '75%' },
    6: { title: 'AI-6 (Proteksi)', desc: 'Proteksi tinggi, cakupan 60% pool angka', baseRate: '84%' }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Bar: Target 2D & Status Konsensus */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Result Terakhir 2D:</span>
              <span className="font-mono font-bold text-base text-white tracking-wider">
                {lastDraw.as}{lastDraw.kop}
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1 border border-emerald-500/30">
                  {lastDraw.kepala}{lastDraw.ekor}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target: Min. 1 digit prediksi wajib tembus di posisi <strong>Kepala</strong> atau <strong>Ekor</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Konsensus:</span>
            <span className="font-mono font-bold text-cyan-300">{confidenceScore}%</span>
            <span className="text-[10px] text-slate-500">({convergenceStatus})</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 text-xs font-medium ${
            isFrozen
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          }`}>
            <Lock className="w-3 h-3" />
            <span>{isFrozen ? 'Bobot Terkalibrasi' : 'Penyetelan Aktif'}</span>
          </div>
        </div>
      </div>

      {/* 2. Hero AI Card: Big Digit Display + 1-Tap Copy */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-cyan-500/25 bg-gradient-to-b from-cyan-950/20 via-slate-900/80 to-slate-950/90 shadow-xl">
        {/* Tier Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-1.5">
            {([3, 4, 5, 6] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTier === tier
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/[0.06]'
                }`}
              >
                AI-{tier} {tier === 4 && '★'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Peluang Base Teoretis: <span className="font-mono font-bold text-cyan-300">{tierMeta[selectedTier].baseRate}</span>
          </div>
        </div>

        {/* Hero Digits */}
        <div className="py-6 sm:py-8 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-3">
            {tierMeta[selectedTier].title} &bull; {marketName}
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 my-2">
            {activeDigits.map((digit, idx) => (
              <div
                key={idx}
                className="w-14 h-16 sm:w-18 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-2 border-cyan-500/40 flex items-center justify-center text-3xl sm:text-4xl font-mono font-black text-white shadow-lg shadow-cyan-950/40 hover:border-cyan-400 transition-colors"
              >
                {digit}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-3 max-w-md mx-auto">
            {tierMeta[selectedTier].desc}. Gunakan sebagai angka ikut 2D (Kepala atau Ekor).
          </p>
        </div>

        {/* Action Buttons Bar (1-Tap Copy & Share) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => triggerCopy(activeDigitsStr, 'hero-digits', `AI-${selectedTier} [${activeDigitsStr}]`)}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
          >
            {copiedKey === 'hero-digits' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'hero-digits' ? 'Tersalin!' : `Salin Digit (${activeDigitsStr})`}</span>
          </button>

          <button
            onClick={() => triggerCopy(polaTarungStr, 'hero-pola', 'Pola Tarung')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-white/[0.08] transition-all active:scale-[0.98]"
          >
            {copiedKey === 'hero-pola' ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
            <span>{copiedKey === 'hero-pola' ? 'Pola Tersalin!' : 'Salin Pola Tarung'}</span>
          </button>

          <button
            onClick={shareWA}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 3. Ringkasan 4 Tier Sekaligus (Quick Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([3, 4, 5, 6] as const).map((sz) => {
          const digits = ai[sz] || [];
          const isStar = sz === 4;
          const isCopied = copiedKey === `tier-${sz}`;

          return (
            <div
              key={sz}
              className={`p-4 rounded-xl border transition-all ${
                isStar
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/60 border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isStar ? 'text-cyan-300' : 'text-slate-200'}`}>
                  AI-{sz} {isStar ? '★ Rekomendasi' : ''}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {tierMeta[sz].baseRate}
                </span>
              </div>

              <div className="flex items-center justify-between my-2">
                <span className="font-mono font-bold text-lg text-white tracking-widest">
                  {digits.join(' ')}
                </span>
                <button
                  onClick={() => triggerCopy(digits.join(' '), `tier-${sz}`, `AI-${sz}`)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  title={`Salin AI-${sz}`}
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                {tierMeta[sz].desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* 4. Bobot 4 Algoritma Penentu (Clean, Quiet Strip) */}
      <div className="glass-panel rounded-xl p-4 border border-white/[0.06] bg-slate-950/50">
        <div className="flex items-center justify-between mb-2.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Kontribusi Bobot 4 Algoritma:</span>
          <span className="font-mono text-[11px]">Multiplicative Weights Update</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {Object.entries(methodWeights).map(([name, weight]) => {
            const total = Object.values(methodWeights).reduce((a, b) => a + b, 0) || 1;
            const pct = Math.round((weight / total) * 100);
            return (
              <div key={name} className="bg-slate-900/80 p-2.5 rounded-lg border border-white/[0.06] flex flex-col">
                <span className="text-[11px] text-slate-400 capitalize">{name}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-bold text-white text-sm">{weight.toFixed(1)}x</span>
                  <span className="text-cyan-400 font-semibold text-[11px]">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Collapsible Advanced Calibration Details */}
      {audit && (
        <div className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">
                Detail Audit Kalibrasi & Proteksi Anti-Osilasi
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>{showAdvanced ? 'Tutup' : 'Lihat Detail'}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {showAdvanced && (
            <div className="p-4 border-t border-white/[0.06] bg-slate-950/40">
              <SmartCalibrationCard audit={audit} marketName={marketName} mode="ai" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
