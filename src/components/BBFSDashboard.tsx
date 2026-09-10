import React, { useState } from 'react';
import type { PredictionResult, EvaluationMetrics } from '../engine/types';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import { generateSmartTrim, generateSniperTrim, formatLines } from '../engine/generator';
import { SmartCalibrationCard } from './SmartCalibrationCard';
import { PolaTarungCard } from './PolaTarungCard';
import {
  Layers,
  Scissors,
  Bomb,
  Copy,
  Check,
  Sliders,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';

interface BBFSDashboardProps {
  prediction: PredictionResult | null;
  audit: CalibrationAudit | null;
  evaluation: EvaluationMetrics | null;
  marketName: string;
  onOpenGenerator: (digits: number[], tierName: string, mode?: 'full' | 'trimmer' | 'sniper') => void;
  onOpenSingleShare?: () => void;
  onToast?: (message: string) => void;
}

export const BBFSDashboard: React.FC<BBFSDashboardProps> = ({
  prediction,
  audit,
  marketName,
  onOpenGenerator,
  onOpenSingleShare,
  onToast
}) => {
  const [selectedTier, setSelectedTier] = useState<6 | 7 | 8 | 9>(7);
  const [trimmerTab, setTrimmerTab] = useState<'super_sniper' | 'sniper' | 'top10'>('super_sniper');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [betPerLine, setBetPerLine] = useState<number>(1000);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  if (!prediction) {
    return (
      <div className="glass-panel border border-white/[0.08] rounded-2xl p-8 text-center text-slate-400 text-sm">
        Memuat kalkulasi Engine BBFS...
      </div>
    );
  }

  const { lastDraw, bbfs, deadDigits } = prediction;
  const twinGap = audit?.twinGap ?? 0;
  const twinAnomaly = audit?.twinAnomalyLevel ?? 'NORMAL';

  // Smart Trimmer dari formasi tier terpilih
  const currentDigits = bbfs[selectedTier] || bbfs[7];
  const trimmed = generateSmartTrim(currentDigits);
  const top10 = trimmed.top10.slice(0, 10);
  const top10Text = formatLines(top10, 'space');
  const allLines = [...trimmed.top10, ...trimmed.medium15, ...trimmed.cadangan];
  const allLinesText = formatLines(allLines, 'space');

  // Sniper Paito & Shio Trimmer
  const sniper = prediction.paitoPrediction
    ? generateSniperTrim(currentDigits, prediction.paitoPrediction, false)
    : null;

  const superSniper = sniper?.superSniperShio ?? [];
  const superSniperText = formatLines(superSniper, 'space');
  const sniperTop = sniper?.sniperTop ?? [];
  const sniperTopText = formatLines(sniperTop, 'space');

  // Finansial kalkulasi 2D
  const discountRate = 0.29; // Diskon standar pasaran 29%
  const payoutRate = 70; // Hadiah 2D umum x70 (Rp 70.000 per Rp 1.000)
  const winPayout = betPerLine * payoutRate;
  const costSniper = Math.round(Math.max(1, sniperTop.length) * betPerLine * (1 - discountRate));
  const profitSniper = winPayout - costSniper;
  const costTop10 = Math.round(10 * betPerLine * (1 - discountRate));
  const costAll = Math.round(allLines.length * betPerLine * (1 - discountRate));
  const profitTop10 = winPayout - costTop10;
  const profitAll = winPayout - costAll;

  const triggerCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) navigator.vibrate(20);
    setCopiedKey(key);
    if (onToast) {
      onToast(`✓ ${label} disalin ke clipboard`);
    }
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const tierMeta: Record<6 | 7 | 8 | 9, { title: string; lines: number; coverage: string }> = {
    6: { title: 'BBFS-6 (Hemat)', lines: 30, coverage: '46.7%' },
    7: { title: 'BBFS-7 (Rekomendasi)', lines: 42, coverage: '63.3%' },
    8: { title: 'BBFS-8 (Safety)', lines: 56, coverage: '77.8%' },
    9: { title: 'BBFS-9 (Proteksi)', lines: 72, coverage: '90.0%' }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Bar: Target 2D Belakang & Anomali Twin */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Target BBFS 2D Belakang:</span>
              <span className="font-mono font-bold text-base text-white tracking-wider">
                {lastDraw.as}{lastDraw.kop}
                <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded ml-1 border border-purple-500/30">
                  {lastDraw.kepala}{lastDraw.ekor}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kedua digit 2D wajib berada di formasi BBFS terpilih
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] flex items-center space-x-2">
            <span className="text-slate-400">Twin Gap:</span>
            <span className="font-mono font-bold text-slate-200">{twinGap} draw</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 text-xs font-medium ${
            twinAnomaly !== 'NORMAL'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
          }`}>
            {twinAnomaly !== 'NORMAL' && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{twinAnomaly !== 'NORMAL' ? 'Waspada Twin' : 'Peluang Twin Normal'}</span>
          </div>
        </div>
      </div>

      {/* 2. Hero BBFS Card */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-purple-500/25 bg-gradient-to-b from-purple-950/20 via-slate-900/80 to-slate-950/90 shadow-xl">
        {/* Tier Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-1.5">
            {([6, 7, 8, 9] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTier === tier
                    ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/25 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/[0.06]'
                }`}
              >
                BBFS-{tier} {tier === 7 && '★'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Formasi: <span className="font-mono font-bold text-purple-300">{tierMeta[selectedTier].lines} Line</span> &bull; Cakupan: <span className="font-mono font-bold text-white">{tierMeta[selectedTier].coverage}</span>
          </div>
        </div>

        {/* Hero Digits Display */}
        <div className="py-6 sm:py-8 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-3">
            {tierMeta[selectedTier].title} &bull; {marketName}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 my-2">
            {currentDigits.map((digit, idx) => (
              <div
                key={idx}
                className="w-12 h-14 sm:w-16 sm:h-18 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-2 border-purple-500/40 flex items-center justify-center text-2xl sm:text-3xl font-mono font-black text-purple-200 shadow-lg shadow-purple-950/40 hover:border-purple-400 transition-colors"
              >
                {digit}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-3 max-w-md mx-auto">
            Kombinasi {selectedTier} digit terpilih untuk dipasang pada bolak-balik 2D, 3D, atau 4D.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => triggerCopy(currentDigits.join(''), 'hero-bbfs', `BBFS-${selectedTier} (${currentDigits.join('')})`)}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-purple-500/20 active:scale-[0.98]"
          >
            {copiedKey === 'hero-bbfs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'hero-bbfs' ? 'Tersalin!' : `Salin Digit (${currentDigits.join('')})`}</span>
          </button>

          <button
            onClick={() => triggerCopy(allLinesText, 'all-lines', `Semua ${allLines.length} Line`)}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-white/[0.08] transition-all active:scale-[0.98]"
          >
            {copiedKey === 'all-lines' ? <Check className="w-4 h-4 text-emerald-400" /> : <Layers className="w-4 h-4 text-purple-400" />}
            <span>{copiedKey === 'all-lines' ? 'Line Tersalin!' : `Salin ${allLines.length} Line 2D`}</span>
          </button>

          <button
            onClick={() => onOpenGenerator(currentDigits, `BBFS-${selectedTier}`, 'trimmer')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98]"
          >
            <Scissors className="w-4 h-4" />
            <span>Pangkas & Generate (2D/3D/4D)</span>
          </button>
        </div>
      </div>

      {/* 3. Dua Kolom: Top 10 Line BOM / Sniper Paito BOM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-purple-500/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-1.5 rounded-lg border ${
                    trimmerTab === 'sniper'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {trimmerTab === 'sniper' ? <Target className="w-4 h-4" /> : <Bomb className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {trimmerTab === 'super_sniper'
                      ? '🐴 Super Sniper Shio (Presisi Maksimal)'
                      : trimmerTab === 'sniper'
                      ? '🎯 Sniper Paito BOM (Top Biji & Paritas)'
                      : 'Top 10 Line BOM (Paling Siap Pasang)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {trimmerTab === 'super_sniper'
                      ? `Irisan BBFS-${selectedTier} + Top 3 Biji + Paritas + Top 3 Shio 2026 (Super Irit)`
                      : trimmerTab === 'sniper'
                      ? `Irisan BBFS-${selectedTier} + Top 3 Biji & Pola Paritas (Hemat ~${sniper?.efficiencyPct ?? 88}% Modal)`
                      : '10 line 2D dengan bobot skor probabilitas tertinggi'}
                  </p>
                </div>
              </div>

              {/* Mode Switcher & Copy Button */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setTrimmerTab('super_sniper')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      trimmerTab === 'super_sniper'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🐴 Super ({superSniper.length})
                  </button>
                  <button
                    onClick={() => setTrimmerTab('sniper')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      trimmerTab === 'sniper'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🎯 Sniper ({sniperTop.length})
                  </button>
                  <button
                    onClick={() => setTrimmerTab('top10')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      trimmerTab === 'top10'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Top 10
                  </button>
                </div>

                <button
                  onClick={() =>
                    trimmerTab === 'super_sniper'
                      ? triggerCopy(superSniperText, 'super_sniper', 'Super Sniper Shio BOM')
                      : trimmerTab === 'sniper'
                      ? triggerCopy(sniperTopText, 'sniper', 'Sniper BOM')
                      : triggerCopy(top10Text, 'top10', 'Top 10 Line BOM')
                  }
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 border ${
                    trimmerTab === 'super_sniper'
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                      : trimmerTab === 'sniper'
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {copiedKey === (trimmerTab === 'super_sniper' ? 'super_sniper' : trimmerTab === 'sniper' ? 'sniper' : 'top10') ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedKey === (trimmerTab === 'super_sniper' ? 'super_sniper' : trimmerTab === 'sniper' ? 'sniper' : 'top10')
                      ? 'Tersalin'
                      : trimmerTab === 'super_sniper'
                      ? `Salin ${superSniper.length} Line`
                      : trimmerTab === 'sniper'
                      ? `Salin ${sniperTop.length} Line`
                      : 'Salin 10 Line'}
                  </span>
                </button>
              </div>
            </div>

            {/* Clickable Line Pills */}
            <div
              className={`grid gap-2 my-4 ${
                trimmerTab === 'super_sniper'
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : trimmerTab === 'sniper'
                  ? 'grid-cols-3 sm:grid-cols-6'
                  : 'grid-cols-5'
              }`}
            >
              {(trimmerTab === 'super_sniper'
                ? (superSniper.length > 0 ? superSniper : sniperTop.slice(0, 3))
                : trimmerTab === 'sniper'
                ? (sniperTop.length > 0 ? sniperTop : top10.slice(0, 4))
                : top10
              ).map((line, idx) => {
                const isLineCopied = copiedKey === `line-${line}`;
                return (
                  <button
                    key={line}
                    onClick={() => triggerCopy(line, `line-${line}`, `Line ${line}`)}
                    className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 group relative ${
                      trimmerTab === 'super_sniper'
                        ? 'bg-slate-900/95 hover:bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400'
                        : trimmerTab === 'sniper'
                        ? 'bg-slate-900/95 hover:bg-amber-950/40 border-amber-500/30 hover:border-amber-400'
                        : 'bg-slate-900/90 hover:bg-purple-950/60 border-white/[0.08] hover:border-purple-500/40'
                    }`}
                    title="Klik untuk salin 1 line"
                  >
                    <div className="text-[10px] text-slate-500 font-mono">
                      {trimmerTab === 'super_sniper'
                        ? `🐴 SHIO #${idx + 1}`
                        : trimmerTab === 'sniper'
                        ? `🎯 BOM #${idx + 1}`
                        : `#${idx + 1}`}
                    </div>
                    <div
                      className={`font-mono font-bold text-base mt-0.5 ${
                        trimmerTab === 'super_sniper'
                          ? 'text-emerald-300 group-hover:text-emerald-200'
                          : trimmerTab === 'sniper'
                          ? 'text-amber-300 group-hover:text-amber-200'
                          : 'text-purple-200 group-hover:text-purple-100'
                      }`}
                    >
                      {line}
                    </div>
                    {isLineCopied && (
                      <span className="absolute inset-0 bg-emerald-950/90 rounded-xl border border-emerald-500/50 flex items-center justify-center text-emerald-300 text-[10px] font-bold">
                        OK
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Klik pada angka untuk menyalin satuan.</span>
            <div className="flex items-center space-x-3">
              {onOpenSingleShare && (
                <button
                  onClick={onOpenSingleShare}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Buka format salin WhatsApp lengkap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Format Salin WA &rarr;</span>
                </button>
              )}
              <button
                onClick={() => onOpenGenerator(currentDigits, `BBFS-${selectedTier}`, 'sniper')}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
              >
                <span>🎯 Buka Modal Sniper &rarr;</span>
              </button>
              <button
                onClick={() => onOpenGenerator(currentDigits, `BBFS-${selectedTier}`, 'trimmer')}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
              >
                <span>Medium & Cadangan &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (1 col): 2 Digit Mati (Eliminasi) */}
        <div className="glass-panel rounded-2xl p-5 border border-rose-500/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">2 Digit Mati (Eliminasi)</h3>
                <p className="text-[11px] text-slate-400">Probabilitas kemunculan terendah</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 my-6">
              {deadDigits.slice(0, 2).map((digit, idx) => (
                <div
                  key={idx}
                  className="w-14 h-16 rounded-2xl bg-rose-950/30 border-2 border-rose-500/40 flex items-center justify-center text-3xl font-mono font-bold text-rose-300/80 relative"
                  title={`Digit ${digit} dieliminasi`}
                >
                  <span className="line-through decoration-rose-500 decoration-2">{digit}</span>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    ✕
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Dua angka dengan frekuensi & afinitas matriks pasangan terendah. Disarankan coret sepenuhnya dari racikan.
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-center">
            <span className="text-[11px] font-mono text-rose-400/90">
              Analisis eliminasi 2D akurat &bull; Zero risk pruning
            </span>
          </div>
        </div>
      </div>

      {/* 4. Pola Tarung 2D: Kepala vs Ekor Berdasarkan Dinamika Pergerakan */}
      <PolaTarungCard
        polaTarung={prediction.polaTarung}
        marketName={marketName}
        onToast={onToast}
      />

      {/* 5. Kalkulator Investasi Finansial 2D (Clean & Compact) */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white">Simulasi Modal & Estimasi Profit 2D</h3>
            <p className="text-xs text-slate-400">Hitungan riil dengan diskon pasaran 29% dan hadiah 2D x70</p>
          </div>

          {/* Quick Bet Preset Chips */}
          <div className="flex items-center space-x-1.5">
            {[500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetPerLine(amt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  betPerLine === amt
                    ? 'bg-purple-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Rp {amt.toLocaleString('id-ID')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sniper BOM Scenario */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-amber-500/20 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-amber-300">🎯 Opsi 1: Sniper BOM</span>
              <span className="font-mono text-amber-400/90 font-bold">{Math.max(1, sniperTop.length)} line (Hemat ~90%)</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal Bersih (Disc 29%):</span>
                <span>Rp {costSniper.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hadiah Menang (x70):</span>
                <span>Rp {winPayout.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/[0.08] font-bold text-amber-400 text-sm">
                <span>Profit Bersih:</span>
                <span>+Rp {profitSniper.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Top 10 Line Scenario */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-purple-300">💣 Opsi 2: Top 10 Line</span>
              <span className="font-mono">10 line (Hemat 76%)</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal Bersih (Disc 29%):</span>
                <span>Rp {costTop10.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hadiah Menang (x70):</span>
                <span>Rp {winPayout.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/[0.08] font-bold text-emerald-400 text-sm">
                <span>Profit Bersih:</span>
                <span>+Rp {profitTop10.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Full Line Scenario */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">🛡️ Opsi 3: Semua BBFS-{selectedTier}</span>
              <span className="font-mono">{allLines.length} line</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal Bersih (Disc 29%):</span>
                <span>Rp {costAll.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hadiah Menang (x70):</span>
                <span>Rp {winPayout.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/[0.08] font-bold text-cyan-400 text-sm">
                <span>Profit Bersih:</span>
                <span>+Rp {profitAll.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
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
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-300">
                Detail Audit Kalibrasi BBFS & Metrik Stabilitas
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>{showAdvanced ? 'Tutup' : 'Lihat Detail'}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {showAdvanced && (
            <div className="p-4 border-t border-white/[0.06] bg-slate-950/40">
              <SmartCalibrationCard audit={audit} marketName={marketName} mode="bbfs" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
