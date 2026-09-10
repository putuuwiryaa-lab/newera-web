import React, { useState, useMemo } from 'react';
import { computeBiji, getParity } from '../engine/movementPredictor';
import { formatLines } from '../engine/generator';
import { Filter, Check, Copy, RefreshCw, Sparkles, Coins } from 'lucide-react';

interface LiveFilterBarProps {
  allLines: string[];
  recommendedBiji?: number[];
  recommendedParity?: string;
  onToast?: (message: string) => void;
}

export const LiveFilterBar: React.FC<LiveFilterBarProps> = ({
  allLines,
  recommendedBiji = [1, 2, 3],
  recommendedParity,
  onToast
}) => {
  const [selectedBiji, setSelectedBiji] = useState<number[]>([]);
  const [selectedParities, setSelectedParities] = useState<string[]>([]);
  const [selectedMagnitude, setSelectedMagnitude] = useState<'Semua' | 'Besar' | 'Kecil'>('Semua');
  const [budgetLimit, setBudgetLimit] = useState<number | null>(null); // null = unlimited
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedSingle, setCopiedSingle] = useState<string | null>(null);

  // Jalankan filtering reaktif
  const filteredLines = useMemo(() => {
    let result = allLines.filter((line) => {
      const k = parseInt(line[0], 10);
      const e = parseInt(line[1], 10);
      const b = computeBiji(k, e);
      const par = getParity(k, e);
      const mag = k * 10 + e >= 50 ? 'Besar' : 'Kecil';

      if (selectedBiji.length > 0 && !selectedBiji.includes(b)) return false;
      if (selectedParities.length > 0 && !selectedParities.includes(par)) return false;
      if (selectedMagnitude !== 'Semua' && mag !== selectedMagnitude) return false;

      return true;
    });

    if (budgetLimit !== null && budgetLimit > 0) {
      result = result.slice(0, budgetLimit);
    }

    return result;
  }, [allLines, selectedBiji, selectedParities, selectedMagnitude, budgetLimit]);

  const toggleBiji = (b: number) => {
    setSelectedBiji((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const toggleParity = (par: string) => {
    setSelectedParities((prev) =>
      prev.includes(par) ? prev.filter((x) => x !== par) : [...prev, par]
    );
  };

  const resetFilters = () => {
    setSelectedBiji([]);
    setSelectedParities([]);
    setSelectedMagnitude('Semua');
    setBudgetLimit(null);
    if (onToast) onToast('Semua filter di-reset ke default');
  };

  const applyRecommended = () => {
    setSelectedBiji([...recommendedBiji]);
    if (recommendedParity) {
      setSelectedParities([recommendedParity]);
    }
    setBudgetLimit(null);
    if (onToast) onToast('Filter Rekomendasi Paito 2D aktif');
  };

  const handleCopy = () => {
    const text = formatLines(filteredLines, 'space');
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onToast) onToast(`✓ ${filteredLines.length} baris hasil filter disalin`);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopySingle = (line: string) => {
    navigator.clipboard.writeText(line);
    setCopiedSingle(line);
    if (onToast) onToast(`✓ Line ${line} disalin`);
    setTimeout(() => setCopiedSingle(null), 1200);
  };

  // Finansial estimasi (Diskon 29%, Hadiah x70)
  const discountRate = 0.29;
  const costClean = Math.round(filteredLines.length * 1000 * (1 - discountRate));
  const winProfit = 70000 - costClean;

  const parityOptions = [
    { label: 'GG', full: 'Genap-Genap' },
    { label: 'GJ', full: 'Genap-Ganjil' },
    { label: 'JG', full: 'Ganjil-Genap' },
    { label: 'JJ', full: 'Ganjil-Ganjil' }
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/25 bg-gradient-to-b from-cyan-950/15 via-slate-900/80 to-slate-950/90 shadow-lg space-y-4">
      {/* Header Live Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Live Dynamic Filter Bar
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Interaktif Real-Time
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pangkas 42 line BBFS secara fleksibel berdasarkan preferensi modal & intuisi Anda
            </p>
          </div>
        </div>

        {/* Action Presets */}
        <div className="flex items-center space-x-2">
          <button
            onClick={applyRecommended}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all active:scale-95"
            title="Terapkan Biji & Paritas Rekomendasi Paito"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Rekomendasi</span>
          </button>

          {(selectedBiji.length > 0 || selectedParities.length > 0 || selectedMagnitude !== 'Semua' || budgetLimit !== null) && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/[0.08] text-xs font-medium transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* 1. Filter Biji (0-9) */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-slate-400 font-medium text-[11px]">
            <span>Filter Biji 2D ({selectedBiji.length ? `${selectedBiji.length} dipilih` : 'Semua'}):</span>
            {recommendedBiji.length > 0 && (
              <span className="text-[10px] text-cyan-400 font-mono">Top: {recommendedBiji.join(',')}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => {
              const active = selectedBiji.includes(b);
              const isRec = recommendedBiji.includes(b);
              return (
                <button
                  key={b}
                  onClick={() => toggleBiji(b)}
                  className={`w-7 h-7 rounded-lg font-mono font-bold text-xs transition-all ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-105'
                      : isRec
                      ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/50'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/[0.05]'
                  }`}
                  title={`Biji ${b} ${isRec ? '(Rekomendasi)' : ''}`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Filter Paritas (GG, GJ, JG, JJ) */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-white/[0.06] space-y-2">
          <div className="text-slate-400 font-medium text-[11px]">
            Filter Paritas ({selectedParities.length ? `${selectedParities.length} dipilih` : 'Semua'}):
          </div>
          <div className="grid grid-cols-4 gap-1">
            {parityOptions.map((opt) => {
              const active = selectedParities.includes(opt.full);
              const isRec = recommendedParity === opt.full;
              return (
                <button
                  key={opt.label}
                  onClick={() => toggleParity(opt.full)}
                  className={`py-1.5 rounded-lg font-mono font-bold text-xs text-center transition-all ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                      : isRec
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/[0.05]'
                  }`}
                  title={opt.full}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Filter Nilai (Besar/Kecil) & Limit Modal */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-white/[0.06] space-y-2">
          <div className="text-slate-400 font-medium text-[11px]">
            Nilai & Limit Modal Cepat:
          </div>
          <div className="flex items-center space-x-1">
            {(['Semua', 'Besar', 'Kecil'] as const).map((mag) => (
              <button
                key={mag}
                onClick={() => setSelectedMagnitude(mag)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedMagnitude === mag
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/[0.05]'
                }`}
              >
                {mag}
              </button>
            ))}
          </div>

          {/* Quick Budget Limit */}
          <div className="flex items-center space-x-1 pt-1">
            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-[10px] text-slate-400">Limit:</span>
            {[
              { label: 'Semua', val: null },
              { label: '6 Line', val: 6 },
              { label: '12 Line', val: 12 },
              { label: '20 Line', val: 20 }
            ].map((lim) => (
              <button
                key={lim.label}
                onClick={() => setBudgetLimit(lim.val)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  budgetLimit === lim.val
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                {lim.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Header & Copy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Hasil Pemangkasan:</span>
            <span className="font-mono font-bold text-cyan-300 text-sm">
              {filteredLines.length} Line
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              (dari {allLines.length})
            </span>
          </div>

          <div className="hidden sm:inline-block text-slate-600">&bull;</div>

          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <span>Modal:</span>
            <span className="font-mono font-bold text-white">
              Rp {costClean.toLocaleString('id-ID')}
            </span>
            <span className="text-emerald-400 font-medium">
              (Win Net: +Rp {winProfit.toLocaleString('id-ID')})
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          disabled={filteredLines.length === 0}
          className="flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin!' : `Salin ${filteredLines.length} Line Terfilter`}</span>
        </button>
      </div>

      {/* Clickable Filtered Line Chips */}
      {filteredLines.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/70 rounded-xl border border-white/[0.05]">
          {filteredLines.map((line) => {
            const isCopied = copiedSingle === line;
            return (
              <button
                key={line}
                onClick={() => handleCopySingle(line)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all relative ${
                  isCopied
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-cyan-200 hover:bg-cyan-950/50 hover:text-white border border-white/[0.06]'
                }`}
                title="Klik untuk salin 1 line"
              >
                {line}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/50 border border-dashed border-white/[0.1] text-center text-slate-400 text-xs">
          Tidak ada baris yang memenuhi kombinasi filter ini. Coba longgarkan pilihan biji atau paritas.
        </div>
      )}
    </div>
  );
};
