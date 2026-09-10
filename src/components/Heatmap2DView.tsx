import React, { useState, useMemo } from 'react';
import type { Heatmap2DStats, HeatmapCellData, PolaTarungPrediction, PredictionResult } from '../engine/types';
import { computeHeatmap2DStats } from '../engine/heatmapStats';
import {
  Flame,
  Check,
  Copy,
  SlidersHorizontal
} from 'lucide-react';

interface Heatmap2DViewProps {
  history2D: [number, number][];
  marketName: string;
  prediction?: PredictionResult | null;
  polaTarung?: PolaTarungPrediction | null;
  onToast?: (msg: string) => void;
}

export const Heatmap2DView: React.FC<Heatmap2DViewProps> = ({
  history2D,
  marketName,
  prediction,
  polaTarung,
  onToast
}) => {
  const [lookback, setLookback] = useState<number>(50);
  const [highlightMode, setHighlightMode] = useState<
    'none' | 'tarung' | 'bbfs7' | 'sniper' | 'twin' | 'besar' | 'kecil' | 'nuklir' | 'bom12'
  >('none');
  const [parityFilter, setParityFilter] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [copiedCell, setCopiedCell] = useState<boolean>(false);

  // Kalkulasi Heatmap Stats
  const stats: Heatmap2DStats = useMemo(() => {
    return computeHeatmap2DStats(history2D, lookback);
  }, [history2D, lookback]);

  // Set Highlight Set
  const highlightedSet = useMemo(() => {
    const set = new Set<string>();
    if (highlightMode === 'nuklir' && prediction?.paitoBBFS7?.nuklir6) {
      prediction.paitoBBFS7.nuklir6.forEach((c) => set.add(c));
    } else if (highlightMode === 'bom12' && prediction?.paitoBBFS7?.bom12) {
      prediction.paitoBBFS7.bom12.forEach((c) => set.add(c));
    } else if (highlightMode === 'tarung' && polaTarung) {
      polaTarung.tarung4x4.forEach((c) => set.add(c));
    } else if (highlightMode === 'bbfs7') {
      const b7 = prediction?.paitoBBFS7?.digits || prediction?.bbfs?.[7];
      if (b7) {
        for (const k of b7) {
          for (const e of b7) {
            if (k !== e) set.add(`${k}${e}`);
          }
        }
      }
    } else if (highlightMode === 'twin') {
      for (let d = 0; d < 10; d++) set.add(`${d}${d}`);
    } else if (highlightMode === 'besar') {
      Object.values(stats.cells).forEach((c) => {
        if (c.magnitude === 'Besar') set.add(c.comb2D);
      });
    } else if (highlightMode === 'kecil') {
      Object.values(stats.cells).forEach((c) => {
        if (c.magnitude === 'Kecil') set.add(c.comb2D);
      });
    }
    return set;
  }, [highlightMode, polaTarung, prediction, stats.cells]);

  // Kinetic Trace Map
  const traceMap = useMemo(() => {
    const map = new Map<string, number>();
    stats.kineticTrace.forEach((item) => {
      map.set(item.comb2D, item.step);
    });
    return map;
  }, [stats.kineticTrace]);

  const handleCopyCell = (comb2D: string) => {
    navigator.clipboard.writeText(comb2D);
    setCopiedCell(true);
    if (onToast) onToast(`Angka ${comb2D} berhasil disalin!`);
    setTimeout(() => setCopiedCell(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header & Control Bar */}
      <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Matriks Heatmap & Lintasan Pergerakan 2D
                </h3>
                <p className="text-xs text-slate-400">
                  {marketName} &bull; Matriks 100 kombinasi (00–99) dengan pelacak jejak kinetik 5 periode terakhir
                </p>
              </div>
            </div>
          </div>

          {/* Lookback Selector */}
          <div className="flex items-center space-x-1.5 self-start lg:self-center text-xs">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Periode:</span>
            {[30, 50, 100].map((num) => (
              <button
                key={num}
                onClick={() => setLookback(num)}
                className={`px-3 py-1.5 rounded-xl border font-mono transition-all ${
                  lookback === num
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {num} Draw
              </button>
            ))}
            <button
              onClick={() => setLookback(history2D.length)}
              className={`px-3 py-1.5 rounded-xl border font-mono transition-all ${
                lookback === history2D.length
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                  : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              Semua ({history2D.length})
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Highlight Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sorot:</span>
            </span>
            {[
              { id: 'none', label: 'Polos' },
              { id: 'nuklir', label: '⚡ 6 Nuklir' },
              { id: 'bom12', label: '💣 12 BOM' },
              { id: 'tarung', label: '⚔️ Pola Tarung (4x4)' },
              { id: 'bbfs7', label: 'Set BBFS-7' },
              { id: 'twin', label: '👯 Kembar (Twin)' },
              { id: 'besar', label: 'Besar (>=50)' },
              { id: 'kecil', label: 'Kecil (<50)' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setHighlightMode(item.id as any)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                  highlightMode === item.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Parity Quick Selector */}
          <div className="flex items-center space-x-1 text-[11px]">
            <span className="text-slate-500 mr-1">Paritas:</span>
            {['all', 'Genap-Ganjil', 'Ganjil-Genap', 'Genap-Genap', 'Ganjil-Ganjil'].map((p) => (
              <button
                key={p}
                onClick={() => setParityFilter(p)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  parityFilter === p
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                    : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'Semua' : p.replace('-', '/')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid 10x10 Heatmap Matrix */}
      <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-3 sm:p-5 shadow-xl backdrop-blur-md overflow-x-auto">
        <div className="min-w-[620px]">
          {/* Header Baris Ekor (0 - 9) */}
          <div className="grid grid-cols-11 gap-1 mb-1 text-center font-mono text-[11px] font-bold">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center justify-center">
              Kep \ Ekr
            </div>
            {Array.from({ length: 10 }, (_, e) => (
              <div
                key={e}
                className="py-1 bg-slate-950/80 rounded-lg text-purple-400 border border-white/[0.06]"
              >
                {e}
              </div>
            ))}
          </div>

          {/* Body 10 Baris Kepala (0 - 9) */}
          {Array.from({ length: 10 }, (_, k) => (
            <div key={k} className="grid grid-cols-11 gap-1 mb-1 items-center">
              {/* Header Kolom Kepala */}
              <div className="py-2 bg-slate-950/80 rounded-lg text-cyan-400 text-center font-mono font-bold text-xs border border-white/[0.06]">
                {k}
              </div>

              {/* 10 Sel Ekor */}
              {Array.from({ length: 10 }, (_, e) => {
                const comb2D = `${k}${e}`;
                const cell = stats.cells[comb2D];
                const count = cell ? cell.count : 0;
                const isTrace = traceMap.has(comb2D);
                const traceStep = traceMap.get(comb2D);
                const isSelected = selectedCell?.comb2D === comb2D;

                const isHighlight =
                  highlightedSet.has(comb2D) ||
                  (parityFilter !== 'all' && cell?.parity === parityFilter);

                // Warna Intensitas Panas
                let bgStyle = 'bg-slate-950/60 text-slate-500 border-white/[0.04]';
                if (count >= 4) {
                  bgStyle = 'bg-amber-500/30 text-amber-200 border-amber-400/60 font-bold shadow-sm shadow-amber-500/20';
                } else if (count === 3) {
                  bgStyle = 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40 font-bold';
                } else if (count === 2) {
                  bgStyle = 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30 font-medium';
                } else if (count === 1) {
                  bgStyle = 'bg-slate-900/90 text-slate-300 border-white/[0.08]';
                }

                return (
                  <button
                    key={comb2D}
                    onClick={() => setSelectedCell(cell)}
                    className={`h-11 rounded-lg border text-center font-mono flex flex-col items-center justify-center relative transition-all active:scale-95 ${bgStyle} ${
                      isSelected
                        ? 'ring-2 ring-white border-white scale-105 z-20 shadow-lg'
                        : ''
                    } ${
                      isHighlight
                        ? 'ring-1 ring-cyan-400 border-cyan-400/80 font-bold'
                        : ''
                    }`}
                  >
                    <span className="text-xs font-bold leading-none">{comb2D}</span>
                    <span className="text-[9px] mt-0.5 opacity-70 leading-none">
                      {count > 0 ? `${count}x` : '·'}
                    </span>

                    {/* Kinetic Trace Step Badge */}
                    {isTrace && (
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border shadow-md animate-pulse ${
                          traceStep === 5
                            ? 'bg-rose-500 text-white border-rose-300 ring-2 ring-rose-400/50'
                            : 'bg-cyan-500 text-slate-950 border-cyan-200'
                        }`}
                      >
                        {traceStep}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend Skala Warna & Jejak */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Intensitas:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-950/60 border border-white/[0.04] text-slate-500">
              0x (Mati)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-slate-300">
              1x (Dingin)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-200">
              2x (Hangat)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 font-bold">
              3x (Subur)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400/60 text-amber-200 font-bold">
              4x+ (HOT 🔥)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Jejak Lintasan:</span>
            <span className="inline-flex items-center space-x-1 text-cyan-300">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-bold inline-flex items-center justify-center">1</span>
              <span>s.d.</span>
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold inline-flex items-center justify-center">5</span>
              <span className="text-rose-400 font-semibold">(Result Terkini)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Cell Inspector Popover / Drawer */}
      {selectedCell && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <span className="text-2xl font-black font-mono text-cyan-300">
                  {selectedCell.comb2D}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-base">
                    Analisis Angka 2D: {selectedCell.comb2D}
                  </h4>
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-slate-800 text-slate-300 border border-white/[0.06]">
                    Biji {selectedCell.biji}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-300 border border-white/[0.06]">
                    {selectedCell.magnitude}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shio {selectedCell.shioEmoji} {selectedCell.shioName} &bull; Pola {selectedCell.parity} &bull; Kemunculan: <strong className="text-white">{selectedCell.count} kali</strong> dalam {stats.totalDraws} draw terakhir
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs border border-white/[0.06]"
              >
                Tutup
              </button>
              <button
                onClick={() => handleCopyCell(selectedCell.comb2D)}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
              >
                {copiedCell ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCell ? 'Tersalin!' : `Salin ${selectedCell.comb2D}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Positional Breakdown: Hot vs Cold Kepala & Ekor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel Posisi Kepala */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                Statistik Posisi KEPALA (Puluhan)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {stats.totalDraws} Periode
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Object.values(stats.kepalaStats).map((stat) => (
              <div
                key={stat.digit}
                className={`p-2.5 rounded-xl border text-center font-mono ${
                  stat.status === 'HOT'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                    : stat.status === 'COLD'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : 'bg-slate-950/60 border-white/[0.06] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                  <span>Digit</span>
                  <span className="font-bold">{stat.status}</span>
                </div>
                <div className="text-lg font-black text-cyan-400">{stat.digit}</div>
                <div className="text-[11px] font-semibold text-slate-200 mt-0.5">
                  {stat.count}x keluar
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  Gap: {stat.lastSeenGap} draw
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Posisi Ekor */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <h4 className="text-sm font-bold text-white">
                Statistik Posisi EKOR (Satuan)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {stats.totalDraws} Periode
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Object.values(stats.ekorStats).map((stat) => (
              <div
                key={stat.digit}
                className={`p-2.5 rounded-xl border text-center font-mono ${
                  stat.status === 'HOT'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                    : stat.status === 'COLD'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : 'bg-slate-950/60 border-white/[0.06] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                  <span>Digit</span>
                  <span className="font-bold">{stat.status}</span>
                </div>
                <div className="text-lg font-black text-purple-400">{stat.digit}</div>
                <div className="text-[11px] font-semibold text-slate-200 mt-0.5">
                  {stat.count}x keluar
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  Gap: {stat.lastSeenGap} draw
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
