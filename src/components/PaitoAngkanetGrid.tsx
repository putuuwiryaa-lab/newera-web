import React, { useState, useMemo } from 'react';
import type { HistoryItem } from '../engine/types';
import { ArrowUpDown, Info } from 'lucide-react';

interface PaitoAngkanetGridProps {
  historyItems: HistoryItem[];
  colCount: number;
  theme: 'dark' | 'light';
  rowsLimit: number;
  paintedColors: Record<string, string>;
  onCellClick: (
    item: HistoryItem,
    pos: 'as' | 'kop' | 'kepala' | 'ekor' | 'jumlah'
  ) => void;
}

export const PaitoAngkanetGrid: React.FC<PaitoAngkanetGridProps> = ({
  historyItems,
  colCount,
  theme,
  rowsLimit,
  paintedColors,
  onCellClick
}) => {
  const [sortOrder, setSortOrder] = useState<'newest_top' | 'oldest_top'>('newest_top');

  const colHeaders = useMemo(() => {
    if (colCount === 5) return ['Senin', 'Rabu', 'Kamis', 'Sabtu', 'Minggu'];
    if (colCount === 7) return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    if (colCount === 6) return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    if (colCount === 4) return ['Kolom 1', 'Kolom 2', 'Kolom 3', 'Kolom 4'];
    if (colCount === 3) return ['Kolom 1', 'Kolom 2', 'Kolom 3'];
    return Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);
  }, [colCount]);

  // Kelompokkan data menjadi baris-baris berukuran colCount
  const rows = useMemo(() => {
    if (!historyItems || historyItems.length === 0) return [];

    const totalDraws = historyItems.length;
    const chunked: (HistoryItem | null)[][] = [];

    for (let i = 0; i < totalDraws; i += colCount) {
      const chunk: (HistoryItem | null)[] = historyItems.slice(i, i + colCount);
      // Pad jika baris belum penuh
      while (chunk.length < colCount) {
        chunk.push(null);
      }
      chunked.push(chunk);
    }

    if (sortOrder === 'newest_top') {
      return [...chunked].reverse();
    }
    return chunked;
  }, [historyItems, colCount, sortOrder]);

  const displayedRows = useMemo(() => {
    return rows.slice(0, rowsLimit);
  }, [rows, rowsLimit]);

  // Helper styling sel
  const getCellStyle = (item: HistoryItem, pos: 'as' | 'kop' | 'kepala' | 'ekor' | 'jumlah') => {
    const key = `draw_${item.index}_${pos}`;
    const paintedHex = paintedColors[key];

    if (paintedHex) {
      const isBright = paintedHex === '#f39c12' || paintedHex === '#1abc9c' || paintedHex === '#3498db' || paintedHex === 'yellow';
      return {
        backgroundColor: paintedHex,
        color: isBright ? '#020617' : '#ffffff',
        fontWeight: 'bold',
        borderColor: 'rgba(255,255,255,0.4)'
      };
    }

    // Default styling jika belum dicat
    if (pos === 'jumlah') {
      return {
        backgroundColor: theme === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
        color: theme === 'light' ? '#94a3b8' : '#64748b',
        fontWeight: 'normal'
      };
    }

    return {
      backgroundColor: theme === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
      color: theme === 'light' ? '#0f172a' : '#f8fafc',
      fontWeight: 'bold'
    };
  };

  return (
    <div className="space-y-2">
      {/* Sub-bar Pengaturan Urutan Tampilan & Keterangan */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest_top' ? 'oldest_top' : 'newest_top')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              theme === 'light'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-white/[0.1] text-amber-300 hover:text-white'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              Urutan: {sortOrder === 'newest_top' ? 'Terbaru di Atas' : 'Terlama di Atas (Standar Paito)'}
            </span>
          </button>

          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Menampilkan {displayedRows.length} baris ({displayedRows.length * colCount} slot)
          </span>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Kolom ke-5 (J) = Jumlah / Biji 2D</span>
        </div>
      </div>

      {/* Tabel Matriks Paito Angkanet */}
      <div
        className={`overflow-x-auto rounded-xl border shadow-2xl transition-colors ${
          theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-950 border-white/[0.12]'
        }`}
      >
        <table
          className="w-full border-collapse text-center select-none font-mono"
          style={{ minWidth: `${colCount * 130}px` }}
        >
          {/* Header 1: Nama Kolom / Hari */}
          <thead>
            <tr
              className={`border-b text-xs font-bold uppercase tracking-wider ${
                theme === 'light'
                  ? 'bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-white/[0.1] text-slate-200'
              }`}
            >
              <th className="py-2 px-1 text-[10px] w-10 border-r border-slate-400/20">
                No
              </th>
              {colHeaders.map((colName, idx) => (
                <th
                  key={idx}
                  colSpan={5}
                  className="py-2 px-1 border-r last:border-r-0 border-slate-400/30 text-center tracking-wider"
                >
                  {colName}
                </th>
              ))}
            </tr>

            {/* Header 2: Sub-posisi A, C, K, E, J */}
            <tr
              className={`border-b text-[10px] font-bold ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-slate-600'
                  : 'bg-slate-900/60 border-white/[0.08] text-slate-400'
              }`}
            >
              <th className="py-1 px-0.5 border-r border-slate-400/20 text-[9px]">
                Br#
              </th>
              {Array.from({ length: colCount }).map((_, cIdx) => (
                <React.Fragment key={cIdx}>
                  <th className="py-1 w-6 border-r border-slate-400/20 text-[#e38204]">A</th>
                  <th className="py-1 w-6 border-r border-slate-400/20 text-[#8e44ad]">C</th>
                  <th className="py-1 w-6 border-r border-slate-400/20 text-[#f80000]">K</th>
                  <th className="py-1 w-6 border-r border-slate-400/20 text-[#27ae60]">E</th>
                  <th className="py-1 w-6 border-r last:border-r-0 border-slate-400/40 text-[#0ea5e9] bg-slate-500/10">J</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-slate-400/15 text-xs">
            {displayedRows.map((rowDraws, rIdx) => {
              // Striping setiap baris ke-5 (nth-child 5n+1 ala Angkanet)
              const isFifthRow = (displayedRows.length - rIdx) % 5 === 1;
              const rowBgClass = isFifthRow
                ? theme === 'light'
                  ? 'bg-slate-200/80'
                  : 'bg-slate-800/40'
                : '';

              return (
                <tr
                  key={rIdx}
                  className={`hover:bg-cyan-500/[0.04] transition-colors ${rowBgClass}`}
                >
                  {/* Row Number */}
                  <td
                    className={`py-1 px-1 text-[10px] font-bold border-r border-slate-400/20 text-slate-500`}
                  >
                    {sortOrder === 'newest_top' ? displayedRows.length - rIdx : rIdx + 1}
                  </td>

                  {/* Draws in this row */}
                  {rowDraws.map((item, dIdx) => {
                    if (!item) {
                      return (
                        <React.Fragment key={dIdx}>
                          <td className="py-1.5 border-r border-slate-400/15 text-slate-700">-</td>
                          <td className="py-1.5 border-r border-slate-400/15 text-slate-700">-</td>
                          <td className="py-1.5 border-r border-slate-400/15 text-slate-700">-</td>
                          <td className="py-1.5 border-r border-slate-400/15 text-slate-700">-</td>
                          <td className="py-1.5 border-r last:border-r-0 border-slate-400/30 text-slate-700 bg-slate-500/5">-</td>
                        </React.Fragment>
                      );
                    }

                    const tooltipText = `Putaran #${item.index} | 4D: ${item.full} | 2D: ${item.kepala}${item.ekor} | Biji: ${item.biji} | Shio: ${item.shioName || ''} | ${item.besarKecil} ${item.ganjilGenap}`;

                    return (
                      <React.Fragment key={item.index}>
                        {/* 1. AS */}
                        <td
                          onClick={() => onCellClick(item, 'as')}
                          title={tooltipText}
                          style={getCellStyle(item, 'as')}
                          className="py-1.5 sm:py-2 border-r border-slate-400/20 cursor-pointer hover:opacity-80 active:scale-95 transition-all text-xs sm:text-sm"
                        >
                          {item.as}
                        </td>

                        {/* 2. KOP */}
                        <td
                          onClick={() => onCellClick(item, 'kop')}
                          title={tooltipText}
                          style={getCellStyle(item, 'kop')}
                          className="py-1.5 sm:py-2 border-r border-slate-400/20 cursor-pointer hover:opacity-80 active:scale-95 transition-all text-xs sm:text-sm"
                        >
                          {item.kop}
                        </td>

                        {/* 3. KEPALA */}
                        <td
                          onClick={() => onCellClick(item, 'kepala')}
                          title={tooltipText}
                          style={getCellStyle(item, 'kepala')}
                          className="py-1.5 sm:py-2 border-r border-slate-400/20 cursor-pointer hover:opacity-80 active:scale-95 transition-all text-xs sm:text-sm"
                        >
                          {item.kepala}
                        </td>

                        {/* 4. EKOR */}
                        <td
                          onClick={() => onCellClick(item, 'ekor')}
                          title={tooltipText}
                          style={getCellStyle(item, 'ekor')}
                          className="py-1.5 sm:py-2 border-r border-slate-400/20 cursor-pointer hover:opacity-80 active:scale-95 transition-all text-xs sm:text-sm"
                        >
                          {item.ekor}
                        </td>

                        {/* 5. JUMLAH / BIJI (asux) */}
                        <td
                          onClick={() => onCellClick(item, 'jumlah')}
                          title={`Jumlah / Biji: ${item.biji} (${tooltipText})`}
                          style={getCellStyle(item, 'jumlah')}
                          className="py-1.5 sm:py-2 border-r last:border-r-0 border-slate-400/40 cursor-pointer hover:opacity-80 active:scale-95 transition-all text-xs sm:text-sm"
                        >
                          {item.biji}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
