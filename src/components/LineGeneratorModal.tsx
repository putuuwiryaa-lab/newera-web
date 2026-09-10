import React, { useState, useEffect, useMemo } from 'react';
import {
  generate2DLines,
  formatLines,
  generateSmartTrim,
  generateSniperTrim
} from '../engine/generator';
import type { PaitoMacroPrediction, PolaTarungPrediction } from '../engine/types';
import { X, Copy, Check, ToggleLeft, ToggleRight, Bomb, Shield, Sparkles, Target, Swords } from 'lucide-react';

interface LineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  digits: number[];
  tierName: string;
  initialMode?: 'full' | 'trimmer' | 'sniper' | 'tarung';
  paitoPrediction?: PaitoMacroPrediction | null;
  polaTarung?: PolaTarungPrediction | null;
}

export const LineGeneratorModal: React.FC<LineGeneratorModalProps> = ({
  isOpen,
  onClose,
  digits,
  tierName,
  initialMode = 'full',
  paitoPrediction,
  polaTarung
}) => {
  const [userMode, setUserMode] = useState<'full' | 'trimmer' | 'sniper' | 'tarung' | null>(null);
  const mode = userMode ?? initialMode;
  const [includeTwins, setIncludeTwins] = useState(false);
  const [delimiter, setDelimiter] = useState<'space' | 'comma' | 'newline'>('space');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sniper Paito Trimmer
  const sniper = useMemo(() => {
    if (!paitoPrediction) return null;
    return generateSniperTrim(digits, paitoPrediction, includeTwins);
  }, [digits, paitoPrediction, includeTwins]);

  if (!isOpen) return null;

  const lines = generate2DLines(digits, includeTwins);
  const formattedFullText = formatLines(lines, delimiter);

  // Smart Trimmer
  const trimmed = generateSmartTrim(digits);
  const top10Text = formatLines(trimmed.top10, delimiter);
  const medium15Text = formatLines(trimmed.medium15, delimiter);
  const cadanganText = formatLines(trimmed.cadangan, delimiter);

  const sniperTopText = sniper ? formatLines(sniper.sniperTop, delimiter) : '';
  const superSniperText = sniper?.superSniperShio ? formatLines(sniper.superSniperShio, delimiter) : '';
  const sniperSecText = sniper ? formatLines(sniper.sniperSecondary, delimiter) : '';
  const sniperCadText = sniper ? formatLines(sniper.cadangan, delimiter) : '';

  const tarung3x3Text = polaTarung ? formatLines(polaTarung.tarung3x3, delimiter) : '';
  const tarung4x4Text = polaTarung ? formatLines(polaTarung.tarung4x4, delimiter) : '';
  const tarung5x5Text = polaTarung ? formatLines(polaTarung.tarung5x5, delimiter) : '';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel bg-slate-900/95 border border-white/[0.1] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-slate-950/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400 font-mono font-semibold text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                {tierName}
              </span>
              <h3 className="font-semibold text-white text-base">
                Generator & Pemangkas Line 2D
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Digit Terpilih: <strong className="font-mono text-emerald-400">{digits.join(', ')}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tab */}
        <div className="flex border-b border-white/[0.06] bg-slate-950/80 p-1">
          <button
            onClick={() => setUserMode('full')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'full'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Penuh ({lines.length})</span>
          </button>

          <button
            onClick={() => setUserMode('trimmer')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'trimmer'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bomb className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Trim</span>
          </button>

          {paitoPrediction && (
            <button
              onClick={() => setUserMode('sniper')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                mode === 'sniper'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-cyan-200" />
              <span>🎯 Sniper Paito</span>
            </button>
          )}

          {polaTarung && (
            <button
              onClick={() => setUserMode('tarung')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                mode === 'tarung'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-rose-200" />
              <span>⚔️ Pola Tarung</span>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="p-3 bg-slate-950/50 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
          {mode === 'full' && (
            <button
              onClick={() => setIncludeTwins(!includeTwins)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                includeTwins
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                  : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              {includeTwins ? (
                <ToggleRight className="w-4 h-4 text-purple-400" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span>+Twin ({digits.length} line)</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-900/80 border border-white/[0.08] p-0.5 rounded-lg ml-auto">
            {(['space', 'comma', 'newline'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDelimiter(d)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  delimiter === d
                    ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 'space' ? 'Spasi' : d === 'comma' ? 'Koma' : 'Enter'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 max-h-[420px] overflow-y-auto space-y-4">
          {mode === 'full' ? (
            <div>
              <textarea
                readOnly
                value={formattedFullText}
                rows={7}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 font-mono text-sm text-purple-200 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed tracking-wider"
              />
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs text-slate-500 font-mono">
                  Total {lines.length} Line Siap Pasang
                </span>
                <button
                  onClick={() => handleCopy(formattedFullText, 'full')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-purple-600/20 active:scale-95"
                >
                  {copiedKey === 'full' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua ({lines.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : mode === 'trimmer' ? (
            <div className="space-y-4">
              {/* Top 10 Bom */}
              <div className="bg-emerald-500/[0.04] border border-emerald-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bomb className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">
                      TOP 10 LINE BOM (4 DIGIT TERKUAT)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(top10Text, 'top10')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'top10' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin Top 10</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-emerald-300 tracking-wider border border-white/[0.04]">
                  {top10Text}
                </div>
              </div>

              {/* Medium 15 */}
              <div className="bg-cyan-500/[0.04] border border-cyan-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300">
                      15 LINE MEDIUM (PENDUKUNG)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(medium15Text, 'med15')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'med15' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin 15 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-cyan-300 tracking-wider border border-white/[0.04]">
                  {medium15Text}
                </div>
              </div>

              {/* Cadangan */}
              {trimmed.cadangan.length > 0 && (
                <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      LINE CADANGAN ({trimmed.cadangan.length} Line)
                    </span>
                    <button
                      onClick={() => handleCopy(cadanganText, 'cad')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center space-x-1 transition-all"
                    >
                      {copiedKey === 'cad' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Cadangan</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-slate-400 tracking-wider border border-white/[0.04]">
                    {cadanganText}
                  </div>
                </div>
              )}
            </div>
          ) : sniper ? (
            <div className="space-y-4">
              {/* Efisiensi Banner */}
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-cyan-300">Target Filter Sniper Paito & Shio:</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Biji <strong className="text-cyan-200">[{paitoPrediction?.topBiji.join(', ')}]</strong> & Pola <strong className="text-purple-300">{paitoPrediction?.primaryParity}</strong>
                    {paitoPrediction?.topShios && (
                      <>, Shio <strong className="text-amber-300">[{paitoPrediction.topShios.join(', ')}]</strong> (Jalur {paitoPrediction.primaryJalur})</>
                    )}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/30">
                  Hemat {sniper.efficiencyPct}% Modal
                </span>
              </div>

              {/* Super Sniper Shio BOM */}
              {sniper.superSniperShio && sniper.superSniperShio.length > 0 && (
                <div className="bg-amber-500/[0.08] border border-amber-500/40 rounded-xl p-3.5 relative overflow-hidden shadow-lg shadow-amber-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">🐴</span>
                      <span className="text-xs font-bold text-amber-300">
                        SUPER SNIPER SHIO 2026 ({sniper.superSniperShio.length} Line - 4 Lapis)
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(superSniperText, 'superSniper')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center space-x-1 transition-all active:scale-95 shadow-sm shadow-amber-500/30"
                    >
                      {copiedKey === 'superSniper' ? (
                        <Check className="w-3 h-3 text-emerald-950" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Super Sniper</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/90 p-2.5 rounded-lg font-mono text-xs text-amber-300 font-bold tracking-widest border border-amber-500/25 min-h-[36px]">
                    {superSniperText}
                  </div>
                </div>
              )}

              {/* Sniper Top BOM */}
              <div className="bg-cyan-500/[0.05] border border-cyan-500/30 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300">
                      🎯 BOM SNIPER UTAMA ({sniper.sniperTop.length} Line)
                    </span>
                  </div>
                  {sniper.sniperTop.length > 0 && (
                    <button
                      onClick={() => handleCopy(sniperTopText, 'sniperTop')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95 shadow-sm shadow-cyan-600/30"
                    >
                      {copiedKey === 'sniperTop' ? (
                        <Check className="w-3 h-3 text-cyan-200" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Sniper BOM</span>
                    </button>
                  )}
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-cyan-300 tracking-wider border border-white/[0.04] min-h-[36px]">
                  {sniperTopText || <span className="text-slate-500 italic text-[11px]">Tidak ada line yang memenuhi irisan 100% pola</span>}
                </div>
              </div>

              {/* Sniper Sekunder */}
              {sniper.sniperSecondary.length > 0 && (
                <div className="bg-purple-500/[0.04] border border-purple-500/25 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-300">
                        🛡️ SNIPER SEKUNDER ({sniper.sniperSecondary.length} Line - Lolos Biji)
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(sniperSecText, 'sniperSec')}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                    >
                      {copiedKey === 'sniperSec' ? (
                        <Check className="w-3 h-3 text-purple-200" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Sekunder</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-purple-300 tracking-wider border border-white/[0.04]">
                    {sniperSecText}
                  </div>
                </div>
              )}

              {/* Cadangan */}
              {sniper.cadangan.length > 0 && (
                <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      LINE DILUAR FILTER ({sniper.cadangan.length} Line)
                    </span>
                    <button
                      onClick={() => handleCopy(sniperCadText, 'sniperCad')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center space-x-1 transition-all"
                    >
                      {copiedKey === 'sniperCad' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Cadangan</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-slate-400 tracking-wider border border-white/[0.04]">
                    {sniperCadText}
                  </div>
                </div>
              )}
            </div>
          ) : mode === 'tarung' && polaTarung ? (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300 mb-1">
                  <span>Digit Kepala Kuat: <strong className="font-mono text-purple-300">{polaTarung.rankedKepala.join(', ')}</strong></span>
                  <span>Digit Ekor Kuat: <strong className="font-mono text-cyan-300">{polaTarung.rankedEkor.join(', ')}</strong></span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Formasi posisi Kepala × Ekor terpisah tanpa bolak-balik (No BB), memangkas baris modal secara presisi.
                </p>
              </div>

              {/* 3x3 BOM (9 Line) */}
              <div className="bg-red-500/[0.05] border border-red-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bomb className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-red-300">
                      3×3 BOM SUPER HEMAT (9 LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tarung3x3Text, 'tarung3x3')}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'tarung3x3' ? <Check className="w-3 h-3 text-red-200" /> : <Copy className="w-3 h-3" />}
                    <span>Salin 9 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-red-300 tracking-wider border border-white/[0.04]">
                  {tarung3x3Text}
                </div>
              </div>

              {/* 4x4 Utama (16 Line) */}
              <div className="bg-amber-500/[0.05] border border-amber-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">
                      4×4 UTAMA REKOMENDASI (16 LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tarung4x4Text, 'tarung4x4')}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'tarung4x4' ? <Check className="w-3 h-3 text-amber-200" /> : <Copy className="w-3 h-3" />}
                    <span>Salin 16 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-amber-300 tracking-wider border border-white/[0.04]">
                  {tarung4x4Text}
                </div>
              </div>

              {/* 5x5 Invest (25 Line) */}
              <div className="bg-purple-500/[0.05] border border-purple-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">
                      5×5 INVESTASI SAFETY (25 LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tarung5x5Text, 'tarung5x5')}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'tarung5x5' ? <Check className="w-3 h-3 text-purple-200" /> : <Copy className="w-3 h-3" />}
                    <span>Salin 25 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-purple-300 tracking-wider border border-white/[0.04]">
                  {tarung5x5Text}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.06] bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

