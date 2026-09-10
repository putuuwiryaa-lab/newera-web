import React, { useState, useMemo } from 'react';
import type { PolaTarungPrediction } from '../engine/types';
import { generatePolaTarungLines } from '../engine/movementPredictor';
import {
  Swords,
  Copy,
  Check,
  Sparkles,
  Zap,
  Shield,
  Percent,
  Share2
} from 'lucide-react';

interface PolaTarungCardProps {
  polaTarung?: PolaTarungPrediction;
  marketName: string;
  onOpenSingleShare?: () => void;
  onToast?: (msg: string) => void;
}

export const PolaTarungCard: React.FC<PolaTarungCardProps> = ({
  polaTarung,
  marketName,
  onOpenSingleShare,
  onToast
}) => {
  const [preset, setPreset] = useState<'3x3' | '4x4' | '5x5' | 'custom'>('4x4');
  const [selectedKepala, setSelectedKepala] = useState<number[]>(() => {
    return polaTarung?.rankedKepala.slice(0, 4) || [2, 7, 4, 9];
  });
  const [selectedEkor, setSelectedEkor] = useState<number[]>(() => {
    return polaTarung?.rankedEkor.slice(0, 4) || [1, 6, 3, 8];
  });
  const [includeTwins, setIncludeTwins] = useState<boolean>(true);
  const [delimiter, setDelimiter] = useState<'space' | 'comma' | 'newline'>('space');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync saat data polaTarung berubah
  React.useEffect(() => {
    if (polaTarung) {
      if (preset === '3x3') {
        setSelectedKepala(polaTarung.rankedKepala.slice(0, 3));
        setSelectedEkor(polaTarung.rankedEkor.slice(0, 3));
      } else if (preset === '4x4') {
        setSelectedKepala(polaTarung.rankedKepala.slice(0, 4));
        setSelectedEkor(polaTarung.rankedEkor.slice(0, 4));
      } else if (preset === '5x5') {
        setSelectedKepala(polaTarung.rankedKepala.slice(0, 5));
        setSelectedEkor(polaTarung.rankedEkor.slice(0, 5));
      }
    }
  }, [polaTarung, preset]);

  const handleSelectPreset = (p: '3x3' | '4x4' | '5x5') => {
    setPreset(p);
    if (!polaTarung) return;
    const count = p === '3x3' ? 3 : p === '4x4' ? 4 : 5;
    setSelectedKepala(polaTarung.rankedKepala.slice(0, count));
    setSelectedEkor(polaTarung.rankedEkor.slice(0, count));
  };

  const toggleDigitKepala = (d: number) => {
    setPreset('custom');
    if (selectedKepala.includes(d)) {
      if (selectedKepala.length > 1) {
        setSelectedKepala(selectedKepala.filter((x) => x !== d));
      }
    } else {
      setSelectedKepala([...selectedKepala, d].sort((a, b) => a - b));
    }
  };

  const toggleDigitEkor = (d: number) => {
    setPreset('custom');
    if (selectedEkor.includes(d)) {
      if (selectedEkor.length > 1) {
        setSelectedEkor(selectedEkor.filter((x) => x !== d));
      }
    } else {
      setSelectedEkor([...selectedEkor, d].sort((a, b) => a - b));
    }
  };

  const lines = useMemo(() => {
    return generatePolaTarungLines(selectedKepala, selectedEkor, includeTwins);
  }, [selectedKepala, selectedEkor, includeTwins]);

  const formattedText = useMemo(() => {
    if (delimiter === 'comma') return lines.join(', ');
    if (delimiter === 'newline') return lines.join('\n');
    return lines.join(' ');
  }, [lines, delimiter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setIsCopied(true);
    if (onToast) onToast(`Berhasil menyalin ${lines.length} line Pola Tarung 2D!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const modalEfficiency = useMemo(() => {
    // Dibandingkan BBFS-7 standar (42 line)
    const baseline = 42;
    const savings = Math.round(((baseline - lines.length) / baseline) * 100);
    return savings > 0 ? savings : 0;
  }, [lines.length]);

  return (
    <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-gradient-to-b from-purple-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pola Tarung 2D: Kepala vs Ekor
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                NO BB
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Racikan posisi terpisah berbasis arah gerak. Menghemat modal tanpa perlu bolak-balik.
            </p>
          </div>
        </div>

        {/* Indikator Arah Gerak Posisional */}
        {polaTarung && (
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="px-2 py-1 rounded-lg bg-slate-950 border border-white/[0.06] text-slate-300 flex items-center space-x-1">
              <span className="text-cyan-400 font-semibold">Kepala:</span>
              <span className="text-white font-bold">
                {polaTarung.kepalaDirection === 'NAIK' ? 'NAIK ↗' : polaTarung.kepalaDirection === 'TURUN' ? 'TURUN ↘' : 'STABIL →'}
              </span>
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-950 border border-white/[0.06] text-slate-300 flex items-center space-x-1">
              <span className="text-purple-400 font-semibold">Ekor:</span>
              <span className="text-white font-bold">
                {polaTarung.ekorDirection === 'NAIK' ? 'NAIK ↗' : polaTarung.ekorDirection === 'TURUN' ? 'TURUN ↘' : 'STABIL →'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Preset Buttons Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => handleSelectPreset('3x3')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              preset === '3x3'
                ? 'bg-rose-500 text-white font-bold border-rose-400 shadow-sm'
                : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3x3 BOM (9 Line)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('4x4')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              preset === '4x4'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4x4 Utama (16 Line)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('5x5')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              preset === '5x5'
                ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-sm'
                : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>5x5 Invest (25 Line)</span>
          </button>
        </div>

        {/* Efisiensi Modal Badge */}
        {modalEfficiency > 0 && (
          <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Percent className="w-3 h-3" />
            <span>Hemat {modalEfficiency}% Modal vs BBFS-7</span>
          </div>
        )}
      </div>

      {/* Selector Grid: Kepala & Ekor */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Baris Kepala */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300 flex items-center space-x-1.5">
              <span>👑 Posisi KEPALA ({selectedKepala.length} Digit):</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedKepala.join(', ')}
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, d) => {
              const isSelected = selectedKepala.includes(d);
              const rankIdx = polaTarung?.rankedKepala.indexOf(d) ?? -1;
              const isTop = rankIdx >= 0 && rankIdx < 4;
              return (
                <button
                  key={d}
                  onClick={() => toggleDigitKepala(d)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all relative ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                      : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {d}
                  {isTop && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Baris Ekor */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 flex items-center space-x-1.5">
              <span>🎯 Posisi EKOR ({selectedEkor.length} Digit):</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedEkor.join(', ')}
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, d) => {
              const isSelected = selectedEkor.includes(d);
              const rankIdx = polaTarung?.rankedEkor.indexOf(d) ?? -1;
              const isTop = rankIdx >= 0 && rankIdx < 4;
              return (
                <button
                  key={d}
                  onClick={() => toggleDigitEkor(d)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all relative ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {d}
                  {isTop && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Output Line Grid & Control Bar */}
      <div className="mt-4 bg-slate-950/80 p-3.5 rounded-xl border border-white/[0.06] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">Hasil Racikan:</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {lines.length} Line
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Toggle Twin */}
            <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTwins}
                onChange={(e) => setIncludeTwins(e.target.checked)}
                className="rounded bg-slate-900 border-white/20 text-purple-500 focus:ring-purple-500/40 w-3.5 h-3.5"
              />
              <span className="text-[11px]">Izinkan Kembar (Twin)</span>
            </label>

            {/* Delimiter Selector */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-white/[0.06] text-[11px]">
              <button
                onClick={() => setDelimiter('space')}
                className={`px-2 py-0.5 rounded ${delimiter === 'space' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Spasi
              </button>
              <button
                onClick={() => setDelimiter('comma')}
                className={`px-2 py-0.5 rounded ${delimiter === 'comma' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Koma
              </button>
              <button
                onClick={() => setDelimiter('newline')}
                className={`px-2 py-0.5 rounded ${delimiter === 'newline' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Baris
              </button>
            </div>
          </div>
        </div>

        {/* Live Lines Display */}
        <div className="max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-900/60 border border-white/[0.04] flex flex-wrap gap-1.5 font-mono text-xs">
          {lines.map((ln) => (
            <span
              key={ln}
              className="px-2 py-1 bg-slate-800/80 text-emerald-300 rounded border border-emerald-500/20 font-bold hover:bg-emerald-500/20 transition-colors"
            >
              {ln}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-500">
            {marketName} &bull; Tarung {selectedKepala.length}x{selectedEkor.length} = {lines.length} Line
          </p>

          <div className="flex items-center space-x-2">
            {onOpenSingleShare && (
              <button
                onClick={onOpenSingleShare}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Format WA VIP</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin Line Tarung'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
