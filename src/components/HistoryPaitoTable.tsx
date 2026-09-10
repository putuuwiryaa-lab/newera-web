import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { HistoryItem, PaitoMacroPrediction, PredictionResult } from '../engine/types';
import { predictPaitoMacro } from '../engine/paitoPredictor';
import { SHIO_2026_LIST } from '../engine/shio';
import { PaitoPredictionCard } from './PaitoPredictionCard';
import { Heatmap2DView } from './Heatmap2DView';
import { PaitoColorPaletteBar, getPaitoColorStyle } from './PaitoColorPaletteBar';
import { PaitoDailyGrid } from './PaitoDailyGrid';
import {
  Search,
  X,
  Copy,
  Check,
  Star,
  Flame,
  Calendar,
  Table
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
  // Pilihan Sub-Tab di Paito Playground: 'grid' (Sen-Min), 'table' (Rekap Kolom), 'heatmap' (10x10)
  const [subTab, setSubTab] = useState<'grid' | 'table' | 'heatmap'>('grid');

  // Palette Kuas Warna Interaktif
  const [activeBrush, setActiveBrush] = useState<string>('yellow');
  const [paintedColors, setPaintedColors] = useState<Record<string, string>>({});

  // Muat warna cat tersimpan dari localStorage saat marketName berubah
  useEffect(() => {
    try {
      const storageKey = `newera_paito_painted_${marketName}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPaintedColors(JSON.parse(saved));
      } else {
        setPaintedColors({});
      }
    } catch {
      setPaintedColors({});
    }
  }, [marketName]);

  // Simpan perubahan warna cat ke localStorage
  const saveColorsToStorage = useCallback((colors: Record<string, string>) => {
    try {
      const storageKey = `newera_paito_painted_${marketName}`;
      localStorage.setItem(storageKey, JSON.stringify(colors));
    } catch {
      // ignore
    }
  }, [marketName]);

  // Handler klik sel paito (mewarnai atau menghapus)
  const handleCellClick = useCallback((
    item: HistoryItem,
    part: 'full' | 'as' | 'kop' | 'kepala' | 'ekor' | '2d' = '2d'
  ) => {
    setPaintedColors((prev) => {
      const next = { ...prev };
      const key = `draw_${item.index}_${part}`;

      if (activeBrush === 'eraser') {
        delete next[key];
        if (part === '2d') {
          delete next[`draw_${item.index}_cell`];
          delete next[`draw_${item.index}_kepala`];
          delete next[`draw_${item.index}_ekor`];
        }
      } else {
        next[key] = activeBrush;
        if (part === '2d') {
          next[`draw_${item.index}_cell`] = activeBrush;
        }
      }

      saveColorsToStorage(next);
      return next;
    });
  }, [activeBrush, saveColorsToStorage]);

  // Handler power tool: Auto-Highlight digit & posisi
  const handleAutoHighlight = useCallback((
    digit: number,
    position: 'all' | 'as' | 'kop' | 'kepala' | 'ekor' | '2d',
    colorId: string
  ) => {
    let hitCount = 0;
    setPaintedColors((prev) => {
      const next = { ...prev };
      historyItems.forEach((item) => {
        if (position === 'all') {
          if (item.as === digit) { next[`draw_${item.index}_as`] = colorId; hitCount++; }
          if (item.kop === digit) { next[`draw_${item.index}_kop`] = colorId; hitCount++; }
          if (item.kepala === digit) { next[`draw_${item.index}_kepala`] = colorId; hitCount++; }
          if (item.ekor === digit) { next[`draw_${item.index}_ekor`] = colorId; hitCount++; }
          if (item.kepala === digit || item.ekor === digit) {
            next[`draw_${item.index}_2d`] = colorId;
            next[`draw_${item.index}_cell`] = colorId;
          }
        } else if (position === 'as' && item.as === digit) {
          next[`draw_${item.index}_as`] = colorId;
          hitCount++;
        } else if (position === 'kop' && item.kop === digit) {
          next[`draw_${item.index}_kop`] = colorId;
          hitCount++;
        } else if (position === 'kepala' && item.kepala === digit) {
          next[`draw_${item.index}_kepala`] = colorId;
          next[`draw_${item.index}_2d`] = colorId;
          next[`draw_${item.index}_cell`] = colorId;
          hitCount++;
        } else if (position === 'ekor' && item.ekor === digit) {
          next[`draw_${item.index}_ekor`] = colorId;
          next[`draw_${item.index}_2d`] = colorId;
          next[`draw_${item.index}_cell`] = colorId;
          hitCount++;
        } else if (position === '2d' && (item.kepala === digit || item.ekor === digit)) {
          next[`draw_${item.index}_2d`] = colorId;
          next[`draw_${item.index}_cell`] = colorId;
          hitCount++;
        }
      });
      saveColorsToStorage(next);
      return next;
    });

    if (onToast) {
      onToast(`⚡ ${hitCount} angka ${digit} berhasil disorot dengan warna cat!`);
    }
  }, [historyItems, saveColorsToStorage, onToast]);

  // Reset semua cat warna
  const handleClearAllPaint = useCallback(() => {
    setPaintedColors({});
    try {
      localStorage.removeItem(`newera_paito_painted_${marketName}`);
    } catch {}
    if (onToast) onToast('Semua coretan paito warna berhasil direset!');
  }, [marketName, onToast]);

  // Hitung jumlah sel/digit yang sedang diwarnai
  const paintedCount = useMemo(() => Object.keys(paintedColors).length, [paintedColors]);

  // Table Filter States
  const [filterTwinOnly, setFilterTwinOnly] = useState(false);
  const [filterBiji, setFilterBiji] = useState<'all' | 'top3' | number>('all');
  const [filterParity, setFilterParity] = useState<string>('all');
  const [filterShio, setFilterShio] = useState<'all' | 'top3' | 'j1' | 'j2' | 'j3' | number>('all');
  const [searchDigit, setSearchDigit] = useState<string>('');
  const [limit, setLimit] = useState<number>(25);
  const [copied, setCopied] = useState(false);

  const history2D: [number, number][] = useMemo(
    () => historyItems.map((item) => [item.kepala, item.ekor]),
    [historyItems]
  );

  const computedPrediction = useMemo(() => {
    if (paitoPrediction) return paitoPrediction;
    const h2D: [number, number][] = historyItems.map((item) => [item.kepala, item.ekor]);
    return predictPaitoMacro(h2D);
  }, [paitoPrediction, historyItems]);

  // Urutan terbaru di depan untuk mode tabel
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

  const displayed = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  const handleCopyPaito = () => {
    const lines = displayed.map(
      (d) =>
        `#${d.index}	${d.full}	${d.kepala}${d.ekor}	${d.shioEmoji || ''} ${d.shioName || ''} (${d.shioNumber || ''}) [J${d.shioJalur || ''}]	${d.isTwin ? 'TWIN' : '-'}	Biji:${d.biji}	${d.besarKecil}	${d.ganjilGenap}`
    );
    const header = `=== REKAP PAITO ${marketName} (${displayed.length} PUTARAN) ===\nNo\tResult 4D\tTarget 2D\tShio 2026\tTwin\tBiji\tKategori\tPola`;
    navigator.clipboard.writeText([header, ...lines].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Statistik sampel dari data tabel yang ditampilkan
  const stats = useMemo(() => {
    if (displayed.length === 0) return { twinPct: 0, besarPct: 0, genapPct: 0, j1Pct: 0, j2Pct: 0, j3Pct: 0 };
    const twins = displayed.filter((d) => d.isTwin).length;
    const besars = displayed.filter((d) => d.besarKecil === 'Besar').length;
    const genaps = displayed.filter((d) => d.ganjilGenap.includes('Genap')).length;
    const j1 = displayed.filter((d) => d.shioJalur === 1).length;
    const j2 = displayed.filter((d) => d.shioJalur === 2).length;
    const j3 = displayed.filter((d) => d.shioJalur === 3).length;

    return {
      twinPct: Math.round((twins / displayed.length) * 100),
      besarPct: Math.round((besars / displayed.length) * 100),
      genapPct: Math.round((genaps / displayed.length) * 100),
      j1Pct: Math.round((j1 / displayed.length) * 100),
      j2Pct: Math.round((j2 / displayed.length) * 100),
      j3Pct: Math.round((j3 / displayed.length) * 100)
    };
  }, [displayed]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. BAGIAN ATAS: INTERACTIVE PAITO COLOR PLAYGROUND       */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.1] bg-slate-900/90 shadow-2xl space-y-4">
        {/* Top Header & Sub-Tab Navigation Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Paito Warna Interaktif
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold">
                  {marketName}
                </span>
                <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300">
                  {historyItems.length} Putaran
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tabel paito profesional: Tandai tarikan angka dengan palet kuas warna, sorot digit cepat, dan telusuri siklus harian.
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher (Grid Sen-Min vs Rekap Kolom vs Heatmap) */}
          <div className="flex items-center space-x-1.5 bg-slate-950/90 border border-white/[0.1] p-1 rounded-2xl self-start md:self-auto shadow-inner">
            <button
              onClick={() => setSubTab('grid')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>📅 Paito Harian (Sen–Min)</span>
            </button>

            <button
              onClick={() => setSubTab('table')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'table'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>📋 Rekap Tabel Kolom</span>
            </button>

            <button
              onClick={() => setSubTab('heatmap')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'heatmap'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>🔥 Heatmap 10x10</span>
            </button>
          </div>
        </div>

        {/* Palet Kuas Warna Interaktif (Tampil di semua sub-view paito) */}
        {subTab !== 'heatmap' && (
          <PaitoColorPaletteBar
            activeColor={activeBrush}
            onSelectColor={setActiveBrush}
            onClearAll={handleClearAllPaint}
            paintedCount={paintedCount}
            onAutoHighlight={handleAutoHighlight}
            marketName={marketName}
          />
        )}

        {/* View 1: Paito Warna Harian (Grid 7 Hari Sen-Min) */}
        {subTab === 'grid' && (
          <PaitoDailyGrid
            historyItems={historyItems}
            marketName={marketName}
            paintedColors={paintedColors}
            onCellClick={handleCellClick}
          />
        )}

        {/* View 2: Paito Rekap Kolom Lengkap */}
        {subTab === 'table' && (
          <div className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06] text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search by digit */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari digit / 2D..."
                    value={searchDigit}
                    onChange={(e) => setSearchDigit(e.target.value)}
                    className="pl-8 pr-7 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-200 text-xs w-36 sm:w-44 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
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

                {/* Filter Biji */}
                <select
                  value={typeof filterBiji === 'number' ? filterBiji : filterBiji}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all' || val === 'top3') setFilterBiji(val);
                    else setFilterBiji(Number(val));
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="all">Semua Biji</option>
                  <option value="top3">★ Top 3 Biji ({computedPrediction.topBiji.join(',')})</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
                    <option key={b} value={b}>
                      Biji {b}
                    </option>
                  ))}
                </select>

                {/* Filter Paritas */}
                <select
                  value={filterParity}
                  onChange={(e) => setFilterParity(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="all">Semua Pola Paritas</option>
                  <option value="Genap-Genap">Genap-Genap</option>
                  <option value="Genap-Ganjil">Genap-Ganjil</option>
                  <option value="Ganjil-Genap">Ganjil-Genap</option>
                  <option value="Ganjil-Ganjil">Ganjil-Ganjil</option>
                </select>

                {/* Filter Shio 2026 */}
                <select
                  value={typeof filterShio === 'number' ? filterShio : filterShio}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all' || val === 'top3' || val === 'j1' || val === 'j2' || val === 'j3') {
                      setFilterShio(val);
                    } else {
                      setFilterShio(Number(val));
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="all">Semua Shio 2026</option>
                  <option value="top3">★ Top 3 Shio ({computedPrediction.topShios.join(',')})</option>
                  <option value="j1">Jalur I (Kuda, Kelinci, Tikus, Ayam)</option>
                  <option value="j2">Jalur II (Ular, Harimau, Babi, Monyet)</option>
                  <option value="j3">Jalur III (Naga, Kerbau, Anjing, Kambing)</option>
                  {SHIO_2026_LIST.map((s) => (
                    <option key={s.no} value={s.no}>
                      {s.emoji} {String(s.no).padStart(2, '0')} {s.name} [J{s.jalur}]
                    </option>
                  ))}
                </select>

                {/* Twin Toggle */}
                <button
                  onClick={() => setFilterTwinOnly(!filterTwinOnly)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    filterTwinOnly
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm'
                      : 'bg-slate-950 border-white/[0.1] text-slate-400 hover:text-white'
                  }`}
                >
                  {filterTwinOnly ? 'Twin Aktif' : 'Twin Saja'}
                </button>
              </div>

              {/* Right Controls: Limit & Copy */}
              <div className="flex items-center space-x-2">
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-950 border border-white/[0.1] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value={15}>15 Data</option>
                  <option value={25}>25 Data</option>
                  <option value={50}>50 Data</option>
                  <option value={100}>100 Data</option>
                  <option value={200}>200 Data</option>
                  <option value={500}>500 Data</option>
                  <option value={99999}>Semua ({historyItems.length})</option>
                </select>

                <button
                  onClick={handleCopyPaito}
                  className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-slate-950 text-slate-300 hover:text-white flex items-center space-x-1.5 text-xs font-semibold transition-colors shadow-sm"
                  title="Salin data tabel paito yang tampil"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Mini Stat Summary Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-white/[0.06]">
              <span className="text-slate-400 font-sans text-[11px] mr-1">Statistik Sampel:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                Twin: <strong className="text-rose-400">{stats.twinPct}%</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                Besar: <strong className="text-amber-400">{stats.besarPct}%</strong> | Kecil: <strong className="text-cyan-400">{100 - stats.besarPct}%</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                Genap: <strong className="text-emerald-400">{stats.genapPct}%</strong> | Ganjil: <strong className="text-purple-400">{100 - stats.genapPct}%</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                Jalur: <strong className="text-amber-400">J1:{stats.j1Pct}%</strong> | <strong className="text-emerald-400">J2:{stats.j2Pct}%</strong> | <strong className="text-purple-400">J3:{stats.j3Pct}%</strong>
              </span>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-white/[0.08] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 font-medium">No</th>
                    <th className="py-3 px-3 font-medium">Result 4D (Klik Warnai)</th>
                    <th className="py-3 px-3 font-medium">Target 2D</th>
                    <th className="py-3 px-3 font-medium">Shio 2026</th>
                    <th className="py-3 px-3 font-medium">Status Twin</th>
                    <th className="py-3 px-3 font-medium">Biji 2D</th>
                    <th className="py-3 px-3 font-medium">Kategori</th>
                    <th className="py-3 px-3 text-right font-medium">Pola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono">
                  {displayed.map((item) => {
                    const colorAs = paintedColors[`draw_${item.index}_as`];
                    const colorKop = paintedColors[`draw_${item.index}_kop`];
                    const colorKepala = paintedColors[`draw_${item.index}_kepala`];
                    const colorEkor = paintedColors[`draw_${item.index}_ekor`];
                    const color2D = paintedColors[`draw_${item.index}_2d`];

                    return (
                      <tr key={item.index} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          #{item.index}
                        </td>

                        {/* Result 4D: Setiap digit adalah chip interaktif yang bisa diklik warnai */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1 font-mono text-xs">
                            <span
                              onClick={() => handleCellClick(item, 'as')}
                              title="Klik untuk mewarnai digit As"
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                                colorAs
                                  ? `${getPaitoColorStyle(colorAs)} shadow-sm ring-1 ring-white/30`
                                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {item.as}
                            </span>
                            <span
                              onClick={() => handleCellClick(item, 'kop')}
                              title="Klik untuk mewarnai digit Kop"
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                                colorKop
                                  ? `${getPaitoColorStyle(colorKop)} shadow-sm ring-1 ring-white/30`
                                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {item.kop}
                            </span>
                            <span
                              onClick={() => handleCellClick(item, 'kepala')}
                              title="Klik untuk mewarnai digit Kepala"
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                                colorKepala
                                  ? `${getPaitoColorStyle(colorKepala)} shadow-sm ring-1 ring-white/30`
                                  : 'text-emerald-400 font-extrabold hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {item.kepala}
                            </span>
                            <span
                              onClick={() => handleCellClick(item, 'ekor')}
                              title="Klik untuk mewarnai digit Ekor"
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                                colorEkor
                                  ? `${getPaitoColorStyle(colorEkor)} shadow-sm ring-1 ring-white/30`
                                  : 'text-emerald-400 font-extrabold hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {item.ekor}
                            </span>
                          </div>
                        </td>

                        {/* Target 2D Badge */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleCellClick(item, '2d')}
                            title="Klik untuk mewarnai target 2D"
                            className={`px-2.5 py-0.5 rounded-md font-bold tracking-wider shadow-sm transition-all cursor-pointer ${
                              color2D
                                ? `${getPaitoColorStyle(color2D)} ring-1 ring-white/40`
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:border-emerald-400'
                            }`}
                          >
                            {item.kepala}{item.ekor}
                          </button>
                        </td>

                        {/* Shio 2026 */}
                        <td className="py-2.5 px-3">
                          {item.shio ? (
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                item.shioJalur === 1
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                  : item.shioJalur === 2
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                  : 'bg-purple-500/10 text-purple-300 border-purple-500/25'
                              } ${
                                computedPrediction.topShios.includes(item.shioNumber ?? 0)
                                  ? 'ring-1 ring-amber-400/50 shadow-sm'
                                  : ''
                              }`}
                            >
                              <span>{item.shioEmoji}</span>
                              <span className="font-bold">{item.shioName}</span>
                              <span className="text-[9px] opacity-75">({String(item.shioNumber).padStart(2, '0')})</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/90 font-mono ml-0.5">
                                J{item.shioJalur}
                              </span>
                              {computedPrediction.topShios.includes(item.shioNumber ?? 0) && (
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 ml-0.5" />
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Twin Status */}
                        <td className="py-2.5 px-3">
                          {item.isTwin ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold">
                              TWIN ({item.kepala}{item.ekor})
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Biji 2D */}
                        <td className="py-2.5 px-3 font-bold">
                          {computedPrediction.topBiji.includes(item.biji) ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] shadow-sm font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{item.biji}</span>
                            </span>
                          ) : (
                            <span className="text-cyan-400">{item.biji}</span>
                          )}
                        </td>

                        {/* Kategori B/K */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              item.besarKecil === 'Besar'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                            } ${
                              item.besarKecil === computedPrediction.primaryMagnitude
                                ? 'ring-1 ring-white/20'
                                : ''
                            }`}
                          >
                            {item.besarKecil}
                          </span>
                        </td>

                        {/* Pola Paritas */}
                        <td className="py-2.5 px-3 text-right text-[11px]">
                          {item.ganjilGenap === computedPrediction.primaryParity ? (
                            <span className="text-emerald-400 font-semibold inline-flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                              <span>{item.ganjilGenap}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">{item.ganjilGenap}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 3: Heatmap 10x10 Matriks */}
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
