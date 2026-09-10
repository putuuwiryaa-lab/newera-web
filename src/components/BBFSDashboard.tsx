import React, { useState } from 'react';
import type { PredictionResult, EvaluationMetrics } from '../engine/types';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import { generateSmartTrim, generateSniperTrim, formatLines } from '../engine/generator';
import { SmartCalibrationCard } from './SmartCalibrationCard';
import { PolaTarungCard } from './PolaTarungCard';
import { LiveFilterBar } from './LiveFilterBar';
import { TriadKumatCard } from './TriadKumatCard';
import {
  Layers,
  Bomb,
  Copy,
  Check,
  Sliders,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  MessageCircle,
  Flame,
  Zap,
  Sparkles
} from 'lucide-react';

interface BBFSDashboardProps {
  prediction: PredictionResult | null;
  audit: CalibrationAudit | null;
  evaluation: EvaluationMetrics | null;
  marketName: string;
  onOpenGenerator: (digits: number[], tierName: string, mode?: 'full' | 'trimmer' | 'sniper' | 'wheeling') => void;
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
  // Engine Variant: Paito Pro (Default/Rekomendasi) vs Adaptif Klasik
  const [bbfsVariant, setBbfsVariant] = useState<'paito_pro' | 'adaptive'>('paito_pro');
  const [selectedTier, setSelectedTier] = useState<6 | 7 | 8 | 9>(7);
  const [trimmerTab, setTrimmerTab] = useState<'nuklir' | 'bom12' | 'invest20' | 'full42' | 'super_sniper' | 'sniper'>('nuklir');
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

  const { lastDraw, bbfs, deadDigits, paitoBBFS7 } = prediction;
  const twinGap = audit?.twinGap ?? 0;
  const twinAnomaly = audit?.twinAnomalyLevel ?? 'NORMAL';

  // Tentukan Digit Formasi Aktif:
  // Jika Paito Pro aktif: gunakan 7 digit hasil sintesis paito 2D
  // Jika Adaptif Klasik aktif: gunakan bbfs[selectedTier]
  const currentDigits = bbfsVariant === 'paito_pro'
    ? (paitoBBFS7?.digits || bbfs[7])
    : (bbfs[selectedTier] || bbfs[7]);

  const trimmed = generateSmartTrim(currentDigits);
  const allLines = trimmed.full42;
  const allLinesText = formatLines(allLines, 'space');

  // Sniper Paito & Shio Trimmer
  const sniper = prediction.paitoPrediction
    ? generateSniperTrim(currentDigits, prediction.paitoPrediction, false)
    : null;

  const superSniper = sniper?.superSniperShio ?? [];
  const superSniperText = formatLines(superSniper, 'space');
  const sniperTop = sniper?.sniperTop ?? [];
  const sniperTopText = formatLines(sniperTop, 'space');

  // Garis-garis Hierarki Presisi:
  const nuklirLines = paitoBBFS7?.nuklir6 || trimmed.bom12.slice(0, 6);
  const nuklirText = formatLines(nuklirLines, 'space');

  const bom12Lines = paitoBBFS7?.bom12 || trimmed.bom12;
  const bom12Text = formatLines(bom12Lines, 'space');

  const invest20Lines = paitoBBFS7?.invest20 || trimmed.invest20;
  const invest20Text = formatLines(invest20Lines, 'space');

  const full42Lines = paitoBBFS7?.full42 || allLines;
  const full42Text = formatLines(full42Lines, 'space');

  // Tentukan baris mana yang aktif di tab trimmer saat ini
  let activeTabLines: string[] = nuklirLines;
  let activeTabText = nuklirText;
  let activeTabLabel = 'Super Nuklir (6 Line)';

  if (trimmerTab === 'bom12') {
    activeTabLines = bom12Lines;
    activeTabText = bom12Text;
    activeTabLabel = 'BOM Utama (12 Line)';
  } else if (trimmerTab === 'invest20') {
    activeTabLines = invest20Lines;
    activeTabText = invest20Text;
    activeTabLabel = 'Investasi (20 Line)';
  } else if (trimmerTab === 'full42') {
    activeTabLines = full42Lines;
    activeTabText = full42Text;
    activeTabLabel = `Proteksi Penuh (${full42Lines.length} Line)`;
  } else if (trimmerTab === 'super_sniper') {
    activeTabLines = superSniper.length > 0 ? superSniper : nuklirLines;
    activeTabText = superSniper.length > 0 ? superSniperText : nuklirText;
    activeTabLabel = `Super Sniper Shio (${activeTabLines.length} Line)`;
  } else if (trimmerTab === 'sniper') {
    activeTabLines = sniperTop.length > 0 ? sniperTop : bom12Lines;
    activeTabText = sniperTop.length > 0 ? sniperTopText : bom12Text;
    activeTabLabel = `Sniper BOM (${activeTabLines.length} Line)`;
  }

  // Finansial kalkulasi 2D
  const discountRate = 0.29; // Diskon standar pasaran 29%
  const payoutRate = 70; // Hadiah 2D umum x70 (Rp 70.000 per Rp 1.000)
  const winPayout = betPerLine * payoutRate;

  const costActive = Math.round(activeTabLines.length * betPerLine * (1 - discountRate));
  const profitActive = winPayout - costActive;

  const costNuklir = Math.round(nuklirLines.length * betPerLine * (1 - discountRate));
  const profitNuklir = winPayout - costNuklir;

  const costBom12 = Math.round(bom12Lines.length * betPerLine * (1 - discountRate));
  const profitBom12 = winPayout - costBom12;

  const costInvest20 = Math.round(invest20Lines.length * betPerLine * (1 - discountRate));
  const profitInvest20 = winPayout - costInvest20;

  const costAll = Math.round(allLines.length * betPerLine * (1 - discountRate));
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
    7: { title: 'BBFS-7 (Sweet Spot)', lines: 42, coverage: '63.3%' },
    8: { title: 'BBFS-8 (Safety)', lines: 56, coverage: '77.8%' },
    9: { title: 'BBFS-9 (Proteksi)', lines: 72, coverage: '90.0%' }
  };

  const balance = paitoBBFS7?.spectrumBalance;

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

      {/* 2. Hero BBFS Card dengan Engine Variant Selector */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-purple-500/25 bg-gradient-to-b from-purple-950/20 via-slate-900/80 to-slate-950/90 shadow-xl">
        {/* Engine Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setBbfsVariant('paito_pro');
                setSelectedTier(7);
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bbfsVariant === 'paito_pro'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/25 scale-[1.02]'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-white/[0.06]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>BBFS-7 Paito Pro (Rekomendasi)</span>
            </button>

            <button
              onClick={() => setBbfsVariant('adaptive')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                bbfsVariant === 'adaptive'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adaptif Klasik</span>
            </button>
          </div>

          {/* Tier Selector (Aktif untuk Mode Adaptif atau opsional) */}
          {bbfsVariant === 'adaptive' ? (
            <div className="flex items-center space-x-1">
              {([6, 7, 8, 9] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedTier === tier
                      ? 'bg-purple-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  BBFS-{tier}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-amber-400 font-bold">★ Sweet Spot Formasi 7 Digit</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-300">42 Line 2D</span>
            </div>
          )}
        </div>

        {/* Hero Digits Display */}
        <div className="py-6 sm:py-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              {bbfsVariant === 'paito_pro' ? 'BBFS-7 Paito Pro 2D' : tierMeta[selectedTier].title} &bull; {marketName}
            </span>
            {bbfsVariant === 'paito_pro' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Sintesis Paito Lengkap
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 my-2">
            {currentDigits.map((digit, idx) => (
              <div
                key={idx}
                className={`w-12 h-14 sm:w-16 sm:h-18 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-mono font-black shadow-lg transition-all ${
                  bbfsVariant === 'paito_pro'
                    ? 'bg-gradient-to-b from-slate-800 to-amber-950/40 border-2 border-amber-500/40 text-amber-200 shadow-amber-950/40 hover:border-amber-400'
                    : 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-2 border-purple-500/40 text-purple-200 shadow-purple-950/40 hover:border-purple-400'
                }`}
              >
                {digit}
              </div>
            ))}
          </div>

          {/* Spectrum & Balance Badges */}
          {bbfsVariant === 'paito_pro' && balance && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-slate-300">
                ⚖️ Nilai: <strong className="text-amber-300">{balance.besarCount} Besar</strong> / <strong className="text-cyan-300">{balance.kecilCount} Kecil</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-slate-300">
                ⚡ Paritas: <strong className="text-amber-300">{balance.genapCount} Genap</strong> / <strong className="text-cyan-300">{balance.ganjilCount} Ganjil</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                balance.isBalanced
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-white/[0.06]'
              }`}>
                Entropi: {Math.round(balance.entropyScore)}%
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            {bbfsVariant === 'paito_pro'
              ? 'Formasi 7 digit terunggul hasil konsensus Top 3 Biji, Osilasi Paritas Kinetik, Shio 2026, dan Heatmap 10x10.'
              : `Kombinasi ${selectedTier} digit terpilih dari mesin adaptif klasik.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => triggerCopy(currentDigits.join(''), 'hero-bbfs', `BBFS-7 (${currentDigits.join('')})`)}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-orange-500/20 active:scale-[0.98]"
          >
            {copiedKey === 'hero-bbfs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'hero-bbfs' ? 'Tersalin!' : `Salin Digit (${currentDigits.join('')})`}</span>
          </button>

          <button
            onClick={() => triggerCopy(nuklirText, 'nuklir-fast', '6 Line Super Nuklir')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-md shadow-red-600/25 active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Salin 6 Line Nuklir</span>
          </button>

          <button
            onClick={() => triggerCopy(allLinesText, 'all-lines', `Semua ${allLines.length} Line`)}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-white/[0.08] transition-all active:scale-[0.98]"
          >
            {copiedKey === 'all-lines' ? <Check className="w-4 h-4 text-emerald-400" /> : <Layers className="w-4 h-4 text-purple-400" />}
            <span>{copiedKey === 'all-lines' ? 'Tersalin!' : `Salin ${allLines.length} Line Full`}</span>
          </button>

          <button
            onClick={() => onOpenGenerator(currentDigits, bbfsVariant === 'paito_pro' ? 'BBFS-7 Paito Pro' : `BBFS-${selectedTier}`, 'wheeling')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>🎡 Wheeling 3D/4D</span>
          </button>
        </div>
      </div>

      {/* 3. Dua Kolom: Trimmer Hierarki Presisi & 3 Triad Kumat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kolom Kiri (2 cols): Trimmer Hierarki Presisi */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-purple-500/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bomb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Pemangkasan Hierarkis Presisi 2D
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih tier konsentrasi modal dari 6 line Super Nuklir hingga 42 line Proteksi
                  </p>
                </div>
              </div>

              {/* Trimmer Mode Switcher Tabs */}
              <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-white/[0.08] gap-0.5">
                <button
                  onClick={() => setTrimmerTab('nuklir')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    trimmerTab === 'nuklir'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Nuklir (6)
                </button>
                <button
                  onClick={() => setTrimmerTab('bom12')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    trimmerTab === 'bom12'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💣 BOM (12)
                </button>
                <button
                  onClick={() => setTrimmerTab('invest20')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    trimmerTab === 'invest20'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🛡️ Invest (20)
                </button>
                <button
                  onClick={() => setTrimmerTab('full42')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    trimmerTab === 'full42'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full (42)
                </button>
                <button
                  onClick={() => setTrimmerTab('super_sniper')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    trimmerTab === 'super_sniper'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🐴 Shio
                </button>
              </div>
            </div>

            {/* Sub-header text describing current active tab */}
            <div className="flex items-center justify-between text-xs text-slate-400 py-1.5 px-3 bg-slate-950/50 rounded-xl border border-white/[0.05] my-2">
              <span className="font-medium text-slate-300">{activeTabLabel}:</span>
              <span className="font-mono text-amber-300 font-semibold">
                Modal Bersih: Rp {costActive.toLocaleString('id-ID')} &bull; Win Net: +Rp {profitActive.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Clickable Line Chips Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-3 max-h-48 overflow-y-auto p-1">
              {activeTabLines.map((line, idx) => {
                const isLineCopied = copiedKey === `line-${line}`;
                return (
                  <button
                    key={line}
                    onClick={() => triggerCopy(line, `line-${line}`, `Line ${line}`)}
                    className={`p-2 rounded-xl border text-center transition-all active:scale-95 group relative ${
                      trimmerTab === 'nuklir'
                        ? 'bg-slate-900/95 hover:bg-red-950/40 border-red-500/30 hover:border-red-400'
                        : trimmerTab === 'bom12'
                        ? 'bg-slate-900/95 hover:bg-amber-950/40 border-amber-500/30 hover:border-amber-400'
                        : trimmerTab === 'invest20'
                        ? 'bg-slate-900/95 hover:bg-cyan-950/40 border-cyan-500/30 hover:border-cyan-400'
                        : 'bg-slate-900/90 hover:bg-purple-950/60 border-white/[0.08] hover:border-purple-500/40'
                    }`}
                    title="Klik untuk salin 1 line"
                  >
                    <div className="text-[10px] text-slate-500 font-mono">
                      #{idx + 1}
                    </div>
                    <div className={`font-mono font-black text-base mt-0.5 ${
                      trimmerTab === 'nuklir'
                        ? 'text-red-300 group-hover:text-red-200'
                        : trimmerTab === 'bom12'
                        ? 'text-amber-300 group-hover:text-amber-200'
                        : trimmerTab === 'invest20'
                        ? 'text-cyan-300 group-hover:text-cyan-200'
                        : 'text-purple-200 group-hover:text-purple-100'
                    }`}>
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

          {/* Action Row */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <button
              onClick={() => triggerCopy(activeTabText, trimmerTab, activeTabLabel)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold transition-all active:scale-95"
            >
              {copiedKey === trimmerTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === trimmerTab ? 'Tersalin' : `Salin Semua (${activeTabLines.length} Line)`}</span>
            </button>

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
                onClick={() => onOpenGenerator(currentDigits, bbfsVariant === 'paito_pro' ? 'BBFS-7 Paito Pro' : `BBFS-${selectedTier}`, 'trimmer')}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
              >
                <span>Buka Modal Lengkap &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (1 col): 3 Triad Kumat (Digit Buang Paito) */}
        <TriadKumatCard
          triadKumat={paitoBBFS7?.triadKumat}
          fallbackDeadDigits={deadDigits}
          onToast={onToast}
        />
      </div>

      {/* 4. Live Dynamic Filter Bar Interaktif */}
      <LiveFilterBar
        allLines={full42Lines}
        recommendedBiji={prediction.paitoPrediction?.topBiji}
        recommendedParity={prediction.paitoPrediction?.primaryParity}
        onToast={onToast}
      />

      {/* 5. Pola Tarung 2D: Kepala vs Ekor Berdasarkan Dinamika Pergerakan */}
      <PolaTarungCard
        polaTarung={prediction.polaTarung}
        marketName={marketName}
        onToast={onToast}
      />

      {/* 6. Kalkulator Investasi Finansial 2D (Clean & Compact) */}
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
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Rp {amt.toLocaleString('id-ID')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Super Nuklir 6 Line */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-red-500/25 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-red-300">⚡ Super Nuklir</span>
              <span className="font-mono text-red-400/90 font-bold">6 line</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal:</span>
                <span>Rp {costNuklir.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.08] font-bold text-red-400 text-sm">
                <span>Profit Net:</span>
                <span>+Rp {profitNuklir.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* BOM 12 Line */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-amber-500/25">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-amber-300">💣 BOM Utama</span>
              <span className="font-mono text-amber-400/90 font-bold">12 line</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal:</span>
                <span>Rp {costBom12.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.08] font-bold text-amber-400 text-sm">
                <span>Profit Net:</span>
                <span>+Rp {profitBom12.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Invest 20 Line */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-cyan-500/25">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-cyan-300">🛡️ Investasi</span>
              <span className="font-mono text-cyan-400/90 font-bold">20 line</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal:</span>
                <span>Rp {costInvest20.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.08] font-bold text-cyan-400 text-sm">
                <span>Profit Net:</span>
                <span>+Rp {profitInvest20.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Full Line */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-300">🌐 Proteksi Penuh</span>
              <span className="font-mono">{allLines.length} line</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Modal:</span>
                <span>Rp {costAll.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.08] font-bold text-emerald-400 text-sm">
                <span>Profit Net:</span>
                <span>+Rp {profitAll.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Collapsible Advanced Calibration Details */}
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
