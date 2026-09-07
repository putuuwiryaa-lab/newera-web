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
  Layers2
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

  if (!prediction) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Hero BBFS: Target Result 2D, Dead Digits, & Twin Anomaly */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-950 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Result 2D Belakang & Twin Indicator */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 tracking-wide uppercase">
                <Layers className="w-3.5 h-3.5 mr-1 text-purple-400" />
                Target BBFS 2D Belakang
              </span>
              <span className="text-xs text-gray-400">
                2 Digit harus tembus di 2D; Twin lolos bila ada di BBFS
              </span>
            </div>

            <div className="mt-3 flex items-center space-x-3">
              <div className="flex items-center space-x-2 font-mono">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-purple-300 font-bold uppercase font-sans tracking-wider">
                    Kepala
                  </span>
                  <span className="w-11 h-12 bg-purple-950/50 border-2 border-purple-500/70 rounded-xl flex items-center justify-center text-xl font-extrabold text-purple-200 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30">
                    {lastDraw.kepala}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-purple-300 font-bold uppercase font-sans tracking-wider">
                    Ekor
                  </span>
                  <span className="w-11 h-12 bg-purple-950/50 border-2 border-purple-500/70 rounded-xl flex items-center justify-center text-xl font-extrabold text-purple-200 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30">
                    {lastDraw.ekor}
                  </span>
                </div>
              </div>

              <div className="pl-3 border-l border-gray-800 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-gray-400">Result 2D:</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 font-mono font-extrabold text-purple-300 text-sm tracking-wider">
                    [{lastDraw.kepala}{lastDraw.ekor}]
                  </span>
                </div>
                <div>
                  {lastDraw.kepala === lastDraw.ekor ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                      Angka Kembar (TWIN)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800/80 text-gray-300 border border-gray-700/50">
                      Non-Twin (Biasa)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2 Widget: 2 Digit Terlemah (Dead Digits) & Indeks Twin Anomaly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
            {/* Dead Digits Card (Elimination Chamber) */}
            <div className="bg-gray-950/90 border border-rose-500/30 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-200">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>2 Digit Terlemah</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 tracking-wider">
                  ELIMINASI
                </span>
              </div>

              <div className="flex items-center space-x-2.5 my-1.5">
                {deadDigits.map((d, i) => (
                  <span
                    key={i}
                    className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center font-mono font-extrabold text-rose-400 text-base line-through shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/30"
                    title={`Digit ${d} direkomendasikan untuk dieliminasi dari BBFS`}
                  >
                    {d}
                  </span>
                ))}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-300">Konektivitas Terendah</span>
                  <span className="text-[10px] text-gray-500">Matriks Densitas 2D 14 Putaran</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Diisolasi otomatis oleh Engine. Sangat disarankan dibuang/dimatikan pada peracikan line.
              </p>
            </div>

            {/* Twin Anomaly Index Card with Visual Gauge */}
            <div className="bg-gray-950/90 border border-gray-800/90 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Anomali Kembar 2D</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    twinAnomaly === 'EKSTREM'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : twinAnomaly === 'MENINGKAT'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {twinAnomaly}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                  {twinGap}
                </span>
                <span className="text-[11px] text-gray-400">Putaran Tanpa Kembar</span>
              </div>

              {/* Progress gauge vs theoretical threshold (10 draws cycle) */}
              <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-gray-800 mt-1 mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    twinGap >= 15
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                      : twinGap >= 9
                      ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (twinGap / 20) * 100)}%` }}
                />
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed">
                {twinAnomaly === 'EKSTREM'
                  ? 'Kemarau twin ekstrem (>15x)! Segera aktifkan opsi +Twin pada BBFS.'
                  : twinAnomaly === 'MENINGKAT'
                  ? 'Peluang twin mulai meningkat. Pertimbangkan proteksi cadangan twin.'
                  : 'Distribusi twin masih dalam ambang batas probabilitas normal (10%).'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Smart Audit Khusus BBFS */}
      <SmartCalibrationCard audit={audit} marketName={marketName} mode="bbfs" />

      {/* 3. Kartu Prediksi BBFS (6 - 9 Digit) */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-800 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                PREDIKSI BBFS 2D (BOLAK BALIK FULL SET)
              </h3>
              <p className="text-xs text-gray-400">
                Optimasi Joint-Density Pasangan 2D independen. Buka generator untuk memangkas line cerdas.
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
                    ? 'bg-gradient-to-br from-purple-950/40 via-gray-900 to-gray-950 border-purple-500/50 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/30'
                    : 'bg-gray-950/70 border-gray-800/90 hover:border-gray-700/90 shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-bold tracking-wide ${
                        star ? 'text-purple-300 font-extrabold' : 'text-white'
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${
                        star
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-gray-800 text-gray-400 border border-gray-700/50'
                      }`}
                    >
                      {badge}
                    </span>
                    {audit?.bbfsAudit?.tierAudits?.[size] && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono tracking-wider ${
                          audit.bbfsAudit.tierAudits[size].action === 'FREEZE'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        }`}
                        title={audit.bbfsAudit.tierAudits[size].marginalNote}
                      >
                        {audit.bbfsAudit.tierAudits[size].action === 'FREEZE'
                          ? `🔒 FREEZE (BBFS-${size} HIT)`
                          : `⚡ KALIBRASI (BBFS-${size} ZONK)`}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-gray-900 border border-gray-800 font-mono text-gray-400">
                    Baseline: <strong className="text-gray-300">{baseline}</strong> ({lines} Line)
                  </span>
                </div>

                {audit?.bbfsAudit?.tierAudits?.[size] && (
                  <div className="mb-2 text-[10px] font-mono flex items-center justify-between">
                    <span className={audit.bbfsAudit.tierAudits[size].action === 'FREEZE' ? 'text-purple-300 font-semibold' : 'text-rose-400 font-semibold'}>
                      {audit.bbfsAudit.tierAudits[size].action === 'FREEZE'
                        ? `✓ Parameter BBFS-${size} Dipertahankan (Freeze)`
                        : `✗ Parameter BBFS-${size} Direset/Dikalibrasi Ulang`}
                    </span>
                    <span className="text-gray-500 truncate ml-2">
                      {audit.bbfsAudit.tierAudits[size].marginalNote}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 pt-1">
                  <div className="flex items-center space-x-1.5">
                    {digits.map((d, i) => (
                      <span
                        key={i}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm transition-all duration-150 hover:-translate-y-0.5 shadow-sm ${
                          star
                            ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50 shadow-purple-500/20 ring-1 ring-purple-500/20'
                            : 'bg-gray-900 text-white border border-gray-700/80 hover:border-gray-600'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenGenerator(digits, label, 'full')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 shadow-md ${
                        star
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25'
                          : 'bg-purple-600/80 hover:bg-purple-600 text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate</span>
                    </button>

                    <button
                      onClick={() => handleCopy(digitStr, `bbfs-${size}`)}
                      className={`p-2 rounded-xl border transition-all active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-gray-800 hover:bg-gray-700/90 border-gray-700/60 text-gray-300 hover:text-white'
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

                <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-800/60 leading-relaxed">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Pemangkas Cerdas 2D (Smart Trimmer) Terintegrasi Langsung */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                PEMANGKAS CERDAS 2D (SMART TRIMMER DARI BBFS-7)
              </h4>
              <p className="text-[11px] text-gray-400">
                Kombinasi dipartisi otomatis menjadi Top 10 Line Bom, 15 Line Medium, dan Cadangan
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenGenerator(bbfs7Digits, 'BBFS-7', 'trimmer')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buka di Generator Modal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Top 10 Line Bom */}
          <div className="bg-gray-950/90 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Bomb className="w-4 h-4 text-amber-400" />
                  <span>Top 10 Line Bom (Utama)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  10 Line
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-900/90 rounded-xl border border-gray-800/80 min-h-[72px]">
                {trimmed.top10.map((line) => (
                  <span
                    key={line}
                    className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-extrabold text-xs shadow-sm hover:scale-110 transition-transform cursor-default"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleCopy(top10Text, 'trim-top10')}
              className="mt-3.5 w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border border-amber-500/30 active:scale-95"
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
          <div className="bg-gray-950/90 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>15 Line Medium</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  15 Line
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-900/90 rounded-xl border border-gray-800/80 min-h-[72px]">
                {trimmed.medium15.map((line) => (
                  <span
                    key={line}
                    className="px-2 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono font-extrabold text-xs shadow-sm hover:scale-110 transition-transform cursor-default"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleCopy(medium15Text, 'trim-medium15')}
              className="mt-3.5 w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border border-cyan-500/30 active:scale-95"
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
          <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-gray-300">
                  Line Cadangan (Pengaman)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono border border-gray-700/60">
                  {trimmed.cadangan.length} Line
                </span>
              </div>
              <div className="flex flex-wrap gap-1 p-2 bg-gray-900/90 rounded-xl border border-gray-800/80 max-h-[92px] overflow-y-auto scrollbar-thin">
                {trimmed.cadangan.map((line) => (
                  <span
                    key={line}
                    className="px-1.5 py-0.5 rounded bg-gray-800/80 border border-gray-700/60 text-gray-400 font-mono text-[11px]"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleCopy(cadanganText, 'trim-cadangan')}
              className="mt-3.5 w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95 border border-gray-700/60"
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

      {/* 5. Mini Evaluasi Khusus BBFS */}
      {evaluation && (
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Performa Walk-Forward BBFS ({evaluation.testDraws} Putaran Terakhir)</span>
            </div>
            <span className="text-xs text-purple-300 font-mono font-bold">
              Aturan Evaluasi: <strong className="text-purple-400">2 Digit Masuk / Twin Lolos</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-950/90 text-gray-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Tier BBFS</th>
                  <th className="p-2.5">Jumlah Line (Non-Twin)</th>
                  <th className="p-2.5">Tembus 2D</th>
                  <th className="p-2.5">Gagal</th>
                  <th className="p-2.5">Akurasi Empiris</th>
                  <th className="p-2.5">Baseline Teori</th>
                  <th className="p-2.5 rounded-r-lg text-right">Edge (Keunggulan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-mono text-gray-300">
                {[6, 7, 8, 9].map((size) => {
                  const stat = evaluation.bbfsStats[size];
                  if (!stat) return null;
                  const misses = evaluation.testDraws - stat.hitCount;
                  const edge = stat.diff;
                  const isPositive = edge >= 0;
                  return (
                    <tr
                      key={size}
                      className={`hover:bg-gray-800/30 transition-colors ${
                        size === 7 ? 'bg-purple-950/25 font-bold' : ''
                      }`}
                    >
                      <td className="p-2.5 text-purple-300 font-bold flex items-center space-x-1.5">
                        <span>BBFS-{size}</span>
                        {size === 7 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                            Utama
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-gray-400">{stat.lines} Line</td>
                      <td className="p-2.5 text-emerald-400">{stat.hitCount}x</td>
                      <td className="p-2.5 text-rose-400">{misses}x</td>
                      <td className="p-2.5 font-bold text-white">
                        <span className="text-purple-300 font-mono text-sm">{stat.actualRate}%</span>
                      </td>
                      <td className="p-2.5 text-gray-400">{stat.baselineRate}%</td>
                      <td className="p-2.5 text-right font-bold">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
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
