import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { HistoryItem, PaitoMacroPrediction, PredictionResult } from '../engine/types';
import { predictPaitoMacro } from '../engine/paitoPredictor';
import { SHIO_2026_LIST } from '../engine/shio';
import { PaitoPredictionCard } from './PaitoPredictionCard';
import { Heatmap2DView } from './Heatmap2DView';
import { PaitoAngkanetToolbar } from './PaitoAngkanetToolbar';
import { PaitoNavIntersectBar } from './PaitoNavIntersectBar';
import { PaitoAngkanetGrid } from './PaitoAngkanetGrid';
import {
  Calendar,
  Table,
  Flame,
  Search,
  X,
  Copy,
  Check,
  Star
} from 'lucide-react';

interface HistoryPaitoTableProps {
  historyItems: HistoryItem[];
  marketName: string;
  paitoPrediction?: PaitoMacroPrediction | null;
  prediction?: PredictionResult | null;
  onToast?: (msg: string) => void;
}

export const HistoryPaitoTable: React.FC<HistoryPaitoTableProps> = ({
  historyItems,
  marketName,
  paitoPrediction,
  prediction,
  onToast
}) => {
  // Mode Tampilan: 'grid' (Paito Matriks Angkanet), 'table' (Rekap Tabel Kolom), 'heatmap' (10x10)
  const [subTab, setSubTab] = useState<'grid' | 'table' | 'heatmap'>('grid');

  // Pengaturan Grid Dinamis (5, 6, 7 col)
  const initialCol = useMemo(() => {
    const isSgp = marketName.toLowerCase().includes('sgp') || marketName.toLowerCase().includes('singapore');
    return isSgp ? 5 : 7;
  }, [marketName]);

  const [colCount, setColCount] = useState<number>(initialCol);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [rowsLimit, setRowsLimit] = useState<number>(35);

  // Palette Kuas Warna (Default Kuning Angkanet)
  const [activeColor, setActiveColor] = useState<string>('#f39c12');
  const [paintedColors, setPaintedColors] = useState<Record<string, string>>({});
  const [jarak, setJarak] = useState<number>(1);

  // Muat warna cat tersimpan saat pasaran berubah
  useEffect(() => {
    try {
      const storageKey = `newera_paito_painted_${marketName}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPaintedColors(JSON.parse(saved));
      } else {
        setPaintedColors({});
      }

      const savedCol = localStorage.getItem(`newera_paito_col_${marketName}`);
      if (savedCol) {
        setColCount(Number(savedCol));
      } else {
        setColCount(initialCol);
      }
    } catch {
      setPaintedColors({});
    }
  }, [marketName, initialCol]);

  // Simpan perubahan colCount
  const handleColCountChange = (cols: number) => {
    setColCount(cols);
    try {
      localStorage.setItem(`newera_paito_col_${marketName}`, cols.toString());
    } catch {}
  };

  // Simpan warna ke localStorage
  const saveColorsToStorage = useCallback(
    (colors: Record<string, string>) => {
      try {
        localStorage.setItem(`newera_paito_painted_${marketName}`, JSON.stringify(colors));
      } catch {}
    },
    [marketName]
  );

  // Klik sel pada paito matriks
  const handleCellClick = useCallback(
    (item: HistoryItem, pos: 'as' | 'kop' | 'kepala' | 'ekor' | 'jumlah') => {
      setPaintedColors((prev) => {
        const next = { ...prev };
        const key = `draw_${item.index}_${pos}`;

        if (activeColor === 'eraser') {
          delete next[key];
        } else {
          next[key] = activeColor;
        }

        saveColorsToStorage(next);
        return next;
      });
    },
    [activeColor, saveColorsToStorage]
  );

  // Reset semua coretan warna
  const handleReset = useCallback(() => {
    setPaintedColors({});
    try {
      localStorage.removeItem(`newera_paito_painted_${marketName}`);
    } catch {}
    if (onToast) onToast('Semua coretan paito warna berhasil direset!');
  }, [marketName, onToast]);

  // Handler Kancing Navigasi Tarikan Intersect (A, C, K, E, J, Depan, Lurus)
  const handleNavigate = useCallback(
    (
      target: 'as' | 'kop' | 'kepala' | 'ekor' | 'jumlah' | 'depan' | 'lurus',
      _dir: -1 | 1
    ) => {
      if (!historyItems || historyItems.length === 0) return;
      const latestItem = historyItems[historyItems.length - 1];
      const colorToApply = activeColor === 'eraser' ? '#f39c12' : activeColor;

      let targetVal: any = null;
      if (target === 'as') targetVal = latestItem.as;
      else if (target === 'kop') targetVal = latestItem.kop;
      else if (target === 'kepala') targetVal = latestItem.kepala;
      else if (target === 'ekor') targetVal = latestItem.ekor;
      else if (target === 'jumlah') targetVal = latestItem.biji;
      else if (target === 'depan') targetVal = `${latestItem.as}${latestItem.kop}`;
      else if (target === 'lurus') targetVal = `${latestItem.kepala}${latestItem.ekor}`;

      let matchCount = 0;
      setPaintedColors((prev) => {
        const next = { ...prev };
        for (let i = historyItems.length - 1; i >= 0; i -= Math.max(1, jarak)) {
          const it = historyItems[i];
          if (!it) break;

          if (target === 'as' && it.as === targetVal) {
            next[`draw_${it.index}_as`] = colorToApply;
            matchCount++;
          } else if (target === 'kop' && it.kop === targetVal) {
            next[`draw_${it.index}_kop`] = colorToApply;
            matchCount++;
          } else if (target === 'kepala' && it.kepala === targetVal) {
            next[`draw_${it.index}_kepala`] = colorToApply;
            matchCount++;
          } else if (target === 'ekor' && it.ekor === targetVal) {
            next[`draw_${it.index}_ekor`] = colorToApply;
            matchCount++;
          } else if (target === 'jumlah' && it.biji === targetVal) {
            next[`draw_${it.index}_jumlah`] = colorToApply;
            matchCount++;
          } else if (target === 'depan' && `${it.as}${it.kop}` === targetVal) {
            next[`draw_${it.index}_as`] = colorToApply;
            next[`draw_${it.index}_kop`] = colorToApply;
            matchCount++;
          } else if (target === 'lurus' && `${it.kepala}${it.ekor}` === targetVal) {
            next[`draw_${it.index}_kepala`] = colorToApply;
            next[`draw_${it.index}_ekor`] = colorToApply;
            matchCount++;
          }
        }
        saveColorsToStorage(next);
        return next;
      });

      if (onToast) {
        onToast(`🎯 Menyorot ${matchCount} kuncian ${target.toUpperCase()} [${targetVal}] jarak ${jarak} baris!`);
      }
    },
    [historyItems, activeColor, jarak, saveColorsToStorage, onToast]
  );

  const paintedCount = useMemo(() => Object.keys(paintedColors).length, [paintedColors]);

  // Prediksi Makro
  const computedPrediction = useMemo(() => {
    if (paitoPrediction) return paitoPrediction;
    const h2D: [number, number][] = historyItems.map((item) => [item.kepala, item.ekor]);
    return predictPaitoMacro(h2D);
  }, [paitoPrediction, historyItems]);

  const history2D: [number, number][] = useMemo(
    () => historyItems.map((item) => [item.kepala, item.ekor]),
    [historyItems]
  );

  // Filter untuk mode tabel rekap vertikal
  const [filterTwinOnly, setFilterTwinOnly] = useState(false);
  const [filterBiji, setFilterBiji] = useState<'all' | 'top3' | number>('all');
  const [filterParity, setFilterParity] = useState<string>('all');
  const [filterShio, setFilterShio] = useState<'all' | 'top3' | 'j1' | 'j2' | 'j3' | number>('all');
  const [searchDigit, setSearchDigit] = useState<string>('');
  const [tableLimit, setTableLimit] = useState<number>(25);
  const [copied, setCopied] = useState(false);

  const reversed = useMemo(() => [...historyItems].reverse(), [historyItems]);

  const filtered = useMemo(() => {
    return reversed.filter((item) => {
      if (filterTwinOnly && !item.isTwin) return false;
      if (filterBiji === 'top3') {
        if (!computedPrediction.topBiji.includes(item.biji)) return false;
      } else if (typeof filterBiji === 'number') {
        if (item.biji !== filterBiji) return false;
      }
      if (filterParity !== 'all') {
        if (item.ganjilGenap !== filterParity) return false;
      }
      if (filterShio === 'top3') {
        if (!computedPrediction.topShios.includes(item.shioNumber ?? 0)) return false;
      } else if (filterShio === 'j1') {
        if (item.shioJalur !== 1) return false;
      } else if (filterShio === 'j2') {
        if (item.shioJalur !== 2) return false;
      } else if (filterShio === 'j3') {
        if (item.shioJalur !== 3) return false;
      } else if (typeof filterShio === 'number') {
        if (item.shioNumber !== filterShio) return false;
      }
      if (searchDigit.trim()) {
        const query = searchDigit.trim();
        const comb2D = `${item.kepala}${item.ekor}`;
        const draw4D = `${item.as}${item.kop}${item.kepala}${item.ekor}`;
        if (!comb2D.includes(query) && !draw4D.includes(query)) return false;
      }
      return true;
    });
  }, [reversed, filterTwinOnly, filterBiji, filterParity, filterShio, searchDigit, computedPrediction]);

  const displayedTable = useMemo(() => filtered.slice(0, tableLimit), [filtered, tableLimit]);

  const handleCopyPaito = () => {
    const lines = displayedTable.map(
      (d) =>
        `#${d.index}\t${d.full}\t${d.kepala}${d.ekor}\t${d.shioEmoji || ''} ${d.shioName || ''} (${d.shioNumber || ''}) [J${d.shioJalur || ''}]\t${d.isTwin ? 'TWIN' : '-'}\tBiji:${d.biji}\t${d.besarKecil}\t${d.ganjilGenap}`
    );
    const header = `=== REKAP PAITO ${marketName} (${displayedTable.length} PUTARAN) ===\nNo\tResult 4D\tTarget 2D\tShio 2026\tTwin\tBiji\tKategori\tPola`;
    navigator.clipboard.writeText([header, ...lines].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. BAGIAN ATAS: INTERACTIVE PAITO COLOR PLAYGROUND       */}
      {/* ======================================================== */}
      <div className="space-y-3">
        {/* Top Header & Sub-Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-white/[0.1] p-3 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Paito Warna {marketName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold">
                  {colCount} KOLOM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Papan paito matriks digit (As, Kop, Kepala, Ekor, Jumlah). Mainkan kuas warna & telusuri kuncian tarikan.
              </p>
            </div>
          </div>

          {/* Switcher: Matriks Angkanet vs Rekap Tabel vs Heatmap */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
            <button
              onClick={() => setSubTab('grid')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Paito Matriks ({colCount} Col)</span>
            </button>

            <button
              onClick={() => setSubTab('table')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'table'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Rekap Kolom</span>
            </button>

            <button
              onClick={() => setSubTab('heatmap')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'heatmap'
                  ? 'bg-rose-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heatmap 10x10</span>
            </button>
          </div>
        </div>

        {/* Jika mode grid paito matriks: Tampilkan Toolbar Kuas & Kancing Tarikan Angkanet */}
        {subTab === 'grid' && (
          <div className="space-y-2.5">
            <PaitoAngkanetToolbar
              colCount={colCount}
              setColCount={handleColCountChange}
              theme={theme}
              setTheme={setTheme}
              rowsLimit={rowsLimit}
              setRowsLimit={setRowsLimit}
              activeColor={activeColor}
              onSelectColor={setActiveColor}
              onReset={handleReset}
              paintedCount={paintedCount}
              marketName={marketName}
            />

            <PaitoNavIntersectBar
              jarak={jarak}
              setJarak={setJarak}
              onNavigate={handleNavigate}
              theme={theme}
            />

            <PaitoAngkanetGrid
              historyItems={historyItems}
              colCount={colCount}
              theme={theme}
              rowsLimit={rowsLimit}
              paintedColors={paintedColors}
              onCellClick={handleCellClick}
            />
          </div>
        )}

        {/* Mode Rekap Tabel Kolom */}
        {subTab === 'table' && (
          <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] bg-slate-900/90 shadow-xl space-y-3">
            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-white/[0.06] text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari digit / 2D..."
                    value={searchDigit}
                    onChange={(e) => setSearchDigit(e.target.value)}
                    className="pl-8 pr-7 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-200 text-xs w-36 sm:w-44 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {searchDigit && (
                    <button
                      onClick={() => setSearchDigit('')}
                      className="absolute right-2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={filterBiji}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all' || val === 'top3') setFilterBiji(val);
                    else setFilterBiji(Number(val));
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs font-mono cursor-pointer"
                >
                  <option value="all">Semua Biji</option>
                  <option value="top3">★ Top 3 Biji ({computedPrediction.topBiji.join(',')})</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
                    <option key={b} value={b}>
                      Biji {b}
                    </option>
                  ))}
                </select>

                <select
                  value={filterParity}
                  onChange={(e) => setFilterParity(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs font-mono cursor-pointer"
                >
                  <option value="all">Semua Paritas</option>
                  <option value="Genap-Genap">Genap-Genap</option>
                  <option value="Genap-Ganjil">Genap-Ganjil</option>
                  <option value="Ganjil-Genap">Ganjil-Genap</option>
                  <option value="Ganjil-Ganjil">Ganjil-Ganjil</option>
                </select>

                <select
                  value={filterShio}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all' || val === 'top3' || val === 'j1' || val === 'j2' || val === 'j3') {
                      setFilterShio(val);
                    } else {
                      setFilterShio(Number(val));
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs font-mono cursor-pointer"
                >
                  <option value="all">Semua Shio 2026</option>
                  <option value="top3">★ Top 3 Shio ({computedPrediction.topShios.join(',')})</option>
                  <option value="j1">Jalur I</option>
                  <option value="j2">Jalur II</option>
                  <option value="j3">Jalur III</option>
                  {SHIO_2026_LIST.map((s) => (
                    <option key={s.no} value={s.no}>
                      {s.emoji} {String(s.no).padStart(2, '0')} {s.name} [J{s.jalur}]
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setFilterTwinOnly(!filterTwinOnly)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    filterTwinOnly
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-slate-950 border-white/[0.1] text-slate-400 hover:text-white'
                  }`}
                >
                  {filterTwinOnly ? 'Twin Aktif' : 'Twin Saja'}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={tableLimit}
                  onChange={(e) => setTableLimit(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs font-mono cursor-pointer"
                >
                  <option value={15}>15 Data</option>
                  <option value={25}>25 Data</option>
                  <option value={50}>50 Data</option>
                  <option value={100}>100 Data</option>
                  <option value={99999}>Semua ({historyItems.length})</option>
                </select>

                <button
                  onClick={handleCopyPaito}
                  className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-slate-950 text-slate-300 hover:text-white flex items-center space-x-1.5 text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-white/[0.08] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Result 4D</th>
                    <th className="py-2.5 px-3">Target 2D</th>
                    <th className="py-2.5 px-3">Shio 2026</th>
                    <th className="py-2.5 px-3">Twin</th>
                    <th className="py-2.5 px-3">Biji</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Pola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono">
                  {displayedTable.map((item) => (
                    <tr key={item.index} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-3 text-slate-500 text-[11px]">#{item.index}</td>
                      <td className="py-2 px-3">
                        <span className="text-slate-400">{item.as}{item.kop}</span>
                        <span className="text-emerald-400 font-bold">{item.kepala}{item.ekor}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-bold">
                          {item.kepala}{item.ekor}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {item.shio && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[11px] bg-slate-900 border border-white/10">
                            <span>{item.shioEmoji}</span>
                            <span>{item.shioName}</span>
                            <span className="text-[9px] text-slate-400">J{item.shioJalur}</span>
                            {computedPrediction.topShios.includes(item.shioNumber ?? 0) && (
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 ml-0.5" />
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {item.isTwin ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            TWIN
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-cyan-400">{item.biji}</td>
                      <td className="py-2 px-3">
                        <span className="text-slate-300">{item.besarKecil}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">{item.ganjilGenap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mode Heatmap 10x10 */}
        {subTab === 'heatmap' && (
          <Heatmap2DView
            history2D={history2D}
            marketName={marketName}
            prediction={prediction}
            polaTarung={prediction?.polaTarung}
            onToast={onToast}
          />
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. BAGIAN BAWAH: PUSAT PREDIKSI PAITO 2D TERPADU         */}
      {/* ======================================================== */}
      <PaitoPredictionCard
        prediction={computedPrediction}
        marketName={marketName}
        historyItems={historyItems}
        polaTarung={prediction?.polaTarung}
        paitoBBFS7={prediction?.paitoBBFS7}
        onToast={onToast}
      />
    </div>
  );
};
