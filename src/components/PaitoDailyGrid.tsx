import React, { useState, useMemo } from 'react';
import type { HistoryItem } from '../engine/types';
import { PAITO_COLORS } from './PaitoColorPaletteBar';
import { Calendar } from 'lucide-react';

export const DAYS_OF_WEEK = [
  { id: 0, name: 'Senin', short: 'SEN', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  { id: 1, name: 'Selasa', short: 'SEL', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  { id: 2, name: 'Rabu', short: 'RAB', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  { id: 3, name: 'Kamis', short: 'KAM', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  { id: 4, name: 'Jumat', short: 'JUM', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  { id: 5, name: 'Sabtu', short: 'SAB', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  { id: 6, name: 'Minggu', short: 'MIN', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
];

interface PaitoDailyGridProps {
  historyItems: HistoryItem[];
  marketName: string;
  paintedColors: Record<string, string>;
  onCellClick: (item: HistoryItem, part?: 'full' | 'as' | 'kop' | 'kepala' | 'ekor' | '2d') => void;
}

export const PaitoDailyGrid: React.FC<PaitoDailyGridProps> = ({
  historyItems,
  marketName,
  paintedColors,
  onCellClick,
}) => {
  // Ambil hari saat ini (0 = Minggu, 1 = Senin, dst di JS Date)
  // Konversi ke 0 = Senin, ..., 6 = Minggu
  const defaultTodayIdx = useMemo(() => {
    const jsDay = new Date().getDay(); // 0 is Sunday
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const [lastDrawDayIndex, setLastDrawDayIndex] = useState<number>(defaultTodayIdx);
  const [displayMode, setDisplayMode] = useState<'4d' | '2d'>('4d');
  const [sortOrder, setSortOrder] = useState<'newest_top' | 'oldest_top'>('newest_top');
  const [weeksLimit, setWeeksLimit] = useState<number>(15);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);

  // Petakan setiap item riwayat ke kolom hari (0 = Senin ... 6 = Minggu)
  // Item terakhir (historyItems[historyItems.length - 1]) memiliki day = lastDrawDayIndex
  const mappedGrid = useMemo(() => {
    if (!historyItems || historyItems.length === 0) return [];

    const total = historyItems.length;
    // Map item dengan dayIndex
    const itemsWithDay = historyItems.map((item, idx) => {
      const offsetFromEnd = total - 1 - idx;
      // Menghitung mundur dari lastDrawDayIndex
      const dayIndex = ((lastDrawDayIndex - (offsetFromEnd % 7)) % 7 + 7) % 7;
      return { item, dayIndex };
    });

    // Kelompokkan menjadi baris mingguan
    // Agar rapi, kita mulai dari item pertama dan buat baris-baris berukuran 7 kolom
    const rows: (({ item: HistoryItem; dayIndex: number } | null)[])[] = [];
    let currentRow: ({ item: HistoryItem; dayIndex: number } | null)[] = Array(7).fill(null);

    itemsWithDay.forEach((entry) => {
      currentRow[entry.dayIndex] = entry;
      // Jika sudah sampai Minggu (dayIndex 6) atau baris sudah penuh
      if (entry.dayIndex === 6) {
        rows.push(currentRow);
        currentRow = Array(7).fill(null);
      }
    });

    // Masukkan baris terakhir jika ada yang terisi
    if (currentRow.some((c) => c !== null)) {
      rows.push(currentRow);
    }

    if (sortOrder === 'newest_top') {
      return [...rows].reverse();
    }
    return rows;
  }, [historyItems, lastDrawDayIndex, sortOrder]);

  const displayedRows = useMemo(() => {
    return mappedGrid.slice(0, weeksLimit);
  }, [mappedGrid, weeksLimit]);

  const getColorObj = (colorId?: string) => {
    if (!colorId) return null;
    return PAITO_COLORS.find((c) => c.id === colorId);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-white/[0.08] p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Hari Draw Terakhir Alignment */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Hari Result Terakhir:</span>
            <select
              value={lastDrawDayIndex}
              onChange={(e) => setLastDrawDayIndex(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-900 border border-white/[0.1] rounded-lg text-cyan-300 font-semibold text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Tampilan (4D vs 2D) */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setDisplayMode('4d')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                displayMode === '4d'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4D Lengkap
            </button>
            <button
              onClick={() => setDisplayMode('2d')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                displayMode === '2d'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Saja
            </button>
          </div>

          {/* Sort Order */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setSortOrder('newest_top')}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                sortOrder === 'newest_top'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Terbaru di Atas
            </button>
            <button
              onClick={() => setSortOrder('oldest_top')}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                sortOrder === 'oldest_top'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Terlama di Atas (Standar Paito)
            </button>
          </div>
        </div>

        {/* Right Limit Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 text-[11px]">Tampilkan:</span>
          <select
            value={weeksLimit}
            onChange={(e) => setWeeksLimit(Number(e.target.value))}
            className="px-2.5 py-1 bg-slate-900 border border-white/[0.1] rounded-lg text-slate-300 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value={10}>10 Minggu (~70 Draw)</option>
            <option value={15}>15 Minggu (~105 Draw)</option>
            <option value={25}>25 Minggu (~175 Draw)</option>
            <option value={50}>50 Minggu (~350 Draw)</option>
            <option value={999}>Semua Minggu ({mappedGrid.length})</option>
          </select>
        </div>
      </div>

      {/* Grid Table 7 Hari (Senin - Minggu) */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.1] shadow-2xl bg-slate-950/90">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="bg-slate-900/90 border-b border-white/[0.1]">
              <th className="p-2 sm:p-2.5 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider w-10 sm:w-12 border-r border-white/[0.06]">
                Mg#
              </th>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedCol === day.id;
                return (
                  <th
                    key={day.id}
                    onClick={() => setSelectedCol(isSelected ? null : day.id)}
                    className={`p-2 sm:p-3 text-xs font-mono font-bold tracking-wider cursor-pointer border-r last:border-r-0 border-white/[0.06] transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/25 text-cyan-300'
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{day.short}</span>
                      <span className="hidden sm:inline">({day.name})</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono">
            {displayedRows.map((weekRow, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/[0.02] transition-colors">
                {/* Week Label */}
                <td className="p-1 sm:p-1.5 text-[10px] text-slate-600 border-r border-white/[0.06] font-mono">
                  W{displayedRows.length - rowIdx}
                </td>

                {/* 7 Days Cells */}
                {weekRow.map((entry, colIdx) => {
                  if (!entry || !entry.item) {
                    return (
                      <td
                        key={colIdx}
                        className={`p-1 sm:p-1.5 border-r last:border-r-0 border-white/[0.06] ${
                          selectedCol === colIdx ? 'bg-cyan-500/[0.03]' : ''
                        }`}
                      >
                        <div className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-slate-800 text-xs">
                          -
                        </div>
                      </td>
                    );
                  }

                  const { item } = entry;
                  const cellKey = `draw_${item.index}_cell`;
                  const cell2DKey = `draw_${item.index}_2d`;
                  const paintedColorId = paintedColors[cellKey] || paintedColors[cell2DKey];
                  const colorObj = getColorObj(paintedColorId);

                  return (
                    <td
                      key={colIdx}
                      className={`p-1 sm:p-1.5 border-r last:border-r-0 border-white/[0.06] transition-colors ${
                        selectedCol === colIdx ? 'bg-cyan-500/[0.04]' : ''
                      }`}
                    >
                      <div
                        onClick={() => onCellClick(item, '2d')}
                        title={`Draw #${item.index} | 4D: ${item.full} | Biji: ${item.biji} | Shio: ${item.shioName || ''} | ${item.besarKecil} ${item.ganjilGenap}`}
                        className={`group relative h-10 sm:h-12 px-1 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border ${
                          colorObj
                            ? `${colorObj.bgClass} shadow-md border-transparent`
                            : 'bg-slate-900/70 border-white/[0.06] hover:border-cyan-500/50 hover:bg-slate-800/80 hover:scale-[1.02]'
                        }`}
                      >
                        {/* Draw Index Mini Chip on hover or default */}
                        <span
                          className={`absolute top-0.5 left-1 text-[8px] font-mono opacity-50 ${
                            colorObj ? 'text-inherit font-semibold' : 'text-slate-500'
                          }`}
                        >
                          #{item.index}
                        </span>

                        {displayMode === '4d' ? (
                          <div className="flex items-center space-x-0.5 text-xs sm:text-sm font-bold tracking-wider mt-1.5">
                            {/* As & Kop */}
                            <span
                              className={`${
                                colorObj ? 'opacity-80' : 'text-slate-500 font-normal'
                              }`}
                            >
                              {item.as}
                              {item.kop}
                            </span>
                            {/* Kepala & Ekor */}
                            <span
                              className={`${
                                colorObj
                                  ? 'font-black tracking-widest text-inherit'
                                  : 'text-emerald-400 font-extrabold'
                              }`}
                            >
                              {item.kepala}
                              {item.ekor}
                            </span>
                          </div>
                        ) : (
                          <div
                            className={`text-sm sm:text-base font-black tracking-widest mt-1 ${
                              colorObj ? 'text-inherit' : 'text-emerald-400'
                            }`}
                          >
                            {item.kepala}
                            {item.ekor}
                          </div>
                        )}

                        {/* Extra indicators: Shio / Biji tiny tag */}
                        <div
                          className={`flex items-center space-x-1 text-[8px] sm:text-[9px] font-mono ${
                            colorObj ? 'opacity-90' : 'text-slate-400'
                          }`}
                        >
                          {item.isTwin && (
                            <span className="font-bold text-rose-400">TW</span>
                          )}
                          <span>B{item.biji}</span>
                          {item.shio && <span>{item.shioEmoji}</span>}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
        <span>*Klik kotak angka mana saja untuk memberi warna kuas terpilih.</span>
        <span>Pasar: {marketName} &bull; Total {historyItems.length} putaran tercatat</span>
      </div>
    </div>
  );
};
